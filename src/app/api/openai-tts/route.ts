import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { text, voice = 'fable', model = 'tts-1', speed = 1.0 } = await request.json()

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: '텍스트가 필요합니다.' },
        { status: 400 }
      )
    }

    // OpenAI API 키 확인
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API 키가 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    // OpenAI TTS API 호출
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: text.trim(),
        voice,
        speed: Math.max(0.25, Math.min(4.0, speed)), // 0.25 ~ 4.0 범위로 제한
        response_format: 'mp3'
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('OpenAI TTS API error:', response.status, errorData)
      
      let errorMessage = 'TTS 서비스 오류가 발생했습니다.'
      if (response.status === 401) {
        errorMessage = 'OpenAI API 키가 올바르지 않습니다.'
      } else if (response.status === 429) {
        errorMessage = 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'
      } else if (errorData.error?.message) {
        errorMessage = errorData.error.message
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }

    const audioBuffer = await response.arrayBuffer()
    
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600', // 1시간 캐시
      },
    })
  } catch (error) {
    console.error('OpenAI TTS route error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}