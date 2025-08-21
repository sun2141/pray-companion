'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Volume2, Play, Square, Download, Shield, Wifi, WifiOff } from 'lucide-react'

interface OfflineTTSPlayerProps {
  text: string
  title?: string
}

// Piper TTS 한국어 모델 (오프라인 지원)
const PIPER_VOICES = [
  { 
    name: 'ko_KR-kss-medium', 
    displayName: '표준 한국어 (남성)', 
    gender: 'male',
    quality: 'medium',
    size: '25MB',
    description: '깔끔하고 명확한 발음'
  },
  { 
    name: 'ko_KR-kss-low', 
    displayName: '표준 한국어 (경량)', 
    gender: 'neutral',
    quality: 'low',
    size: '10MB',
    description: '빠른 로딩, 기본 품질'
  },
]

export function OfflineTTSPlayer({ text, title }: OfflineTTSPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [selectedVoice, setSelectedVoice] = useState(PIPER_VOICES[0].name)
  const [isModelLoaded, setIsModelLoaded] = useState(false)
  const [modelLoadingProgress, setModelLoadingProgress] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // 모델 로딩 상태 확인
  useEffect(() => {
    checkModelStatus()
  }, [selectedVoice])

  const checkModelStatus = async () => {
    try {
      const response = await fetch('/api/piper-tts/model-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voice: selectedVoice })
      })
      const data = await response.json()
      setIsModelLoaded(data.loaded)
    } catch (err) {
      console.error('Model status check failed:', err)
      setIsModelLoaded(false)
    }
  }

  const downloadModel = async () => {
    try {
      setError(null)
      setModelLoadingProgress(0)
      
      const response = await fetch('/api/piper-tts/download-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voice: selectedVoice })
      })

      if (!response.ok) {
        throw new Error('모델 다운로드에 실패했습니다.')
      }

      // 다운로드 진행률 추적
      const reader = response.body?.getReader()
      if (!reader) throw new Error('다운로드 스트림을 읽을 수 없습니다.')

      const contentLength = response.headers.get('Content-Length')
      const total = contentLength ? parseInt(contentLength, 10) : 0
      let loaded = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        loaded += value?.length || 0
        if (total > 0) {
          setModelLoadingProgress(Math.round((loaded / total) * 100))
        }
      }

      setIsModelLoaded(true)
      setModelLoadingProgress(100)
    } catch (err) {
      console.error('Model download error:', err)
      setError(err instanceof Error ? err.message : '모델 다운로드 중 오류가 발생했습니다.')
    }
  }

  const generateAudio = useCallback(async () => {
    if (!text || text.trim().length === 0) {
      setError('재생할 텍스트가 없습니다.')
      return null
    }

    if (!isModelLoaded) {
      setError('먼저 음성 모델을 다운로드해주세요.')
      return null
    }

    try {
      setError(null)
      setIsGenerating(true)
      
      // Piper TTS 로컬 합성 요청
      const response = await fetch('/api/piper-tts/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          voice: selectedVoice,
          // 기도에 최적화된 설정
          speed: 0.9, // 적당한 속도
          pitch: 0.9, // 약간 낮은 피치
          sentencePause: 0.8, // 문장 간 0.8초 휴지
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '음성 생성에 실패했습니다.')
      }

      const audioBlob = await response.blob()
      const url = URL.createObjectURL(audioBlob)
      setAudioUrl(url)
      
      return url
    } catch (err) {
      console.error('Piper TTS error:', err)
      setError(err instanceof Error ? err.message : '음성 생성 중 오류가 발생했습니다.')
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [text, selectedVoice, isModelLoaded])

  const handleSpeak = async () => {
    try {
      setIsPlaying(true)
      
      let url = audioUrl
      if (!url) {
        url = await generateAudio()
        if (!url) {
          setIsPlaying(false)
          return
        }
      }

      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }

      const audio = new Audio(url)
      audioRef.current = audio

      audio.onended = () => {
        setIsPlaying(false)
      }

      audio.onerror = () => {
        setError('오디오 재생 중 오류가 발생했습니다.')
        setIsPlaying(false)
      }

      await audio.play()
    } catch (err) {
      console.error('Audio playback error:', err)
      setError('음성 재생을 시작할 수 없습니다.')
      setIsPlaying(false)
    }
  }

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsPlaying(false)
  }

  const handleDownload = () => {
    if (audioUrl) {
      const a = document.createElement('a')
      a.href = audioUrl
      a.download = `기도문-오프라인-${selectedVoice}.wav`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  const selectedVoiceInfo = PIPER_VOICES.find(v => v.name === selectedVoice)

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-gray-800 flex items-center space-x-2 text-lg md:text-xl">
          <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center">
            <Volume2 className="w-3 h-3 text-white" />
          </div>
          <span>오프라인 기도 음성</span>
          <div className="flex items-center space-x-1">
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full border border-green-200">
              무료
            </span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
              개인정보 보호
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 md:space-y-5">
        {/* 개인정보 보호 안내 */}
        <div className="p-3 bg-green-50/50 rounded-lg border border-green-200/50">
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">완전한 개인정보 보호</span>
          </div>
          <p className="text-xs text-green-600">
            • 기도문이 외부 서버로 전송되지 않음 • 로컬 디바이스에서만 처리 • 무제한 무료 사용
          </p>
        </div>

        {/* 음성 모델 선택 */}
        <div className="space-y-2">
          <label className="text-sm md:text-base font-medium text-gray-700">오프라인 음성 모델</label>
          <Select
            value={selectedVoice}
            onValueChange={setSelectedVoice}
            disabled={isPlaying || isGenerating}
          >
            <SelectTrigger className="border-green-200 focus:border-green-400 focus:ring-green-200 bg-white/70">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white/95 backdrop-blur-sm border-green-200">
              {PIPER_VOICES.map((voice) => (
                <SelectItem key={voice.name} value={voice.name} className="hover:bg-green-50">
                  <div className="flex items-center space-x-2">
                    <span>{voice.gender === 'male' ? '👨' : '🤖'}</span>
                    <div className="flex flex-col">
                      <span>{voice.displayName}</span>
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="text-gray-500">{voice.description}</span>
                        <span className="bg-gray-100 px-1 rounded text-gray-600">{voice.size}</span>
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 모델 다운로드 상태 */}
        {!isModelLoaded && (
          <div className="space-y-3">
            <div className="p-3 bg-yellow-50/50 rounded-lg border border-yellow-200/50">
              <div className="flex items-center space-x-2 mb-2">
                <WifiOff className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-700">음성 모델 다운로드 필요</span>
              </div>
              <p className="text-xs text-yellow-600 mb-3">
                선택한 음성 모델 ({selectedVoiceInfo?.size})을 한 번만 다운로드하면 오프라인에서 계속 사용할 수 있습니다.
              </p>
              <Button
                onClick={downloadModel}
                disabled={modelLoadingProgress > 0 && modelLoadingProgress < 100}
                className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm"
                size="sm"
              >
                {modelLoadingProgress > 0 && modelLoadingProgress < 100 ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>다운로드 중... {modelLoadingProgress}%</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Download className="w-3 h-3" />
                    <span>모델 다운로드 ({selectedVoiceInfo?.size})</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* 오프라인 상태 표시 */}
        {isModelLoaded && (
          <div className="p-2 bg-green-50/30 rounded border border-green-200/30 text-center">
            <div className="flex items-center justify-center space-x-2 text-green-700">
              <Wifi className="w-4 h-4" />
              <span className="text-sm font-medium">오프라인 준비 완료</span>
            </div>
          </div>
        )}

        {/* 재생 컨트롤 */}
        <div className="flex items-center justify-center space-x-3">
          {!isPlaying ? (
            <Button
              onClick={handleSpeak}
              disabled={isGenerating || !isModelLoaded}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300 px-6 py-3 text-base font-semibold"
              size="lg"
            >
              {isGenerating ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>로컬 합성 중...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Play className="w-5 h-5" />
                  <span>오프라인 음성으로 듣기</span>
                </div>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleStop}
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50 px-6 py-3 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-300"
              size="lg"
            >
              <div className="flex items-center space-x-2">
                <Square className="w-5 h-5" />
                <span>정지</span>
              </div>
            </Button>
          )}
        </div>

        {/* 다운로드 버튼 */}
        {audioUrl && !isPlaying && !isGenerating && (
          <div className="text-center">
            <Button
              onClick={handleDownload}
              variant="outline"
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
              size="sm"
            >
              <div className="flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>음성파일 다운로드</span>
              </div>
            </Button>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="p-3 bg-red-50/80 border border-red-200 rounded-lg backdrop-blur-sm">
            <p className="text-red-600 text-sm flex items-center space-x-2">
              <span>⚠️</span>
              <span>{error}</span>
            </p>
          </div>
        )}

        {/* 재생 상태 */}
        {isPlaying && (
          <div className="text-center p-3 bg-gradient-to-r from-green-50/50 to-emerald-50/50 rounded-lg border border-green-200/50 backdrop-blur-sm">
            <p className="text-green-700 text-sm font-medium">
              🔐 오프라인으로 {selectedVoiceInfo?.displayName} 음성 재생 중...
            </p>
          </div>
        )}

        {/* 텍스트 미리보기 */}
        <div className="space-y-2">
          <label className="text-sm md:text-base font-medium text-gray-700">기도문</label>
          <div className="p-3 md:p-4 bg-gradient-to-r from-green-50/50 to-emerald-50/50 rounded-lg border border-green-200/50 backdrop-blur-sm max-h-32 overflow-y-auto">
            <p className="text-sm md:text-base whitespace-pre-wrap leading-relaxed text-gray-700">
              {text}
            </p>
          </div>
        </div>

        {/* Piper TTS 안내 */}
        <div className="text-xs text-gray-500 text-center p-3 bg-green-50/30 rounded border border-green-200/30">
          <p className="mb-1">🤖 <strong>Piper TTS - 오픈소스 로컬 TTS</strong></p>
          <p className="mb-1">• 완전 무료, 무제한 사용</p>
          <p className="mb-1">• 기도문이 외부로 전송되지 않음 (완전한 개인정보 보호)</p>
          <p className="mb-1">• 인터넷 연결 없이도 동작 (모델 다운로드 후)</p>
          <p>• 품질은 중간 수준이지만 안전하고 안정적</p>
        </div>
      </CardContent>
    </Card>
  )
}