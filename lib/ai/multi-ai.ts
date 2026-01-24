/**
 * Multi-AI Analysis Strategy
 * 
 * Runs analysis through multiple AI providers in parallel:
 * - Claude Sonnet 4 (high quality, €0.40/test)
 * - Mistral Large 2 (good quality, €0.03/test)
 * - Gemini 1.5 Pro (Google, €0.02/test)
 * 
 * Selects best result based on:
 * - Confidence score
 * - Completeness (all required fields filled)
 * - Detail level (text length in recommendations)
 */

import { TestAnalysis } from './prompts';
import { Language } from '@/lib/translations';

export interface AiProviderResult {
  analysis: TestAnalysis;
  provider: string;
  processingTime: number;
  confidence: number;
  error?: string;
}

export interface MultiAiResult {
  analysis: TestAnalysis;
  primaryProvider: string;
  allResults: AiProviderResult[];
  consensusScore: number;
}

/**
 * Calculate quality score for an analysis result
 */
function calculateQualityScore(result: AiProviderResult): number {
  const analysis = result.analysis;
  let score = 0;

  // Base confidence score (0-100)
  score += result.confidence;

  // Completeness bonuses
  if (analysis.summary?.overallGrade) score += 10;
  if (analysis.summary?.overallScore) score += 5;
  if (analysis.summary?.subject) score += 5;
  
  // Performance section quality
  if (analysis.performance?.bySection && analysis.performance.bySection.length > 0) {
    score += 10;
    score += Math.min(analysis.performance.bySection.length * 2, 10);
  }

  // Recommendations quality
  if (analysis.recommendations && Array.isArray(analysis.recommendations) && analysis.recommendations.length > 0) {
    score += 15;
    const validRecs = analysis.recommendations.filter(r => r && r.action && typeof r.action === 'string');
    if (validRecs.length > 0) {
      const avgRecLength = validRecs.reduce((sum, r) => sum + r.action.length, 0) / validRecs.length;
      score += Math.min(avgRecLength / 20, 10);
    }
  }

  // Strengths and weaknesses
  if (analysis.strengths && analysis.strengths.length > 2) score += 10;
  if (analysis.weaknesses && analysis.weaknesses.length > 2) score += 10;

  // Long-term development plan
  if (analysis.longTermDevelopment?.semesterPrediction) score += 5;
  if (analysis.longTermDevelopment?.goalSetting) score += 5;

  return score;
}

/**
 * Merge insights from multiple AI analyses (complementary approach)
 */
