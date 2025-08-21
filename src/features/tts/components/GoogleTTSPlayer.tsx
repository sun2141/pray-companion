'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Volume2, Play, Pause, Square, VolumeX, Download } from 'lucide-react'

interface GoogleTTSPlayerProps {
  text: string
  title?: string
}

// Google Cloud TTS 한국어 음성 목록 (저렴하고 고품질)
const GOOGLE_VOICES = [
  { name: 'ko-KR-Standard-C', displayName: '표준-C (남성, 깊은 목소리)', gender: 'male', type: 'Standard' },
  { name: 'ko-KR-Standard-D', displayName: '표준-D (여성, 따뜻한)', gender: 'female', type: 'Standard' },
  { name: 'ko-KR-Wavenet-A', displayName: 'WaveNet-A (여성, 자연스러운)', gender: 'female', type: 'WaveNet' },
  { name: 'ko-KR-Wavenet-B', displayName: 'WaveNet-B (여성, 부드러운)', gender: 'female', type: 'WaveNet' },
  { name: 'ko-KR-Wavenet-C', displayName: 'WaveNet-C (남성, 자연스러운)', gender: 'male', type: 'WaveNet' },
  { name: 'ko-KR-Wavenet-D', displayName: 'WaveNet-D (남성, 친근한)', gender: 'male', type: 'WaveNet' },
  { name: 'ko-KR-Neural2-A', displayName: 'Neural2-A (여성, AI 고품질)', gender: 'female', type: 'Neural2' },
  { name: 'ko-KR-Neural2-B', displayName: 'Neural2-B (여성, AI 부드러운)', gender: 'female', type: 'Neural2' },
  { name: 'ko-KR-Neural2-C', displayName: 'Neural2-C (남성, AI 자연스러운)', gender: 'male', type: 'Neural2' },
]

export function GoogleTTSPlayer({ text, title }: GoogleTTSPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedVoice, setSelectedVoice] = useState(GOOGLE_VOICES[2].name) // 기본값: WaveNet-C (남성)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const generateAudio = useCallback(async () => {
    if (!text || text.trim().length === 0) {
      setError('재생할 텍스트가 없습니다.')
      return
    }

    try {
      setError(null)
      setIsGenerating(true)
      
      // Google Cloud TTS API 호출
      const response = await fetch('/api/google-tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          voice: selectedVoice,
          speakingRate: 0.9, // 조금 천천히
          pitch: 0.0, // 자연스러운 음조
          volumeGainDb: 0.0 // 기본 볼륨
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
      console.error('Google TTS error:', err)
      setError(err instanceof Error ? err.message : '음성 생성 중 오류가 발생했습니다.')
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [text, selectedVoice])

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
      a.download = `기도문-${selectedVoice}.mp3`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  const selectedVoiceInfo = GOOGLE_VOICES.find(v => v.name === selectedVoice)
  const getVoiceTypeColor = (type: string) => {
    switch (type) {
      case 'Standard': return 'bg-blue-100 text-blue-700'
      case 'WaveNet': return 'bg-green-100 text-green-700'
      case 'Neural2': return 'bg-purple-100 text-purple-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-gray-800 flex items-center space-x-2 text-lg md:text-xl">
          <div className="w-6 h-6 bg-gradient-to-r from-red-400 to-pink-400 rounded-full flex items-center justify-center">
            <Volume2 className="w-3 h-3 text-white" />
          </div>
          <span>Google 고품질 음성</span>
          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full border border-red-200">
            저렴한 유료
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 md:space-y-5">
        {/* 음성 선택 */}
        <div className="space-y-2">
          <label className="text-sm md:text-base font-medium text-gray-700">Google 음성 선택</label>
          <Select
            value={selectedVoice}
            onValueChange={setSelectedVoice}
            disabled={isPlaying || isGenerating}
          >
            <SelectTrigger className="border-red-200 focus:border-red-400 focus:ring-red-200 bg-white/70">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white/95 backdrop-blur-sm border-red-200 max-h-60">
              {GOOGLE_VOICES.map((voice) => (
                <SelectItem 
                  key={voice.name} 
                  value={voice.name} 
                  className="hover:bg-red-50"
                >
                  <div className="flex items-center space-x-2">
                    <span>{voice.gender === 'male' ? '👨' : '👩'}</span>
                    <div className="flex flex-col">
                      <span>{voice.displayName}</span>
                      <span className={`text-xs px-1 rounded ${getVoiceTypeColor(voice.type)}`}>
                        {voice.type}
                      </span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 재생 컨트롤 */}
        <div className="flex items-center justify-center space-x-3">
          {!isPlaying ? (
            <Button
              onClick={handleSpeak}
              disabled={isGenerating}
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300 px-6 py-3 text-base font-semibold"
              size="lg"
            >
              {isGenerating ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Google 음성 생성 중...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Play className="w-5 h-5" />
                  <span>Google 음성으로 듣기</span>
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
          <div className="text-center p-3 bg-gradient-to-r from-red-50/50 to-pink-50/50 rounded-lg border border-red-200/50 backdrop-blur-sm">
            <p className="text-red-700 text-sm font-medium">
              🎵 {selectedVoiceInfo?.displayName} 음성으로 재생 중...
            </p>
          </div>
        )}

        {/* 텍스트 미리보기 */}
        <div className="space-y-2">
          <label className="text-sm md:text-base font-medium text-gray-700">낭독할 텍스트</label>
          <div className="p-3 md:p-4 bg-gradient-to-r from-red-50/50 to-pink-50/50 rounded-lg border border-red-200/50 backdrop-blur-sm max-h-32 overflow-y-auto">
            <p className="text-sm md:text-base whitespace-pre-wrap leading-relaxed text-gray-700">
              {text}
            </p>
          </div>
        </div>

        {/* Google TTS 안내 */}
        <div className="text-xs text-gray-500 text-center p-3 bg-red-50/30 rounded border border-red-200/30">
          <p className="mb-1">🎯 <strong>Google Cloud TTS</strong></p>
          <p className="mb-1">• 가장 자연스러운 한국어 남성/여성 음성</p>
          <p className="mb-1">• 매우 저렴한 비용 (1백만 자당 $4)</p>
          <p className="mb-1">• WaveNet/Neural2 AI 음성 기술</p>
          <p>• 전문적인 품질의 음성 합성</p>
        </div>
      </CardContent>
    </Card>
  )
}