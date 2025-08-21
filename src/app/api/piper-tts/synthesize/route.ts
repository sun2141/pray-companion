import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { spawn } from 'child_process'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { text, voice, speed = 0.9, pitch = 0.9, sentencePause = 0.8 } = await request.json()

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: '합성할 텍스트가 필요합니다.' },
        { status: 400 }
      )
    }

    if (!voice) {
      return NextResponse.json(
        { error: '음성 모델명이 필요합니다.' },
        { status: 400 }
      )
    }

    // 모델 파일 경로 확인
    const modelsDir = path.join(process.cwd(), 'public', 'piper-models')
    const modelPath = path.join(modelsDir, `${voice}.onnx`)
    const configPath = path.join(modelsDir, `${voice}.onnx.json`)

    try {
      await fs.access(modelPath)
      await fs.access(configPath)
    } catch {
      return NextResponse.json(
        { error: '음성 모델이 다운로드되지 않았습니다. 먼저 모델을 다운로드해주세요.' },
        { status: 400 }
      )
    }

    // Piper가 설치되어 있는지 확인
    const piperPath = process.env.PIPER_PATH || 'piper'
    
    console.log(`Synthesizing with Piper: ${voice}, text length: ${text.length}`)

    // 기도에 최적화된 텍스트 전처리
    const processedText = preprocessTextForPrayer(text, sentencePause)

    return new Promise<NextResponse>((resolve, reject) => {
      // Piper TTS 실행
      const piperProcess = spawn(piperPath, [
        '--model', modelPath,
        '--config', configPath,
        '--output-raw'
      ])

      const audioChunks: Buffer[] = []
      let errorOutput = ''

      // 오디오 데이터 수집
      piperProcess.stdout.on('data', (chunk) => {
        audioChunks.push(chunk)
      })

      // 에러 출력 수집
      piperProcess.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })

      // 프로세스 완료 처리
      piperProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Piper process error:', errorOutput)
          resolve(NextResponse.json(
            { error: `음성 합성 실패: ${errorOutput || 'Unknown error'}` },
            { status: 500 }
          ))
          return
        }

        if (audioChunks.length === 0) {
          resolve(NextResponse.json(
            { error: '음성 데이터가 생성되지 않았습니다.' },
            { status: 500 }
          ))
          return
        }

        // 오디오 데이터 병합
        const audioBuffer = Buffer.concat(audioChunks)
        
        // WAV 헤더 추가 (16-bit, 22050 Hz, mono)
        const wavBuffer = addWavHeader(audioBuffer, 22050, 1, 16)

        resolve(new NextResponse(new Uint8Array(wavBuffer), {
          headers: {
            'Content-Type': 'audio/wav',
            'Content-Length': wavBuffer.length.toString(),
            'Cache-Control': 'public, max-age=3600',
            'X-TTS-Provider': 'piper',
            'X-TTS-Model': voice,
          },
        }))
      })

      // 프로세스 에러 처리
      piperProcess.on('error', (error) => {
        console.error('Piper spawn error:', error)
        resolve(NextResponse.json(
          { error: 'Piper TTS를 실행할 수 없습니다. 시스템에 Piper가 설치되어 있는지 확인해주세요.' },
          { status: 500 }
        ))
      })

      // 텍스트 입력
      piperProcess.stdin.write(processedText)
      piperProcess.stdin.end()
    })

  } catch (error) {
    console.error('Piper synthesis error:', error)
    return NextResponse.json(
      { error: '음성 합성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 기도문에 최적화된 텍스트 전처리
function preprocessTextForPrayer(text: string, sentencePause: number): string {
  // 문장 단위로 분리
  const sentences = text.split(/[.!?。！？]/).filter(s => s.trim())
  
  // 각 문장 뒤에 휴지 추가
  const processedSentences = sentences.map(sentence => {
    const trimmed = sentence.trim()
    if (trimmed) {
      // SSML 형태로 휴지 표현 (Piper가 지원하는 경우)
      return `${trimmed}. <break time="${sentencePause}s"/>`
    }
    return trimmed
  })
  
  return processedSentences.join(' ')
}

// WAV 헤더 추가 함수
function addWavHeader(audioData: Buffer, sampleRate: number, channels: number, bitsPerSample: number): Buffer {
  const byteRate = sampleRate * channels * (bitsPerSample / 8)
  const blockAlign = channels * (bitsPerSample / 8)
  const dataSize = audioData.length
  const fileSize = dataSize + 36

  const header = Buffer.alloc(44)
  
  // RIFF 헤더
  header.write('RIFF', 0)
  header.writeUInt32LE(fileSize, 4)
  header.write('WAVE', 8)
  
  // fmt 청크
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16) // fmt 청크 크기
  header.writeUInt16LE(1, 20)  // PCM 포맷
  header.writeUInt16LE(channels, 22)
  header.writeUInt32LE(sampleRate, 24)
  header.writeUInt32LE(byteRate, 28)
  header.writeUInt16LE(blockAlign, 32)
  header.writeUInt16LE(bitsPerSample, 34)
  
  // data 청크
  header.write('data', 36)
  header.writeUInt32LE(dataSize, 40)
  
  return Buffer.concat([header, audioData])
}