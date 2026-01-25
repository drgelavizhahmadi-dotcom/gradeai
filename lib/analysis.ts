/**
 * Core analysis functionality for GradeAI
 * Uses Triple Gemini Flash Vision AI for handwritten test analysis
 */

import { db } from '@/lib/db'
import { separateRedInk, enhanceImage } from '@/lib/ocr/colorSeparation'
import { 
  analyzeStudentWork, 
  analyzeTeacherNotes, 
  analyzeVisualStructure,
  synthesizeAnalyses 
} from '@/lib/ai/geminiVision'
import { convertGermanGrade } from '@/lib/ocr/gradeConverter'
import { buildVisualEvidencePackage } from '@/lib/ocr/visual-detection'
import { TestAnalysis } from '@/lib/ai/prompts'

/**
 * Helper functions for analysis
 */
function getGradeInterpretation(grade: number): string {
  if (grade >= 1 && grade < 1.5) return 'Excellent work! Your child is performing at the highest level in German schools.';
  if (grade >= 1.5 && grade < 2.5) return 'Very good performance. Your child demonstrates strong understanding of the material.';
  if (grade >= 2.5 && grade < 3.5) return 'Satisfactory work. Your child meets the expected standards but has room for improvement.';
  if (grade >= 3.5 && grade < 4.5) return 'Below average performance. Additional support may be needed to improve understanding.';
  if (grade >= 4.5 && grade <= 5) return 'Insufficient performance. Immediate attention and support is needed to address gaps.';
  return 'Grade not available or unclear from the test.';
}

function getGradeSeverity(grade: number): 'excellent' | 'good' | 'satisfactory' | 'concerning' | 'critical' {
  if (grade >= 1 && grade < 1.5) return 'excellent';
  if (grade >= 1.5 && grade < 2.5) return 'good';
  if (grade >= 2.5 && grade < 3.5) return 'satisfactory';
  if (grade >= 3.5 && grade < 4.5) return 'concerning';
  return 'critical';
}

function getConcernLevel(grade: number): number {
  if (grade >= 1 && grade < 1.5) return 0;
  if (grade >= 1.5 && grade < 2) return 1;
  if (grade >= 2 && grade < 2.5) return 3;
  if (grade >= 2.5 && grade < 3) return 4;
  if (grade >= 3 && grade < 3.5) return 6;
  if (grade >= 3.5 && grade < 4) return 7;
  if (grade >= 4 && grade < 4.5) return 8;
  if (grade >= 4.5 && grade < 5) return 9;
  if (grade >= 5) return 10;
  return 5;
}

function getEndOfSemesterPrediction(grade: number): string {
  if (grade >= 1 && grade < 2) return 'Likely to maintain excellent performance (1-2 range)';
  if (grade >= 2 && grade < 3) return 'Expected to maintain good performance (2-3 range)';
  if (grade >= 3 && grade < 4) return 'May improve with additional support (2-3 range)';
  return 'Requires immediate intervention to avoid failing (4-5 range)';
}

// Global timeout for entire analysis - must complete before Vercel kills the function
const ANALYSIS_GLOBAL_TIMEOUT_MS = 55000 // 55 seconds (under Vercel's 60s limit)

/**
 * Analysis function using Triple Gemini Flash Vision AI
 * Color separation + parallel expert analysis + synthesis
 */
