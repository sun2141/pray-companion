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

    // 모델 파일 저장 경로
    const modelsDir = path.join(process.cwd(), 'public', 'piper-models')
    const modelPath = path.join(modelsDir, `${voice}.onnx`)
    const configPath = path.join(modelsDir, `${voice}.onnx.json`)

    try {
      // 모델 파일과 설정 파일이 모두 존재하는지 확인
      await fs.access(modelPath)
      await fs.access(configPath)
      
      return NextResponse.json({ loaded: true })
    } catch {
      return NextResponse.json({ loaded: false })
    }
  } catch (error) {
    console.error('Model status check error:', error)
    return NextResponse.json(
      { error: '모델 상태 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}