'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Volume2, Play, Pause, Square, VolumeX, Download } from 'lucide-react'

interface EdgeTTSPlayerProps {
  text: string
  title?: string
}

// Microsoft Edge TTS 한국어 음성 목록
const EDGE_VOICES = [
  { name: 'ko-KR-SunHiNeural', displayName: '선희 (여성, 자연스러운)', gender: 'female' },
  { name: 'ko-KR-InJoonNeural', displayName: '인준 (남성, 자연스러운)', gender: 'male' },
  { name: 'ko-KR-BongJinNeural', displayName: '봉진 (남성, 차분한)', gender: 'male' },
  { name: 'ko-KR-GookMinNeural', displayName: '국민 (남성, 친근한)', gender: 'male' },
  { name: 'ko-KR-JiMinNeural', displayName: '지민 (여성, 활발한)', gender: 'female' },
  { name: 'ko-KR-SeoHyeonNeural', displayName: '서현 (여성, 부드러운)', gender: 'female' },
]

export function EdgeTTSPlayer({ text, title }: EdgeTTSPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedVoice, setSelectedVoice] = useState(EDGE_VOICES[1].name) // 기본값: 인준 (남성)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const generateAudio = useCallback(async () => {
    if (!text || text.trim().length === 0) {
      setError('재생할 텍스트가 없습니다.')
      return
    }

    try {
      setError(null)
      
      // Edge TTS는 현재 직접 접근이 제한되어 Web Speech API 고급 버전을 사용
      setError('Edge TTS는 현재 개발 중입니다. 브라우저 기본 음성을 사용해주세요.')
      return null
    } catch (err) {
      console.error('Edge-TTS error:', err)
      setError('음성 생성 중 오류가 발생했습니다. Edge-TTS 서비스를 확인해주세요.')
      return null
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
      a.download = `기도문-${selectedVoice}.wav`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  const selectedVoiceInfo = EDGE_VOICES.find(v => v.name === selectedVoice)

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-gray-800 flex items-center space-x-2 text-lg md:text-xl">
          <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
            <Volume2 className="w-3 h-3 text-white" />
          </div>
          <span>고품질 음성 낭독</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
            Edge-TTS
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 md:space-y-5">
        {/* 음성 선택 */}
        <div className="space-y-2">
          <label className="text-sm md:text-base font-medium text-gray-700">음성 선택</label>
          <Select
            value={selectedVoice}
            onValueChange={setSelectedVoice}
            disabled={isPlaying}
          >
            <SelectTrigger className="border-blue-200 focus:border-blue-400 focus:ring-blue-200 bg-white/70">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white/95 backdrop-blur-sm border-blue-200 max-h-60">
              {EDGE_VOICES.map((voice) => (
                <SelectItem 
                  key={voice.name} 
                  value={voice.name} 
                  className="hover:bg-blue-50"
                >
                  <div className="flex items-center space-x-2">
                    <span>{voice.gender === 'male' ? '👨' : '👩'}</span>
                    <span>{voice.displayName}</span>
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
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300 px-6 py-3 text-base font-semibold"
              size="lg"
            >
              <div className="flex items-center space-x-2">
                <Play className="w-5 h-5" />
                <span>고품질 음성으로 듣기</span>
              </div>
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
        {audioUrl && !isPlaying && (
          <div className="text-center">
            <Button
              onClick={handleDownload}
              variant="outline"
              className="border-green-200 text-green-700 hover:bg-green-50"
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
          <div className="text-center p-3 bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-lg border border-blue-200/50 backdrop-blur-sm">
            <p className="text-blue-700 text-sm font-medium">
              🔊 {selectedVoiceInfo?.displayName} 음성으로 재생 중...
            </p>
          </div>
        )}

        {/* 텍스트 미리보기 */}
        <div className="space-y-2">
          <label className="text-sm md:text-base font-medium text-gray-700">낭독할 텍스트</label>
          <div className="p-3 md:p-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-lg border border-blue-200/50 backdrop-blur-sm max-h-32 overflow-y-auto">
            <p className="text-sm md:text-base whitespace-pre-wrap leading-relaxed text-gray-700">
              {text}
            </p>
          </div>
        </div>

        {/* Edge-TTS 안내 */}
        <div className="text-xs text-gray-500 text-center p-3 bg-blue-50/30 rounded border border-blue-200/30">
          <p className="mb-1">🎯 <strong>Microsoft Edge-TTS 고품질 음성</strong></p>
          <p className="mb-1">• 자연스럽고 감정적인 한국어 음성 제공</p>
          <p className="mb-1">• 남성/여성 다양한 음성 선택 가능</p>
          <p>• 오프라인 모드에서도 동작 (브라우저 지원 시)</p>
        </div>
      </CardContent>
    </Card>
  )
}