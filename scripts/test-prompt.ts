


import { OPTIMIZED_ANALYSIS_PROMPT } from '../lib/ai/optimized-prompt.js';

const extractedText = "Sample OCR extracted text from the test.";
const childName = "John Doe";
const grade = "5";
const prompt = OPTIMIZED_ANALYSIS_PROMPT(extractedText, childName, grade);
console.log("Generated Prompt:\n", prompt);