import fs from 'fs'
import path from 'path'
import { buildVisualEvidencePackage } from '@/lib/ocr/visual-detection'

async function main() {
  const file = process.argv[2]
  if (!file) {
    console.error('Usage: tsx scripts/test-visual-detection.ts <image_path>')
    process.exit(1)
  }
  const abs = path.resolve(file)
  if (!fs.existsSync(abs)) {
    console.error('File not found:', abs)
    process.exit(1)
  }
  const buf = fs.readFileSync(abs)
  const pkg = await buildVisualEvidencePackage(buf)
  console.log(JSON.stringify(pkg, null, 2))
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
