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

    // Azure Speech API 키 확인
    const apiKey = process.env.AZURE_SPEECH_KEY
    const region = process.env.AZURE_SPEECH_REGION || 'koreacentral'
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Azure Speech API 키가 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    console.log('Azure TTS SSML Request:', { ssml: ssml.substring(0, 200) + '...', voiceMode, primaryVoice, region })

    // Azure Speech Services API 호출
    const response = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3',
        'User-Agent': 'PrayerCompanion/1.0'
      },
      body: ssml,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Azure TTS SSML API error:', response.status, errorText)
      
      let errorMessage = 'Azure Speech 서비스 오류가 발생했습니다.'
      if (response.status === 401) {
        errorMessage = 'Azure Speech API 키가 올바르지 않습니다.'
      } else if (response.status === 403) {
        errorMessage = 'Azure Speech API 권한이 없습니다. 구독을 확인해주세요.'
      } else if (response.status === 429) {
        errorMessage = 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'
      } else if (response.status === 400) {
        errorMessage = 'SSML 형식이 올바르지 않습니다. ' + errorText
      } else {
        errorMessage = `Azure 오류: ${response.status} - ${errorText}`
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }

    const audioBuffer = await response.arrayBuffer()
    
    if (audioBuffer.byteLength === 0) {
      return NextResponse.json(
        { error: '음성 데이터를 받지 못했습니다.' },
        { status: 500 }
      )
    }

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600', // 1시간 캐시
        'X-TTS-Provider': 'azure',
        'X-TTS-Mode': voiceMode || 'single',
      },
    })
  } catch (error) {
    console.error('Azure TTS SSML route error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}