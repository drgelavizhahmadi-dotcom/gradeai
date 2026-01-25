#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function printUsage() {
  console.error('Usage: node scripts/encode-google-creds.js <path-to-json> [--no-clip]');
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length === 0) printUsage();
const file = args[0];
const noClip = args.includes('--no-clip');

const filePath = path.resolve(process.cwd(), file);
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

try {
  const data = fs.readFileSync(filePath);
  const b64 = Buffer.from(data).toString('base64');

  // Prevent printing secrets in CI environments
  const isCI = !!(
    process.env.CI ||
    process.env.GITHUB_ACTIONS ||
    process.env.VERCEL ||
    process.env.GITLAB_CI ||
    process.env.CI_PIPELINE_ID
  );

  if (isCI && noClip) {
    console.error('Refusing to print secrets in CI. Use secure environment variables instead.');
    process.exit(1);
  }

  if (noClip) {
    console.log(b64);
    process.exit(0);
  }

  const platform = process.platform;
  if (platform === 'win32') {
    const cp = spawnSync('cmd', ['/c', 'clip'], { input: b64, encoding: 'utf8' });
    if (cp.status === 0) {
      console.log('Base64 copied to clipboard.');
      process.exit(0);
    }
  } else if (platform === 'darwin') {
    const cp = spawnSync('pbcopy', [], { input: b64, encoding: 'utf8' });
    if (cp.status === 0) {
      console.log('Base64 copied to clipboard.');
      process.exit(0);
    }
  } else {
    let cp = spawnSync('xclip', ['-selection', 'clipboard'], { input: b64, encoding: 'utf8' });
    if (cp.status === 0) {
      console.log('Base64 copied to clipboard.');
      process.exit(0);
    }
    cp = spawnSync('xsel', ['--clipboard', '--input'], { input: b64, encoding: 'utf8' });
    if (cp.status === 0) {
      console.log('Base64 copied to clipboard.');
      process.exit(0);
    }
  }

  // Fallback: in CI we do NOT print secrets to stdout — fail instead.
  if (isCI) {
    console.error('No clipboard utility detected in CI; refusing to emit secrets to stdout.');
    process.exit(1);
  }

  console.warn('No clipboard utility detected; printing base64 to stdout.');
  console.log(b64);
  process.exit(0);

} catch (err) {
  console.error('Error encoding file:', err.message);
  process.exit(1);
}