function mergeAnalyses(results: AiProviderResult[], ocrConfidence?: number): TestAnalysis {
  console.log('[Multi-AI] Merging complementary insights from all AIs...');
  
  if (results.length === 0) {
    throw new Error('No successful AI analyses to merge');
  }
  
  // Use the highest quality result as base
  const scoredResults = results.map(r => ({
    ...r,
    score: calculateQualityScore(r),
  }));
  
  const best = scoredResults.reduce((a, b) => a.score > b.score ? a : b);
  
  if (!best.analysis) {
    throw new Error('Best analysis is undefined');
  }
  
  const merged = JSON.parse(JSON.stringify(best.analysis)); // Deep copy
  
  console.log(`[Multi-AI] Base analysis from ${best.provider}`);
  
  // Merge strengths from all AIs (deduplicate similar ones)
  const allStrengths = new Set<string>();
  results.forEach(r => {
    if (r.analysis?.strengths && Array.isArray(r.analysis.strengths)) {
      r.analysis.strengths.forEach(s => {
        if (s && typeof s === 'string' && s.trim().length > 0) {
          allStrengths.add(s.trim());
        }
      });
    }
  });
  merged.strengths = Array.from(allStrengths).slice(0, 8); // Top 8 unique strengths
  
  // Merge weaknesses from all AIs
  const allWeaknesses = new Set<string>();
  results.forEach(r => {
    if (r.analysis?.weaknesses && Array.isArray(r.analysis.weaknesses)) {
      r.analysis.weaknesses.forEach(w => {
        if (w && typeof w === 'string' && w.trim().length > 0) {
          allWeaknesses.add(w.trim());
        }
      });
    }
  });
  merged.weaknesses = Array.from(allWeaknesses).slice(0, 8); // Top 8 unique weaknesses
  
  // Merge recommendations (prioritize unique, high-priority ones)
  const allRecommendations = results
    .flatMap(r => r.analysis?.recommendations || [])
    .filter(r => r && r.action && typeof r.action === 'string');
  const uniqueRecs = Array.from(
    new Map(allRecommendations.map(r => [r.action, r])).values()
  ).slice(0, 10); // Top 10 unique recommendations
  merged.recommendations = uniqueRecs;
  
  // Update metadata to reflect multi-AI consensus
  const finalOcrConfidence = ocrConfidence ?? 0.85; // Default to 85% (0-1 range) if not provided
  const finalSummaryConfidence = (merged.summary?.confidence && !isNaN(merged.summary.confidence)) ? merged.summary.confidence : 0.85;
  
  merged.metadata = {
    ...merged.metadata,
    aiModel: `Multi-AI Consensus (${results.map(r => r.provider.split(' ')[0]).join(', ')})`,
    processingSteps: results.map(r => `${r.provider}: ${r.processingTime}ms`),
    ocrConfidence: finalOcrConfidence,
  };
  
  // Ensure arrays and summary confidence are initialized
  if (!merged.strengths) merged.strengths = [];
  if (!merged.weaknesses) merged.weaknesses = [];
  if (!merged.recommendations) merged.recommendations = [];
  merged.summary.confidence = finalSummaryConfidence;
  
  console.log('[Multi-AI] ✓ Merged analysis:');
  console.log(`[Multi-AI]   - Strengths: ${merged.strengths.length}`);
  console.log(`[Multi-AI]   - Weaknesses: ${merged.weaknesses.length}`);
  console.log(`[Multi-AI]   - Recommendations: ${merged.recommendations.length}`);
  console.log(`[Multi-AI]   - Summary Confidence: ${(finalSummaryConfidence * 100).toFixed(0)}%`);
  console.log(`[Multi-AI]   - OCR Confidence: ${(finalOcrConfidence * 100).toFixed(0)}%`);
  
  return merged;
}

/**
 * Run Claude Sonnet 4 analysis
 */
