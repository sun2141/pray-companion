import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ttsService } from '@/services/ttsService'
import type { TTSRequest, TTSResponse } from '@/types/tts'

const ttsRequestSchema = z.object({
  text: z.string().min(1, 'Text is required').max(1000, 'Text too long'),
  voice: z.enum(['nara', 'jinho', 'clara', 'matt']).optional(),
  speed: z.number().min(0.5).max(2.0).optional(),
  format: z.enum(['mp3', 'wav']).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request
    const validationResult = ttsRequestSchema.safeParse(body)
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
      
      return NextResponse.json({
        success: false,
        error: `Validation failed: ${errors}`,
      } satisfies TTSResponse, { status: 400 })
    }

    const ttsRequest = validationResult.data as TTSRequest

    // Check if Naver TTS credentials are configured
    if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
      return NextResponse.json({
        success: false,
        error: 'TTS service is not configured. Please check server configuration.',
      } satisfies TTSResponse, { status: 503 })
    }

    // Generate TTS
    const result = await ttsService.generateTTS(ttsRequest)

    return NextResponse.json({
      success: true,
      audio: result.audio,
    } satisfies TTSResponse)

  } catch (error) {
    console.error('TTS generation error:', error)

    // Handle specific Naver TTS errors
    if (error instanceof Error) {
      if (error.message.includes('Naver TTS API error: 429')) {
        return NextResponse.json({
          success: false,
          error: 'TTS service rate limit exceeded. Please try again later.',
        } satisfies TTSResponse, { status: 429 })
      }
      
      if (error.message.includes('Naver TTS API error: 401')) {
        return NextResponse.json({
          success: false,
          error: 'TTS service authentication failed.',
        } satisfies TTSResponse, { status: 503 })
      }

      if (error.message.includes('credentials not configured')) {
        return NextResponse.json({
          success: false,
          error: 'TTS service is not configured.',
        } satisfies TTSResponse, { status: 503 })
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to generate TTS audio. Please try again.',
    } satisfies TTSResponse, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use POST to generate TTS audio.',
  }, { status: 405 })
}