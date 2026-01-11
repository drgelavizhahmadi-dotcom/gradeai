import fs from 'fs'
import path from 'path'
import { extractText, parseGermanTest } from '../lib/ocr'

async function testOCR(imagePath: string) {
  console.log('='.repeat(60))
  console.log('OCR Test Script')
  console.log('='.repeat(60))
  console.log()

  // Check if file exists
  if (!fs.existsSync(imagePath)) {
    console.error(`❌ Error: File not found at path: ${imagePath}`)
    process.exit(1)
  }

  console.log(`📁 Reading image from: ${imagePath}`)
  console.log()

  try {
    // Read the image file
    const imageBuffer = fs.readFileSync(imagePath)
    console.log(`✓ Image loaded successfully (${(imageBuffer.length / 1024).toFixed(2)} KB)`)
    console.log()

    // Extract text using Google Cloud Vision
    console.log('🔍 Extracting text from image...')
    console.log('-'.repeat(60))
    const extractedText = await extractText(imageBuffer)
    console.log('-'.repeat(60))
    console.log()

    if (!extractedText) {
      console.log('⚠️  No text detected in the image')
      return
    }

    console.log('📝 Extracted Text:')
    console.log('='.repeat(60))
    console.log(extractedText)
    console.log('='.repeat(60))
    console.log()

    // Parse the German test data
    console.log('🔬 Parsing German test data...')
    console.log('-'.repeat(60))
    const parsedData = parseGermanTest(extractedText)
    console.log('-'.repeat(60))
    console.log()

    // Display results
    console.log('📊 Parsed Results:')
    console.log('='.repeat(60))
    console.log(`Grade:           ${parsedData.grade || 'Not found'}`)
    console.log(`Subject:         ${parsedData.subject || 'Not found'}`)
    console.log(`Teacher Comment: ${parsedData.teacherComment || 'Not found'}`)
    console.log('='.repeat(60))
    console.log()

    // Display detailed breakdown
    console.log('📋 Detailed Breakdown:')
    console.log(JSON.stringify(parsedData, null, 2))
    console.log()

    console.log('✅ OCR test completed successfully!')
  } catch (error) {
    console.error('❌ Error during OCR test:')
    console.error(error)
    process.exit(1)
  }
}

// Get image path from command line argument
const imagePath = process.argv[2]

if (!imagePath) {
  console.error('❌ Error: Please provide an image path')
  console.error('Usage: npm run test-ocr <path-to-image>')
  console.error('Example: npm run test-ocr ./test-images/assignment.jpg')
  process.exit(1)
}

// Resolve to absolute path
const absolutePath = path.resolve(imagePath)

// Run the test
testOCR(absolutePath)
