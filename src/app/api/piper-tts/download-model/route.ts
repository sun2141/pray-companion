import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { voice } = await request.json()

    if (!voice) {
      return NextResponse.json(
        { error: '음성 모델명이 필요합니다.' },
        { status: 400 }
      )
    }

    // 모델 파일 저장 디렉토리 생성
    const modelsDir = path.join(process.cwd(), 'public', 'piper-models')
    try {
      await fs.mkdir(modelsDir, { recursive: true })
    } catch (error) {
      // 디렉토리가 이미 존재하는 경우 무시
    }

    // Piper TTS 모델 다운로드 URL (Hugging Face 등에서 호스팅)
    const MODEL_URLS: Record<string, { model: string; config: string }> = {
      'ko_KR-kss-medium': {
        model: 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/ko/ko_KR/kss/medium/ko_KR-kss-medium.onnx',
        config: 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/ko/ko_KR/kss/medium/ko_KR-kss-medium.onnx.json'
      },
      'ko_KR-kss-low': {
        model: 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/ko/ko_KR/kss/low/ko_KR-kss-low.onnx',
        config: 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/ko/ko_KR/kss/low/ko_KR-kss-low.onnx.json'
      }
    }

    const urls = MODEL_URLS[voice]
    if (!urls) {
      return NextResponse.json(
        { error: '지원하지 않는 음성 모델입니다.' },
        { status: 400 }
      )
    }

    const modelPath = path.join(modelsDir, `${voice}.onnx`)
    const configPath = path.join(modelsDir, `${voice}.onnx.json`)

    try {
      // 이미 다운로드된 파일이 있는지 확인
      await fs.access(modelPath)
      await fs.access(configPath)
      
      return NextResponse.json({ 
        success: true, 
        message: '모델이 이미 다운로드되어 있습니다.' 
      })
    } catch {
      // 파일이 없으면 다운로드 진행
    }

    console.log(`Downloading Piper model: ${voice}`)

    // 모델 파일 다운로드
    const modelResponse = await fetch(urls.model)
    if (!modelResponse.ok) {
      throw new Error(`모델 파일 다운로드 실패: ${modelResponse.status}`)
    }

    // 설정 파일 다운로드
    const configResponse = await fetch(urls.config)
    if (!configResponse.ok) {
      throw new Error(`설정 파일 다운로드 실패: ${configResponse.status}`)
    }

    // 파일 저장
    const modelBuffer = await modelResponse.arrayBuffer()
    const configBuffer = await configResponse.arrayBuffer()

    await fs.writeFile(modelPath, Buffer.from(modelBuffer))
    await fs.writeFile(configPath, Buffer.from(configBuffer))

    console.log(`Piper model downloaded successfully: ${voice}`)

    return NextResponse.json({ 
      success: true, 
      message: '모델 다운로드가 완료되었습니다.',
      modelPath,
      configPath
    })

  } catch (error) {
    console.error('Model download error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '모델 다운로드 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}