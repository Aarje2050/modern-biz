// src/app/api/generate-content/route.ts
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { fieldType, businessName, category } = await request.json()
    
    // Create different prompts based on field type
    let prompt = ''
    
    if (fieldType === 'short_description') {
      prompt = `Write a concise, compelling one-sentence description for a business called "${businessName}" ${category ? `in the ${category} industry` : ''}. Keep it under 150 characters. Make it appealing to potential customers.`
    } else if (fieldType === 'description') {
      prompt = `Write a professional, engaging description for a business called "${businessName}" ${category ? `in the ${category} industry` : ''}. Include 3-4 paragraphs that highlight the value proposition, unique selling points, and appeal to customers. Keep it professionally written and persuasive without being overly sales-focused.`
    }
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo", // Or a more affordable model like gpt-3.5-turbo
      messages: [
        {
          role: "system",
          content: "You are a professional business content writer who crafts compelling business descriptions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: fieldType === 'short_description' ? 100 : 500
    })
    
    return NextResponse.json({
      content: response.choices[0].message.content?.trim()
    })
  } catch (error) {
    console.error('OpenAI API error:', error)
    return NextResponse.json(
      { error: 'There was an error generating content' },
      { status: 500 }
    )
  }
}