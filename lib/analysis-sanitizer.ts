/**
 * Sanitize analysis objects to ensure all required fields are valid
 * Prevents NaN, undefined, and other display issues
 */

import { TestAnalysis } from './ai/prompts';

export function sanitizeAnalysis(analysis: any): TestAnalysis {
  // Ensure basic structure
  if (!analysis) {
    throw new Error('Analysis cannot be null or undefined');
  }

  // Sanitize summary
  if (!analysis.summary) {
    analysis.summary = {};
  }

  // Ensure confidence is a valid number (0-1 range)
  if (typeof analysis.summary.confidence !== 'number' || !Number.isFinite(analysis.summary.confidence)) {
    analysis.summary.confidence = 0.85; // Default to 85%
  } else if (analysis.summary.confidence > 1) {
    // If it looks like a percentage (0-100), convert to decimal
    analysis.summary.confidence = analysis.summary.confidence / 100;
  }

  // Sanitize metadata
  if (!analysis.metadata) {
    analysis.metadata = {};
  }

  // Ensure OCR confidence is a valid number (0-1 range)
  if (typeof analysis.metadata.ocrConfidence !== 'number' || !Number.isFinite(analysis.metadata.ocrConfidence)) {
    analysis.metadata.ocrConfidence = 0.85; // Default to 85%
  } else if (analysis.metadata.ocrConfidence > 1) {
    // If it looks like a percentage (0-100), convert to decimal
    analysis.metadata.ocrConfidence = analysis.metadata.ocrConfidence / 100;
  }

  // Ensure aiModel has a fallback
  if (!analysis.metadata.aiModel) {
    analysis.metadata.aiModel = 'KI-Analyse';
  }

  // Ensure arrays exist
  if (!Array.isArray(analysis.strengths)) {
    analysis.strengths = [];
  }
  if (!Array.isArray(analysis.weaknesses)) {
    analysis.weaknesses = [];
  }
  if (!Array.isArray(analysis.recommendations)) {
    analysis.recommendations = [];
  }

  return analysis as TestAnalysis;
}
