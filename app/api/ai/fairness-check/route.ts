import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { prompt, imageData, analysisData, targetLanguage } = await request.json()
    
    // Validate input
    if (!prompt || !analysisData) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }
    
    console.log(`Running fairness check analysis...`)
    
    const messages: any[] = [
      {
        role: 'user',
        content: imageData 
          ? [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: imageData,
                },
              },
              {
                type: 'text',
                text: prompt
              }
            ]
          : prompt
      }
    ]
    
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      temperature: 0.3, // Lower temperature for more objective analysis
      messages
    })
    
    const textBlock = response.content.find((block): block is Anthropic.TextBlock => block.type === 'text')
    if (!textBlock) {
      throw new Error('No text content in response')
    }
    const analysisText = textBlock.text
    
    // Parse the JSON response
    let fairnessData
    try {
      // Handle potential markdown code blocks
      const jsonMatch = analysisText.match(/```json\n?([\s\S]*?)\n?```/) || 
                        analysisText.match(/```\n?([\s\S]*?)\n?```/)
      const jsonString = jsonMatch ? jsonMatch[1] : analysisText
      fairnessData = JSON.parse(jsonString.trim())
    } catch (parseError) {
      console.error('Failed to parse fairness check:', parseError)
      console.error('Raw response:', analysisText)
      return NextResponse.json(
        { error: 'Fairness check parsing failed', details: parseError instanceof Error ? parseError.message : 'Unknown error' },
        { status: 500 }
      )
    }
    
    console.log(`Fairness check completed: ${fairnessData.fairnessAnalysis.overallVerdict}`)
    
    return NextResponse.json(fairnessData)
    
  } catch (error) {
    console.error('Fairness check API error:', error)
    return NextResponse.json(
      { 
        error: 'Fairness check failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