async function runClaudeAnalysis(text: string, child: any, targetLanguage: Language | string): Promise<AiProviderResult> {
  const startTime = Date.now();

  try {
    console.log('================================================================================');
    console.log('[Claude] Starting analysis...');
    console.log('[Claude] Text length:', text.length, 'characters');
    console.log('[Claude] Child:', child?.name || 'Unknown');
    console.log('[Claude] Target language:', targetLanguage);
    console.log('================================================================================');

    const { analyzeWithClaude } = await import('./claude-comprehensive');
    const analysis = await analyzeWithClaude(text, child, targetLanguage);
    const processingTime = Date.now() - startTime;

    console.log('================================================================================');
    console.log('[Claude] ✓ Response received');
    console.log(`[Claude] Grade found: ${analysis.summary?.overallGrade || 'NOT FOUND'}`);
    console.log(`[Claude] Subject: ${analysis.summary?.subject || 'NOT FOUND'}`);
    console.log(`[Claude] Confidence: ${((analysis.summary?.confidence ?? 0.85) * 100).toFixed(0)}%`);
    console.log(`[Claude] Strengths: ${analysis.strengths?.length || 0}`);
    console.log(`[Claude] Weaknesses: ${analysis.weaknesses?.length || 0}`);
    console.log(`[Claude] Recommendations: ${analysis.recommendations?.length || 0}`);
    console.log(`[Claude] Processing time: ${processingTime}ms`);
    console.log('================================================================================');

    const aiConfidence = (analysis.summary?.confidence ?? 0.85) * 100;
    return {
      analysis,
      provider: 'Claude Sonnet 4',
      processingTime,
      confidence: aiConfidence,
    };
  } catch (error) {
    console.error('[Claude] ✗ Failed:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Run Mistral Large 2 analysis
 */
async function runMistralAnalysis(text: string, child: any, targetLanguage: Language | string): Promise<AiProviderResult> {
  const startTime = Date.now();

  try {
    console.log('================================================================================');
    console.log('[Mistral] Starting analysis...');
    console.log('[Mistral] Text length:', text.length, 'characters');
    console.log('[Mistral] Child:', child?.name || 'Unknown');
    console.log('[Mistral] Target language:', targetLanguage);
    console.log('================================================================================');

    const { analyzeWithMistral } = await import('./mistral');
    const analysis = await analyzeWithMistral(text, child, targetLanguage);
    const processingTime = Date.now() - startTime;

    console.log('================================================================================');
    console.log('[Mistral] ✓ Response received');
    console.log(`[Mistral] Grade found: ${analysis.summary?.overallGrade || 'NOT FOUND'}`);
    console.log(`[Mistral] Subject: ${analysis.summary?.subject || 'NOT FOUND'}`);
    console.log(`[Mistral] Confidence: ${((analysis.summary?.confidence ?? 0.80) * 100).toFixed(0)}%`);
    console.log(`[Mistral] Strengths: ${analysis.strengths?.length || 0}`);
    console.log(`[Mistral] Weaknesses: ${analysis.weaknesses?.length || 0}`);
    console.log(`[Mistral] Recommendations: ${analysis.recommendations?.length || 0}`);
    console.log(`[Mistral] Processing time: ${processingTime}ms`);
    console.log('================================================================================');

    const aiConfidence = (analysis.summary?.confidence ?? 0.80) * 100;
    return {
      analysis,
      provider: 'Mistral Large 2',
      processingTime,
      confidence: aiConfidence,
    };
  } catch (error) {
    console.error('[Mistral] ✗ Failed:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}


/**
 * Run Gemini 1.5 Pro analysis
 */
async function runGeminiAnalysis(text: string, child: any, targetLanguage: Language | string): Promise<AiProviderResult> {
  const startTime = Date.now();
  try {
    console.log('[Gemini] Starting analysis...');
    console.log('[Gemini] Text length:', text.length, 'characters');
    const { analyzeWithGemini } = await import('./gemini-comprehensive');
    const analysis = await analyzeWithGemini(text, child, targetLanguage);
    const processingTime = Date.now() - startTime;
    console.log('[Gemini] Response received');
    console.log(`[Gemini] Grade found: ${analysis.summary?.overallGrade || 'NOT FOUND'}`);
    console.log(`[Gemini] Subject: ${analysis.summary?.subject || 'NOT FOUND'}`);
    console.log(`[Gemini] Confidence: ${((analysis.summary?.confidence ?? 0.80) * 100).toFixed(0)}%`);
    console.log(`[Multi-AI] ✓ Gemini complete in ${processingTime}ms`);
    const aiConfidence = (analysis.summary?.confidence ?? 0.80) * 100;
    return {
      analysis,
      provider: 'Gemini 1.5 Pro',
      processingTime,
      confidence: aiConfidence,
    };
  } catch (error) {
    console.error('[Gemini] ✗ Failed:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Run DeepSeek V3 analysis (FAST & CHEAP)
 */
async function runDeepSeekAnalysis(text: string, child: any, targetLanguage: Language | string): Promise<AiProviderResult> {
  const startTime = Date.now();
  
  try {
    console.log('[Multi-AI] Running DeepSeek V3...');
    const { analyzeWithDeepSeek } = await import('./deepseek');
    const analysis = await analyzeWithDeepSeek(text, child);
    const processingTime = Date.now() - startTime;
    
    console.log(`[Multi-AI] ✓ DeepSeek complete in ${processingTime}ms`);
    
    const aiConfidence = (analysis.summary?.confidence ?? 0.85) * 100;
    return {
      analysis,
      provider: 'DeepSeek V3',
      processingTime,
      confidence: aiConfidence,
    };
  } catch (error) {
    console.error('[Multi-AI] ✗ DeepSeek failed:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Main multi-AI analysis function - runs ALL providers in PARALLEL for best results
 */
export async function analyzeWithMultiAi(
  extractedText: string,
  child: any,
  ocrConfidence?: number,
  targetLanguage: Language | string = 'en'
): Promise<MultiAiResult> {
  console.log('================================================================================');
  console.log('[Multi-AI] 🚀 Starting PARALLEL multi-AI analysis');
  console.log('[Multi-AI] Text length:', extractedText.length, 'characters');
  console.log('[Multi-AI] Strategy: Run ALL providers in PARALLEL, merge best insights');
  console.log('================================================================================');

  // ============================================================================
  // IMPORTANT: Using ONLY Mistral (all other providers disabled)
  // To re-enable other providers later, modify the flags below
  // ============================================================================
  console.log('[AI] ========== USING MISTRAL AS PRIMARY ==========')

  // ALL PROVIDERS DISABLED except Mistral
  const useDeepSeek = false  // DISABLED
  const useMistral = !!process.env.MISTRAL_API_KEY  // ONLY Mistral is active
  const useGemini = false    // DISABLED
  const useGroq = false      // DISABLED
  const useClaude = false    // DISABLED

  // Log which providers are enabled
  const enabledProviders = []
  if (useDeepSeek) enabledProviders.push('DeepSeek')
  if (useMistral) enabledProviders.push('Mistral')
  if (useGemini) enabledProviders.push('Gemini')
  if (useClaude) enabledProviders.push('Claude')

  console.log('[Multi-AI] ========================================')
  console.log('[Multi-AI] ACTIVE PROVIDER: Mistral ONLY')
  console.log('[Multi-AI] MISTRAL_API_KEY configured:', !!process.env.MISTRAL_API_KEY)
  console.log(`[Multi-AI] Enabled providers: ${enabledProviders.join(', ') || 'NONE'}`)
  console.log('[Multi-AI] ========================================')

  const AI_TIMEOUT_MS = Number(process.env.ANALYSIS_AI_TIMEOUT_MS || 60000) // 60s timeout per provider

  const withTimeout = async <T>(p: Promise<T>, label: string, timeoutMs?: number): Promise<T> => {
    const timeout = timeoutMs || AI_TIMEOUT_MS;
    return await Promise.race<T>([
      p,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`${label} timeout after ${timeout}ms`)), timeout)),
    ])
  }

  // Build array of provider promises to run in PARALLEL
  const providerPromises: Array<{ name: string; promise: Promise<AiProviderResult> }> = []

  if (useDeepSeek) {
    providerPromises.push({
      name: 'DeepSeek',
      promise: withTimeout(runDeepSeekAnalysis(extractedText, child, targetLanguage), 'DeepSeek')
    })
  }

  if (useGemini) {
    providerPromises.push({
      name: 'Gemini',
      promise: withTimeout(runGeminiAnalysis(extractedText, child, targetLanguage), 'Gemini')
    })
  }

  if (useClaude) {
    providerPromises.push({
      name: 'Claude',
      promise: withTimeout(runClaudeAnalysis(extractedText, child, targetLanguage), 'Claude')
    })
  }

  if (useMistral) {
    providerPromises.push({
      name: 'Mistral',
      promise: withTimeout(runMistralAnalysis(extractedText, child, targetLanguage), 'Mistral')
    })
  }

  if (providerPromises.length === 0) {
    // No providers configured - Mistral is required
    if (!process.env.MISTRAL_API_KEY) {
      throw new Error('MISTRAL_API_KEY is required. Please set it in your environment variables.')
    }
    throw new Error('No AI providers enabled. Ensure MISTRAL_API_KEY is set.')
  }

  console.log('================================================================================')
  console.log('========== AI PROVIDER ==========')
  console.log(`[Multi-AI] Using provider(s): ${providerPromises.map(p => p.name).join(', ')}`)
  console.log(`[Multi-AI] Text length being sent: ${extractedText.length} chars`)
  console.log(`[Multi-AI] Child: ${child?.name || 'Unknown'}`)
  console.log(`[Multi-AI] 🔄 Running ${providerPromises.length} provider(s)...`)
  console.log('================================================================================')
  const startTime = Date.now()

  // Run ALL providers in parallel using Promise.allSettled
  const results = await Promise.allSettled(providerPromises.map(p => p.promise))

  const successfulResults: AiProviderResult[] = []
  const failedProviders: string[] = []

  // Process results
  results.forEach((result, index) => {
    const providerName = providerPromises[index].name
    if (result.status === 'fulfilled') {
      successfulResults.push(result.value)
      console.log(`[Multi-AI] ✓ ${providerName} succeeded: ${result.value.confidence.toFixed(0)}% confidence, ${result.value.processingTime}ms`)
    } else {
      failedProviders.push(providerName)
      console.error(`[Multi-AI] ✗ ${providerName} failed:`, result.reason instanceof Error ? result.reason.message : String(result.reason))
    }
  })

  const totalTime = Date.now() - startTime
  console.log(`[Multi-AI] ⏱️ All parallel calls completed in ${totalTime}ms`)

  // If all failed, throw error with details
  if (successfulResults.length === 0) {
    const configuredKeys = []
    const missingKeys = []
    if (process.env.DEEPSEEK_API_KEY) configuredKeys.push('DeepSeek'); else missingKeys.push('DEEPSEEK_API_KEY')
    if (process.env.MISTRAL_API_KEY) configuredKeys.push('Mistral'); else missingKeys.push('MISTRAL_API_KEY')
    if (process.env.GEMINI_API_KEY) configuredKeys.push('Gemini'); else missingKeys.push('GEMINI_API_KEY')
    if (process.env.ANTHROPIC_API_KEY) configuredKeys.push('Claude'); else missingKeys.push('ANTHROPIC_API_KEY')

    console.error('[Multi-AI] ❌ All providers failed!')
    console.error('[Multi-AI] Configured:', configuredKeys.length ? configuredKeys.join(', ') : 'NONE')
    console.error('[Multi-AI] Missing:', missingKeys.length ? missingKeys.join(', ') : 'NONE')

    throw new Error(`All AI providers failed. Providers attempted: ${failedProviders.join(', ')}. Configured keys: ${configuredKeys.join(', ')}`)
  }

  console.log('================================================================================')
  console.log(`[Multi-AI] 📊 Results summary:`)
  console.log(`[Multi-AI]   - Successful: ${successfulResults.length}/${providerPromises.length}`)
  console.log(`[Multi-AI]   - Failed: ${failedProviders.length > 0 ? failedProviders.join(', ') : 'none'}`)
  successfulResults.forEach(r => {
    console.log(`[Multi-AI]   - ${r.provider}: ${r.confidence.toFixed(0)}% confidence, ${r.processingTime}ms`)
  })
  console.log('================================================================================')

  // Merge insights from ALL successful providers
  const mergedAnalysis = mergeAnalyses(successfulResults, ocrConfidence)

  // Calculate consensus score based on how many providers succeeded and agreed
  const consensusScore = Math.round((successfulResults.length / providerPromises.length) * 100)

  console.log('================================================================================')
  console.log('========== MULTI-AI ANALYSIS COMPLETE ==========')
  console.log(`[Multi-AI] Merged insights from: ${successfulResults.map(r => r.provider.split(' ')[0]).join(' + ')}`)
  console.log(`[Multi-AI] Consensus score: ${consensusScore}%`)
  console.log(`[Multi-AI] Total time: ${totalTime}ms`)
  console.log(`[Multi-AI] Final Grade: ${mergedAnalysis.summary?.overallGrade || 'NOT FOUND'}`)
  console.log(`[Multi-AI] Final Subject: ${mergedAnalysis.summary?.subject || 'NOT FOUND'}`)
  console.log(`[Multi-AI] Final Confidence: ${((mergedAnalysis.summary?.confidence || 0) * 100).toFixed(0)}%`)
  console.log(`[Multi-AI] Strengths: ${mergedAnalysis.strengths?.length || 0}`)
  console.log(`[Multi-AI] Weaknesses: ${mergedAnalysis.weaknesses?.length || 0}`)
  console.log(`[Multi-AI] Recommendations: ${mergedAnalysis.recommendations?.length || 0}`)
  console.log('================================================================================')

  return {
    analysis: mergedAnalysis,
    primaryProvider: mergedAnalysis.metadata.aiModel || 'Multi-AI Consensus',
    allResults: successfulResults,
    consensusScore,
  }
}
