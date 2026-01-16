/**
 * Core analysis functionality for GradeAI
 * Handles the complete pipeline: upload → extract → validate → analyze → save
 */

import { db } from '@/lib/db'
import fs from 'fs'
import { extractText, parseGermanTest } from '@/lib/ocr/vision'
import { analyzeTest } from '@/lib/ai/claude'
import { convertGermanGrade } from '@/lib/ocr/gradeConverter'

/**
 * Main analysis function that processes an upload from start to finish
 * Eliminates HTTP-based analysis to prevent reliability issues
 */
export async function analyzeUpload(uploadId: string): Promise<void> {
  console.log('='.repeat(80));
  console.log('[Analysis] Starting analysis for upload:', uploadId);
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

    // Step 3: Read file from disk
    console.log('[Analysis] Step 3: Reading file from disk...');
    const fileBuffer = fs.readFileSync(upload.fileUrl);
    console.log('[Analysis] ✓ File read successfully:', fileBuffer.length, 'bytes');

    // Step 4: Extract text with OCR
    console.log('[Analysis] Step 4: Extracting text with OCR...');
    const extractedText = await extractText(fileBuffer);
    console.log('[Analysis] ✓ Text extracted:', extractedText.length, 'characters');
    if (extractedText.length < 10) {
      throw new Error('Insufficient text extracted from image');
    }

    // Step 5: Three-stage validation
    console.log('[Analysis] Step 5: Running three-stage validation...');
    
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

    // Step 6: Parse German test data
    console.log('[Analysis] Step 6: Parsing German test data...');
    const parsedData = parseGermanTest(extractedText);
    console.log('[Analysis] ✓ Parsed data:', {
      subject: parsedData.subject,
      grade: parsedData.grade,
      hasTeacherComment: !!parsedData.teacherComment
    });

    // Convert grade to float
    const gradeFloat = parsedData.grade ? convertGermanGrade(parsedData.grade) : null;

    // Step 7: AI Analysis with Claude
    console.log('[Analysis] Step 7: Running AI analysis...');
    const aiAnalysis = await analyzeTest({
      subject: parsedData.subject,
      grade: parsedData.grade,
      teacherComment: parsedData.teacherComment,
      extractedText: extractedText,
      childName: upload.child.name,
      studentGrade: upload.child.grade,
      schoolType: upload.child.schoolType
    });
    console.log('[Analysis] ✓ AI analysis completed');

    // Step 8: Update database with results
    console.log('[Analysis] Step 8: Updating database with results...');
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