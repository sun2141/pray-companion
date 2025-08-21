import { NextRequest, NextResponse } from 'next/server'
import { EnhancedPrayerService } from '@/services/enhancedPrayerService'

export async function POST(request: NextRequest) {
  try {
    const { prayerId, rating, feedback, improvements } = await request.json()

    // 입력 유효성 검사
    if (!prayerId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었거나 올바르지 않습니다.' },
        { status: 400 }
      )
    }

    // 피드백 저장
    await EnhancedPrayerService.saveFeedback({
      prayerId,
      rating,
      feedback: feedback || '',
      improvements: improvements || [],
    })

    console.log('Prayer feedback saved:', {
      prayerId,
      rating,
      improvementsCount: improvements?.length || 0
    })

    return NextResponse.json({
      success: true,
      message: '피드백이 성공적으로 저장되었습니다.'
    })

  } catch (error) {
    console.error('Prayer feedback API error:', error)
    return NextResponse.json(
      { error: '피드백 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}