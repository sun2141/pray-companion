import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prayerService } from '@/services/prayerService'
import { EnhancedPrayerService } from '@/services/enhancedPrayerService'
import type { PrayerGenerationRequest, PrayerGenerationResponse } from '@/types/prayer'

const prayerRequestSchema = z.object({
  title: z.string().min(1, 'Prayer title is required').max(100, 'Title too long'),
  category: z.string().optional(),
  situation: z.string().max(500, 'Situation description too long').optional(),
  tone: z.enum(['formal', 'casual', 'warm']).optional(),
  length: z.enum(['short', 'long']).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request
    const validationResult = prayerRequestSchema.safeParse(body)
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
      
      return NextResponse.json({
        success: false,
        error: `Validation failed: ${errors}`,
      } satisfies PrayerGenerationResponse, { status: 400 })
    }

    const prayerRequest = validationResult.data as PrayerGenerationRequest

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'AI service is not configured. Please check server configuration.',
      } satisfies PrayerGenerationResponse, { status: 503 })
    }

    // Generate prayer with enhanced service, fallback to original if failed
    let result
    try {
      console.log('Attempting enhanced prayer generation...')
      const enhancedResult = await EnhancedPrayerService.generateEnhancedPrayer(prayerRequest)
      result = { prayer: enhancedResult }
      console.log('Generated with enhanced service')
    } catch (enhancedError) {
      console.warn('Enhanced service failed, using fallback:', enhancedError)
      result = await prayerService.generatePrayer(prayerRequest)
      console.log('Generated with fallback service')
    }

    return NextResponse.json({
      success: true,
      prayer: result.prayer,
    } satisfies PrayerGenerationResponse)

  } catch (error) {
    console.error('Prayer generation error:', error)

    // Handle specific OpenAI errors
    if (error && typeof error === 'object' && 'code' in error) {
      switch ((error as any).code) {
        case 'insufficient_quota':
          return NextResponse.json({
            success: false,
            error: 'AI service quota exceeded. Please try again later.',
          } satisfies PrayerGenerationResponse, { status: 429 })
        
        case 'invalid_api_key':
          return NextResponse.json({
            success: false,
            error: 'AI service configuration error.',
          } satisfies PrayerGenerationResponse, { status: 503 })
        
        default:
          break
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to generate prayer. Please try again.',
    } satisfies PrayerGenerationResponse, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use POST to generate prayers.',
  }, { status: 405 })
}