import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'NOT SET',
    processorId: process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID || 'NOT SET',
    location: process.env.GOOGLE_CLOUD_LOCATION || 'us',
    timestamp: new Date().toISOString()
  });
}