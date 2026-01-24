// scripts/ping-ai-providers.ts
// Health check for all AI providers: DeepSeek, Mistral, Gemini, Claude

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function pingDeepSeek() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return '❌ No API key';
  try {
    const res = await fetch('https://api.deepseek.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.ok) return '✅ OK';
    return `❌ HTTP ${res.status}`;
  } catch (e) {
    return `❌ ${e}`;
  }
}

async function pingMistral() {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) return '❌ No API key';
  try {
    const res = await fetch('https://api.mistral.ai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.ok) return '✅ OK';
    return `❌ HTTP ${res.status}`;
  } catch (e) {
    return `❌ ${e}`;
  }
}

async function pingGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return '❌ No API key';
  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1/models?key=' + apiKey);
    if (res.ok) return '✅ OK';
    return `❌ HTTP ${res.status}`;
  } catch (e) {
    return `❌ ${e}`;
  }
}

async function pingClaude() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return '❌ No API key';
  try {
    const res = await fetch('https://api.anthropic.com/v1/models', {
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    });
    if (res.ok) return '✅ OK';
    return `❌ HTTP ${res.status}`;
  } catch (e) {
    return `❌ ${e}`;
  }
}

(async () => {
  console.log('Pinging AI providers...');
  const [deepseek, mistral, gemini, claude] = await Promise.all([
    pingDeepSeek(),
    pingMistral(),
    pingGemini(),
    pingClaude(),
  ]);
  console.log('DeepSeek:', deepseek);
  console.log('Mistral:', mistral);
  console.log('Gemini:', gemini);
  console.log('Claude:', claude);
})();
