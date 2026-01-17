/**
 * Core analysis functionality for GradeAI
 * Handles the complete pipeline: upload → extract → validate → analyze → save
 */

import { db } from '@/lib/db'
import { extractText, parseGermanTest } from '@/lib/ocr/vision'
import { analyzeTest as analyzeWithGroq } from '@/lib/ai/groq'
import { analyzeTest as analyzeWithGemini } from '@/lib/ai/gemini'
import { analyzeTest as analyzeWithDeepSeek } from '@/lib/ai/deepseek'
import { analyzeTest as analyzeWithClaude } from '@/lib/ai/claude'
import { convertGermanGrade } from '@/lib/ocr/gradeConverter'

/**
 * Smart AI provider selector with fallback logic
 * Priority: Gemini (free, best) → Groq (free, fast) → DeepSeek (cheap) → Claude (paid fallback)
 */
async function analyzeTest(params: Parameters<typeof analyzeWithGroq>[0]) {
  // Try Gemini first (free with generous limits, best quality)
  if (process.env.GEMINI_API_KEY) {
    try {
      console.log('[AI Provider] Using Gemini as primary provider')
      return await analyzeWithGemini(params)
    } catch (error) {
      console.warn('[AI Provider] Gemini failed:', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  // Try Groq second (free and fastest)
  if (process.env.GROQ_API_KEY) {
    try {
      console.log('[AI Provider] Using Groq as fallback provider')
      return await analyzeWithGroq(params)
    } catch (error) {
      console.warn('[AI Provider] Groq failed:', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  // Try DeepSeek third (very cheap)
  if (process.env.DEEPSEEK_API_KEY) {
    try {
      console.log('[AI Provider] Using DeepSeek as fallback provider')
      return await analyzeWithDeepSeek(params)
    } catch (error) {
      console.warn('[AI Provider] DeepSeek failed:', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  // Final fallback to Claude
  if (process.env.ANTHROPIC_API_KEY) {
    console.log('[AI Provider] Using Claude as final fallback provider')
    return await analyzeWithClaude(params)
  }

  throw new Error('No AI provider available - set at least one: GEMINI_API_KEY, GROQ_API_KEY, DEEPSEEK_API_KEY, or ANTHROPIC_API_KEY')
}

/**
 * Analysis function that processes file buffer(s) directly (Vercel serverless compatible)
 * Supports multiple buffers for multi-page tests
 */
export async function analyzeUploadBuffer(uploadId: string, fileBuffers: Buffer | Buffer[]): Promise<void> {
  // Convert single buffer to array for consistent handling
  const buffers = Array.isArray(fileBuffers) ? fileBuffers : [fileBuffers];
  const totalSize = buffers.reduce((sum, buf) => sum + buf.length, 0);

  console.log('='.repeat(80));
  console.log('[Analysis] Starting buffer-based analysis for upload:', uploadId);
  console.log('[Analysis] Number of files/pages:', buffers.length);
  console.log('[Analysis] Total buffer size:', totalSize, 'bytes');
  console.log('='.repeat(80));

  try {
    // Step 1: Fetch upload from database
    console.log('[Analysis] Step 1: Fetching upload from database...');
    const upload = await db.upload.findUnique({
      where: { id: uploadId },
      include: { child: true, user: true }
    });

    if (!upload) {
      throw new Error(`Upload not found: ${uploadId}`);
    }

    console.log('[Analysis] ✓ Upload found:', upload.fileName);
    console.log('[Analysis]   User:', upload.user?.email);
    console.log('[Analysis]   Child:', upload.child?.name);

    // Step 2: Update status to processing
    console.log('[Analysis] Step 2: Updating status to processing...');
    await db.upload.update({
      where: { id: uploadId },
      data: { analysisStatus: 'processing' }
    });
    console.log('[Analysis] ✓ Status updated to processing');

    // Step 3: Extract text with OCR from ALL pages
    console.log('[Analysis] Step 3: Extracting text with OCR from all pages...');
    let combinedExtractedText = '';
    
    for (let i = 0; i < buffers.length; i++) {
      console.log(`[Analysis]   Processing page ${i + 1}/${buffers.length}...`);
      const pageText = await extractText(buffers[i]);
      console.log(`[Analysis]   ✓ Page ${i + 1} extracted: ${pageText.length} characters`);
      
      if (buffers.length > 1) {
        combinedExtractedText += `\n\n--- PAGE ${i + 1} ---\n\n${pageText}`;
      } else {
        combinedExtractedText = pageText;
      }
    }

    const extractedText = combinedExtractedText;
    console.log('[Analysis] ✓ Total text extracted:', extractedText.length, 'characters');
    if (extractedText.length < 10) {
      throw new Error('Insufficient text extracted from images');
    }

    // Step 4: Three-stage validation
    console.log('[Analysis] Step 4: Running three-stage validation...');
    
    // Stage 1: Reject technical content
    if (containsTechnicalContent(extractedText)) {
      throw new Error('Technical diagram detected. Please upload a school test with grades and student work.');
    }
    console.log('[Analysis] ✓ Stage 1: Not technical content');

    // Stage 2: Verify school test content
    if (!isLikelySchoolTest(extractedText)) {
      throw new Error('This does not appear to be a school test. Please upload a German school test with questions, answers, and grades.');
    }
    console.log('[Analysis] ✓ Stage 2: Likely school test');

    // Stage 3: Ensure test is graded
    if (!isActualGradedTest(extractedText)) {
      throw new Error('This test does not appear to be graded yet. Please upload a test that has been corrected and graded by the teacher.');
    }
    console.log('[Analysis] ✓ Stage 3: Actual graded test');

    // Step 5: Parse German test data
    console.log('[Analysis] Step 5: Parsing German test data...');
    const parsedData = parseGermanTest(extractedText);
    console.log('[Analysis] ✓ Parsed data:', {
      subject: parsedData.subject,
      grade: parsedData.grade,
      hasTeacherComment: !!parsedData.teacherComment
    });

    // Convert grade to float
    const gradeFloat = parsedData.grade ? convertGermanGrade(parsedData.grade) : null;

    // Step 5.5: Fetch previous tests for comprehensive assessment
    console.log('[Analysis] Step 5.5: Fetching previous tests for pattern analysis...');
    const previousUploads = await db.upload.findMany({
      where: {
        childId: upload.childId,
        id: { not: uploadId },
        analysisStatus: 'completed',
        subject: parsedData.subject || undefined, // Same subject if detected
      },
      orderBy: { uploadedAt: 'desc' },
      take: 5, // Last 5 tests
      select: {
        grade: true,
        subject: true,
        teacherComment: true,
        uploadedAt: true,
        analysis: true,
      }
    });

    let previousTestsContext = '';
    if (previousUploads.length > 0) {
      console.log(`[Analysis] ✓ Found ${previousUploads.length} previous test(s) in ${parsedData.subject || 'this subject'}`);
      previousTestsContext = `\n**Previous Test History (for pattern analysis):**\n`;
      previousUploads.forEach((prev, idx) => {
        previousTestsContext += `\nTest ${idx + 1} (${new Date(prev.uploadedAt).toLocaleDateString('de-DE')}):\n`;
        previousTestsContext += `- Grade: ${prev.grade || 'Unknown'}\n`;
        previousTestsContext += `- Subject: ${prev.subject || 'Unknown'}\n`;
        if (prev.teacherComment) {
          previousTestsContext += `- Teacher Comment: ${prev.teacherComment}\n`;
        }
      });
      previousTestsContext += `\nPlease identify patterns across these tests and the current test to provide a comprehensive assessment of the student's academic trajectory.\n`;
    } else {
      console.log('[Analysis] No previous tests found');
      previousTestsContext = '\n**Previous Test History:** No previous tests available for pattern analysis.\n';
    }

    // Step 6: AI Analysis with previous test context
    console.log('[Analysis] Step 6: Running AI analysis with historical context...');
    const aiAnalysis = await analyzeTest({
      subject: parsedData.subject,
      grade: parsedData.grade,
      teacherComment: parsedData.teacherComment,
      extractedText: extractedText,
      childName: upload.child.name,
      studentGrade: upload.child.grade,
      schoolType: upload.child.schoolType,
      previousTests: previousTestsContext
    });
    console.log('[Analysis] ✓ AI analysis completed');

    // Step 7: Update database with results
    console.log('[Analysis] Step 7: Updating database with results...');
    const analysisData = {
      parsedAt: new Date().toISOString(),
      confidence: 'medium',
      extractedData: {
        grade: parsedData.grade,
        gradeNumeric: gradeFloat,
        subject: parsedData.subject,
        teacherComment: parsedData.teacherComment
      },
      ai: aiAnalysis
    };

    await db.upload.update({
      where: { id: uploadId },
      data: {
        extractedText,
        subject: parsedData.subject,
        grade: gradeFloat,
        teacherComment: parsedData.teacherComment,
        analysis: analysisData as any,
        analysisStatus: 'completed',
        processedAt: new Date()
      }
    });

    console.log('[Analysis] ✓ Database updated successfully');
    console.log('='.repeat(80));
    console.log('[Analysis] COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('='.repeat(80));
    console.error('[Analysis] FAILED!');
    console.error('Upload ID:', uploadId);
    console.error('Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('='.repeat(80));

    // Update database with failed status
    try {
      await db.upload.update({
        where: { id: uploadId },
        data: {
          analysisStatus: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Analysis failed: Unknown error'
        }
      });
      console.log('[Analysis] Database updated with failed status');
    } catch (updateError) {
      console.error('[Analysis] Failed to update database with error status:', updateError);
    }

    throw error;
  }
}

/**
 * Stage 1: Reject technical content (database diagrams, code, etc.)
 */
function containsTechnicalContent(text: string): boolean {
  const techKeywords = [
    'database', 'frontend', 'backend', 'api', 'postgresql', 'prisma', 'schema',
    'react', 'typescript', 'javascript', 'node.js', 'express', 'mongodb',
    'mysql', 'redis', 'docker', 'kubernetes', 'aws', 'azure', 'gcp',
    'github', 'gitlab', 'ci/cd', 'deployment', 'server', 'client',
    'html', 'css', 'sass', 'less', 'webpack', 'babel', 'eslint',
    'json', 'xml', 'yaml', 'toml', 'dockerfile', 'docker-compose',
    'kubernetes', 'helm', 'terraform', 'ansible', 'jenkins',
    'github actions', 'gitlab ci', 'travis ci', 'circle ci'
  ];

  const textLower = text.toLowerCase();
  const matches = techKeywords.filter(keyword => textLower.includes(keyword));
  
  return matches.length >= 3; // Requires 3+ tech keywords
}

/**
 * Stage 2: Verify content is likely a school test
 */
function isLikelySchoolTest(text: string): boolean {
  const schoolKeywords = [
    'klassenarbeit', 'test', 'klasse', 'aufgabe', 'punkte', 'note', 'fach',
    'schule', 'mathematik', 'deutsch', 'englisch', 'französisch', 'biologie',
    'chemie', 'physik', 'geschichte', 'geographie', 'musik', 'kunst', 'sport',
    'religion', 'ethik', 'informatik', 'werken', 'hauswirtschaft', 'pädagogik',
    'lehrer', 'lehrerin', 'schüler', 'schülerin', 'unterricht', 'stunde',
    'thema', 'themen', 'lernziel', 'lernziele', 'bewertung', 'leistung',
    'leistungen', 'erfolg', 'erfolge', 'fortschritt', 'fortschritte',
    'hausaufgabe', 'hausaufgaben', 'übung', 'übungen', 'training',
    'wiederholung', 'wiederholungen', 'kontrolle', 'kontrollen', 'test',
    'tests', 'klausur', 'klausuren', 'prüfung', 'prüfungen', 'examen',
    'abschluss', 'abschlüsse', 'zeugnis', 'zeugnisse', 'noten',
    'zensuren', 'punkte', 'punktzahl', 'prozent', '%'
  ];

  const textLower = text.toLowerCase();
  const matches = schoolKeywords.filter(keyword => textLower.includes(keyword));
  
  return matches.length >= 2; // Requires 2+ school keywords
}

/**
 * Stage 3: Ensure test is actually graded (not blank/instructions)
 */
function isActualGradedTest(text: string): boolean {
  const textLower = text.toLowerCase();
  
  // Must have grade indicators
  const hasGrade = (
    /note:\s*[1-6]/i.test(textLower) ||
    /punkte:\s*\d+/i.test(textLower) ||
    /sehr gut|gut|befriedigend|ausreichend|mangelhaft|ungenügend/i.test(textLower) ||
    /\b[1-6][+-]?\b/.test(textLower) ||
    /[1-6][,\.]\d+/.test(textLower)
  );
  
  // Must NOT be just instructions
  const isInstructions = (
    textLower.includes('instructions') ||
    textLower.includes('anweisungen') ||
    textLower.includes('aufgabenstellung') ||
    (textLower.includes('read the') && !hasGrade) ||
    (textLower.includes('bearbeiten sie') && !hasGrade)
  );
  
  return hasGrade && !isInstructions;
}