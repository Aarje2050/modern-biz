// src/app/api/start-processor/route.ts
import { NextResponse } from 'next/server'
import { emailService } from '@/lib/email/service'

export async function POST() {
  emailService.startEmailProcessor()
  return NextResponse.json({ message: 'Email processor started' })
}