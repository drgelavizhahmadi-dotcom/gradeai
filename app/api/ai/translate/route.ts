import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { prompt, targetLanguage, analysisData } = await request.json()
    
    // Validate input
    if (!prompt || !targetLanguage || !analysisData) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }
    
    // Check cache first (Redis/database) - implement if you have caching
    const cacheKey = `translation:${analysisData.metadata?.analysisTimestamp}:${targetLanguage}`
    // const cached = await redis.get(cacheKey);
    // if (cached) return NextResponse.json(JSON.parse(cached));
    
    console.log(`Translating report to ${targetLanguage}...`)
    
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      temperature: 0.3, // Lower temperature for more consistent translations
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const textBlock = response.content.find((block): block is Anthropic.TextBlock => block.type === 'text')
    if (!textBlock) {
      throw new Error('No text content in translation response')
    }
    const translatedText = textBlock.text
    
    // Parse the JSON response
    let translatedData
    try {
      // Handle potential markdown code blocks
      const jsonMatch = translatedText.match(/```json\n?([\s\S]*?)\n?```/) || 
                        translatedText.match(/```\n?([\s\S]*?)\n?```/)
      const jsonString = jsonMatch ? jsonMatch[1] : translatedText
      translatedData = JSON.parse(jsonString.trim())
    } catch (parseError) {
      console.error('Failed to parse translation:', parseError)
      console.error('Raw response:', translatedText)
      return NextResponse.json(
        { error: 'Translation parsing failed', details: parseError instanceof Error ? parseError.message : 'Unknown error' },
        { status: 500 }
      )
    }
    
    // Cache the result (implement if you have Redis or similar)
    // await redis.set(cacheKey, JSON.stringify(translatedData), 'EX', 86400); // 24 hours
    
    console.log(`Successfully translated to ${targetLanguage}`)
    
    return NextResponse.json(translatedData)
    
  } catch (error) {
    console.error('Translation API error:', error)
    return NextResponse.json(
      { 
        error: 'Translation failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
