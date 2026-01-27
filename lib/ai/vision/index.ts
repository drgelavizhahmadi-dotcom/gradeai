import { PageImage, ConsensusResult, VisionProviderConfig, createEmptyResult } from './types';
import { analyzeWithClaudeVision } from './claude-vision';
import { analyzeWithGeminiVision } from './gemini-vision';
import { analyzeWithMistralVision } from './mistral-vision';
import { mergeVisionResults } from './consensus';

// Provider configuration - easy to enable/disable via environment variables
function getProviderConfig(): VisionProviderConfig[] {
  const claudeEnabled = process.env.VISION_CLAUDE_ENABLED !== 'false' && !!process.env.ANTHROPIC_API_KEY;
  const geminiEnabled = process.env.VISION_GEMINI_ENABLED !== 'false' && !!(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY);
  const mistralEnabled = process.env.VISION_MISTRAL_ENABLED !== 'false' && !!process.env.MISTRAL_API_KEY;

  return [
    { name: 'claude', enabled: claudeEnabled, priority: 1, timeout: 55000 },
    { name: 'gemini', enabled: geminiEnabled, priority: 2, timeout: 55000 },
    { name: 'mistral', enabled: mistralEnabled, priority: 3, timeout: 55000 },
  ];
}

export async function analyzeTestWithMultiVision(
  images: PageImage[],
  options?: {
    providers?: ('claude' | 'gemini' | 'mistral')[];
    timeout?: number;
  }
): Promise<ConsensusResult> {
  console.log('================================================================');
  console.log('[Multi-Vision] STARTING MULTI-AI VISION ANALYSIS');
  console.log('[Multi-Vision] Pages to analyze:', images.length);
  console.log('[Multi-Vision] Total image size:', images.reduce((s, i) => s + i.sizeKB, 0).toFixed(0), 'KB');
  console.log('================================================================');

  const config = getProviderConfig();
  let enabledProviders = config.filter(p => p.enabled);

  // Filter by requested providers if specified
  if (options?.providers && options.providers.length > 0) {
    enabledProviders = enabledProviders.filter(p => options.providers!.includes(p.name as any));
  }

  console.log('[Multi-Vision] Enabled providers:', enabledProviders.map(p => p.name).join(', ') || 'NONE');

  if (enabledProviders.length === 0) {
    console.error('[Multi-Vision] No AI providers available!');
    console.error('[Multi-Vision] Please configure at least one of:');
    console.error('[Multi-Vision]   - ANTHROPIC_API_KEY (for Claude)');
    console.error('[Multi-Vision]   - GOOGLE_API_KEY or GEMINI_API_KEY (for Gemini)');
    console.error('[Multi-Vision]   - MISTRAL_API_KEY (for Mistral)');
    throw new Error('No AI vision providers available. Please configure API keys.');
  }

  // Map provider names to functions
  const providerFunctions: Record<string, (images: PageImage[]) => Promise<any>> = {
    claude: analyzeWithClaudeVision,
    gemini: analyzeWithGeminiVision,
    mistral: analyzeWithMistralVision,
  };

  // Run all providers in parallel with individual timeouts
  const promises = enabledProviders.map(async (provider) => {
    const fn = providerFunctions[provider.name];
    if (!fn) {
      console.error(`[Multi-Vision] Unknown provider: ${provider.name}`);
      return createEmptyResult(provider.name as any, 'Unknown provider', 0, images.length);
    }

    const timeout = options?.timeout || provider.timeout;

    try {
      // Add timeout wrapper
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout)
      );

      const result = await Promise.race([fn(images), timeoutPromise]);
      return result;
    } catch (error) {
      console.error(`[Multi-Vision] ${provider.name} error:`, error);
      return createEmptyResult(
        provider.name as any,
        error instanceof Error ? error.message : 'Unknown error',
        timeout,
        images.length
      );
    }
  });

  console.log('[Multi-Vision] Waiting for all providers (parallel execution)...');
  const startTime = Date.now();
  const results = await Promise.all(promises);
  const totalDuration = Date.now() - startTime;

  console.log(`[Multi-Vision] All providers completed in ${totalDuration}ms`);
  console.log('[Multi-Vision] Results received:', results.length);

  // Merge results using consensus algorithm
  const consensus = mergeVisionResults(results);

  console.log('================================================================');
  console.log('[Multi-Vision] ✓ ANALYSIS COMPLETE');
  console.log('[Multi-Vision] Final grade:', consensus.finalResult.grade.value || 'NOT FOUND');
  console.log('[Multi-Vision] Agreement:', consensus.consensus.gradeAgreement);
  console.log('[Multi-Vision] Confidence:', consensus.overallConfidence.toFixed(0));
  console.log('[Multi-Vision] Total duration:', totalDuration, 'ms');
  console.log('================================================================');

  return consensus;
}

// Export single provider functions for direct access if needed
export { analyzeWithClaudeVision } from './claude-vision';
export { analyzeWithGeminiVision } from './gemini-vision';
export { analyzeWithMistralVision } from './mistral-vision';
export { mergeVisionResults } from './consensus';
export * from './types';
