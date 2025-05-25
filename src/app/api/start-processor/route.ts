// src/app/api/start-processor/route.ts
export const dynamic = 'force-dynamic'


import { NextResponse } from 'next/server'

export async function POST() {
  const { emailService } = await import('@/lib/email/service')



  emailService.startEmailProcessor()
  return NextResponse.json({ message: 'Email processor started' })
}