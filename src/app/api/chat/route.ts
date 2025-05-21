// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { messages, businessId } = await request.json()
    
    // Optional: Log or track usage by business
    console.log(`Chat request for business: ${businessId}`)
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo", // Or a more affordable model like gpt-3.5-turbo
      messages,
      temperature: 0.7,
      max_tokens: 500
    })
    
    return NextResponse.json({
      message: response.choices[0].message.content
    })
  } catch (error) {
    console.error('OpenAI API error:', error)
    return NextResponse.json(
      { error: 'There was an error processing your request' },
      { status: 500 }
    )
  }
}