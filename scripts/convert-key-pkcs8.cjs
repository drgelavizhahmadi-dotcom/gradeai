const fs = require('fs');
const path = './gradeai-credentials.json';
if (!fs.existsSync(path)) {
  console.error('Cannot find', path);
  process.exit(1);
}
const j = JSON.parse(fs.readFileSync(path, 'utf8'));
const { createPrivateKey } = require('crypto');

try {
  const keyPem = j.private_key.replace(/\\n/g, '\n');
  const keyObj = createPrivateKey({ key: keyPem });
  const pkcs8Pem = keyObj.export({ type: 'pkcs8', format: 'pem' }).toString();
  j.private_key = pkcs8Pem.replace(/\n/g, '\\n');
  console.log(JSON.stringify(j));
} catch (err) {
  console.error('Conversion failed:', err && err.message ? err.message : err);
  process.exit(2);
}
