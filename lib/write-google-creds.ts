import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Ensure Google credentials are available as a file on disk and
 * set `process.env.GOOGLE_APPLICATION_CREDENTIALS` to its path.
 *
 * Usage: import and call this once at server startup or at the
 * beginning of any API route that uses Google Cloud clients.
 */
export function ensureGoogleCreds(): void {
  // Support either raw JSON or base64-encoded JSON
  let json = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  const b64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_B64;
  if (!json && b64) {
    try {
      json = Buffer.from(b64, 'base64').toString('utf8');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to decode GOOGLE_APPLICATION_CREDENTIALS_B64:', err);
      return;
    }
  }
  if (!json) return;
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return;

  // Use the system temp directory (portable) and avoid writing into the repo
  const tmpDir = os.tmpdir();
  let tmpPath = path.join(tmpDir, 'gradeai-google-creds.json');

  // Safety: never write credentials inside the repository working directory
  const repoRoot = process.cwd();
  if (tmpPath.startsWith(repoRoot)) {
    const uniqueName = `gradeai-google-creds-${Date.now()}.json`;
    tmpPath = path.join(os.tmpdir(), uniqueName);
  }

  try {
    fs.writeFileSync(tmpPath, json, { encoding: 'utf8', mode: 0o600 });
    process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpPath;
  } catch (err) {
    // swallow errors - callers can handle missing credentials
    // but log to stderr for visibility
    // eslint-disable-next-line no-console
    console.error('Failed to write Google credentials file:', err);
  }
}

export default ensureGoogleCreds;