export async function analyzeUploadBuffer(uploadId: string, fileBuffers: Buffer | Buffer[]): Promise<void> {
  const buffers = Array.isArray(fileBuffers) ? fileBuffers : [fileBuffers];
  const totalSize = buffers.reduce((sum, buf) => sum + buf.length, 0);

  console.log('='.repeat(80));
  console.log('[Analysis] Starting Multi-Expert Vision AI analysis for upload:', uploadId);
  console.log('[Analysis] Number of files/pages:', buffers.length);
  console.log('[Analysis] Total buffer size:', totalSize, 'bytes');
  console.log('[Analysis] Global timeout:', ANALYSIS_GLOBAL_TIMEOUT_MS, 'ms');
  console.log('='.repeat(80));

  // Global timeout to ensure we update status before Vercel kills the function
  const globalTimeout = setTimeout(async () => {
    console.error('[Analysis] ⚠️ Global timeout reached! Marking as failed...');
    try {
      await db.upload.update({
        where: { id: uploadId },
        data: {
          analysisStatus: 'failed',
          errorMessage: 'Analysis timeout - please try again with a clearer image'
        }
      });
      console.log('[Analysis] ✓ Status updated to failed (timeout)');
    } catch (e) {
      console.error('[Analysis] Failed to update timeout status:', e);
    }
  }, ANALYSIS_GLOBAL_TIMEOUT_MS);

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

    // Step 3: Extract text using Multi-OCR (Google Vision primary, Tesseract fallback)
    console.log('[Analysis] Step 3: Extracting text with Multi-OCR strategy...');
    const primaryBuffer = buffers[0];

    // Use Multi-OCR with cascading fallback (add timeout to avoid hanging)
    const { extractTextMultiOcr } = await import('@/lib/ocr/multi-ocr');
    const withTimeout = <T>(p: Promise<T>, ms: number, name?: string): Promise<T> => {
      return Promise.race([
        p,
        new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`Timeout after ${ms}ms${name ? ' during ' + name : ''}`)), ms)),
      ]) as Promise<T>
    }

    const multiOcrResult = await withTimeout(extractTextMultiOcr(primaryBuffer), 15000, 'extractTextMultiOcr');
    
    console.log('[Analysis] ✓ Multi-OCR extraction complete');
    console.log(`[Analysis]   - Primary provider: ${multiOcrResult.primaryProvider}`);
    console.log(`[Analysis]   - Fallback used: ${multiOcrResult.fallbackUsed ? 'Yes' : 'No'}`);
    console.log(`[Analysis]   - Extracted ${multiOcrResult.text.length} characters`);
    console.log(`[Analysis]   - Confidence: ${multiOcrResult.confidence.toFixed(1)}%`);

    if (multiOcrResult.text.length < 50) {
      throw new Error('Insufficient text extracted from test - image may be blank or unreadable');
    }
    
    // Build Visual Evidence Package from image to reduce OCR noise and enrich AI context
    console.log('[Analysis] Step 3b: Building Visual Evidence Package (color + region heuristics)...');
    const evidence = await withTimeout(buildVisualEvidencePackage(primaryBuffer), 8000, 'buildVisualEvidencePackage');
    console.log('[Analysis] ✓ Visual evidence built');
    console.log(`[Analysis]   - Grade detected: ${evidence.grade_detected ?? 'N/A'}`);
    console.log(`[Analysis]   - Points: ${evidence.points ?? 'N/A'}`);
    console.log(`[Analysis]   - Correction density: ${evidence.correction_density}`);
    console.log(`[Analysis]   - Teacher comment (snippet): ${(evidence.teacher_comment || '').substring(0, 80)}`);

    const ocrResult = {
      text: multiOcrResult.text,
      confidence: multiOcrResult.confidence / 100, // Normalize to 0-1 range
    };

    // Compose enriched analysis input combining structured evidence with OCR text
    const evidenceText = `\n[Visual Evidence]\n` +
      `GradeDetected: ${evidence.grade_detected ?? 'unknown'}\n` +
      `Points: ${evidence.points ?? 'unknown'}\n` +
      `Marks: ${(evidence.marks || []).join(', ') || 'none'}\n` +
      `CorrectionDensity: ${evidence.correction_density}\n` +
      `TeacherComment: ${evidence.teacher_comment ?? 'none'}\n` +
      `AnswerRegions: ${evidence.answer_regions.length} region(s) detected\n` +
      `Confidence: ${evidence.confidence}\n`;

    const combinedText = evidenceText + '\n\n[OCR Text]\n' + ocrResult.text;

    // Step 4: Analyze with Mistral - PRIMARY AI PROVIDER
    console.log('[Analysis] Step 4: Generating comprehensive analysis with Mistral...');
    
    const { analyzeWithMultiAi } = await import('@/lib/ai/multi-ai');
    const targetLanguage = (upload.user as any)?.language || 'en'

    console.log('================================================================================');
    console.log('========== ANALYSIS START ==========');
    console.log('[Analysis] Extracted text length:', ocrResult.text.length, 'chars');
    console.log('[Analysis] Combined text length:', combinedText.length, 'chars');
    console.log('[Analysis] OCR Confidence:', (ocrResult.confidence * 100).toFixed(0) + '%');
    console.log('[Analysis] Target language:', targetLanguage);
    console.log('[Analysis] Child name:', upload.child?.name || 'Unknown');
    console.log('[Analysis] Text preview (first 500 chars):');
    console.log(combinedText.substring(0, 500));
    console.log('[Analysis] ... (middle content omitted) ...');
    console.log('[Analysis] Text preview (last 500 chars):');
    console.log(combinedText.substring(combinedText.length - 500));
    console.log('[Analysis] Calling AI provider...');
    console.log('================================================================================');
    // AI calls can be slow — enforce a timeout so the serverless request doesn't hang indefinitely
    const multiAiResult = await withTimeout(
      analyzeWithMultiAi(combinedText, upload.child, ocrResult.confidence, targetLanguage),
      20000,
      'analyzeWithMultiAi'
    );
    
    console.log('================================================================================');
    console.log('========== AI RESPONSE ==========');
    console.log('[Analysis] ✓ Multi-AI analysis complete');
    console.log('[Analysis] Primary provider:', multiAiResult.primaryProvider);
    console.log('[Analysis] Consensus score:', multiAiResult.consensusScore);
    console.log('[Analysis] Total providers used:', multiAiResult.allResults.length);

    const analysisResult = multiAiResult.analysis;
    console.log('[Analysis] Grade found:', analysisResult.summary?.overallGrade || 'NOT FOUND');
    console.log('[Analysis] Subject:', analysisResult.summary?.subject || 'NOT FOUND');
    console.log('[Analysis] Confidence:', ((analysisResult.summary?.confidence || 0) * 100).toFixed(0) + '%');
    console.log('[Analysis] Strengths count:', analysisResult.strengths?.length || 0);
    console.log('[Analysis] Weaknesses count:', analysisResult.weaknesses?.length || 0);
    console.log('[Analysis] Recommendations count:', analysisResult.recommendations?.length || 0);
    console.log('[Analysis] Teacher comment preview:', (analysisResult.teacherFeedback?.written || '').substring(0, 200));
    console.log('[Analysis] Raw analysis summary:', JSON.stringify(analysisResult.summary, null, 2));
    console.log('================================================================================');
    // Attach visual evidence and raw OCR text to analysis metadata for UI transparency
    (analysisResult as any).metadata = {
      ...((analysisResult as any).metadata || {}),
      visualEvidence: evidence,
      rawOcrTextLength: multiOcrResult.text.length,
      consensusScore: multiAiResult.consensusScore,
      providers: multiAiResult.allResults.map((r: any) => r.provider),
    };

    // Step 5: Create final analysis object from AI result
    console.log('[Analysis] Step 5: Creating structured analysis report...');
    
    // Extract grade for database
    const gradeFloat = convertGermanGrade(analysisResult.summary?.overallGrade) || 0;
    
    console.log(`[Analysis]   - Grade: ${analysisResult.summary?.overallGrade} (${gradeFloat})`);
    console.log(`[Analysis]   - Subject: ${analysisResult.summary?.subject}`);
    console.log(`[Analysis]   - Strengths: ${analysisResult.strengths?.length || 0}`);
    console.log(`[Analysis]   - Weaknesses: ${analysisResult.weaknesses?.length || 0}`);
    console.log(`[Analysis]   - Recommendations: ${analysisResult.recommendations?.length || 0}`);
    
    // Save to database with comprehensive analysis
    console.log('[Analysis] Step 6: Saving analysis results...');
    // Normalize teacher comment to string for Prisma
    const teacherCommentStr = Array.isArray(analysisResult.teacherFeedback?.written)
      ? (analysisResult.teacherFeedback?.written as any[]).filter(Boolean).join('\n')
      : (analysisResult.teacherFeedback?.written || '')

    await db.upload.update({
      where: { id: uploadId },
      data: {
        grade: gradeFloat,
        subject: analysisResult.summary?.subject || 'Unbekannt',
        teacherComment: teacherCommentStr,
        extractedText: multiOcrResult.text,
        analysis: {
          ai: analysisResult,
          aiError: null
        } as any,
        analysisStatus: 'completed',
        processedAt: new Date(),
      }
    });

    console.log('[Analysis] ✓ Analysis saved successfully');
    console.log('='.repeat(80));

    // Clear the global timeout since we completed successfully
    clearTimeout(globalTimeout);
  } catch (error) {
    // Clear the global timeout since we're handling the error
    clearTimeout(globalTimeout);

    console.error('[Analysis] ✗ Analysis failed:', error);

    await db.upload.update({
      where: { id: uploadId },
      data: {
        analysisStatus: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    });

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