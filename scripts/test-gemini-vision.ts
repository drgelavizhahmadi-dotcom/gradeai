import fs from 'fs';
import path from 'path';

import dotenv from 'dotenv';
import { analyzeStudentWork, analyzeTeacherNotes, analyzeVisualStructure } from '../lib/ai/geminiVision';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  // Replace with your test image path
  const imagePath = path.resolve(process.cwd(), 'test.png'); // Use the provided PNG image file
  if (!fs.existsSync(imagePath)) {
    console.error('Test image not found:', imagePath);
    process.exit(1);
  }
  const imageBuffer = fs.readFileSync(imagePath);

  // Run Gemini Vision analysis
  console.log('--- Gemini Vision: Student Work ---');
  const studentResult = await analyzeStudentWork(imageBuffer);
  console.log(studentResult);

  console.log('--- Gemini Vision: Teacher Notes ---');
  const teacherResult = await analyzeTeacherNotes(imageBuffer);
  console.log(teacherResult);

  console.log('--- Gemini Vision: Visual Structure ---');
  const visualResult = await analyzeVisualStructure(imageBuffer);
  console.log(visualResult);
}

main().catch(err => {
  console.error('Error running Gemini Vision test:', err);
  process.exit(1);
});
