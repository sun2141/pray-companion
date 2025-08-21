import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { ssml, provider, voiceMode, primaryVoice } = await request.json()

    if (!ssml || ssml.trim().length === 0) {
      return NextResponse.json(
        { error: 'SSML 데이터가 필요합니다.' },
        { status: 400 }
      )
    }

    // Google Cloud API 키 확인
    const apiKey = process.env.GOOGLE_CLOUD_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Cloud API 키가 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    console.log('Google TTS SSML Request:', { ssml: ssml.substring(0, 200) + '...', voiceMode, primaryVoice })

    // Google Cloud TTS API 호출
    const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          ssml: ssml
        },
        voice: {
          languageCode: 'ko-KR',
          // SSML에서 음성이 지정되므로 여기서는 기본값만 설정
          name: 'ko-KR-Neural2-C'
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 1.0, // SSML에서 제어하므로 기본값
          pitch: 0.0, // SSML에서 제어하므로 기본값
          volumeGainDb: 0.0,
          effectsProfileId: ['headphone-class-device'], // 헤드폰 최적화
          sampleRateHertz: 24000 // 고품질 샘플레이트
        }
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Google TTS SSML API error:', response.status, errorData)
      
      let errorMessage = 'Google TTS 서비스 오류가 발생했습니다.'
      if (response.status === 401) {
        errorMessage = 'Google Cloud API 키가 올바르지 않습니다.'
      } else if (response.status === 403) {
        errorMessage = 'Google Cloud TTS API 권한이 없습니다. API를 활성화하고 결제 계정을 설정해주세요.'
      } else if (response.status === 429) {
        errorMessage = 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'
      } else if (response.status === 400) {
        errorMessage = 'SSML 형식이 올바르지 않습니다. ' + (errorData.error?.message || '')
      } else if (errorData.error?.message) {
        errorMessage = errorData.error.message
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    if (!data.audioContent) {
      return NextResponse.json(
        { error: '음성 데이터를 받지 못했습니다.' },
        { status: 500 }
      )
    }

    // Base64 디코딩하여 오디오 바이너리 데이터로 변환
    const audioBuffer = Buffer.from(data.audioContent, 'base64')
    
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600', // 1시간 캐시
        'X-TTS-Provider': 'google',
        'X-TTS-Mode': voiceMode || 'single',
      },
    })
  } catch (error) {
    console.error('Google TTS SSML route error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}