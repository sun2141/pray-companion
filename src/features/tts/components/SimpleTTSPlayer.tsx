'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Volume2, Play, Pause, Square, VolumeX } from 'lucide-react'

interface SimpleTTSPlayerProps {
  text: string
  title?: string
}

export function SimpleTTSPlayer({ text, title }: SimpleTTSPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 브라우저 TTS 지원 여부 확인
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

  const handleSpeak = () => {
    if (!isSupported) {
      setError('이 브라우저는 음성 재생을 지원하지 않습니다.')
      return
    }

    if (!text || text.trim().length === 0) {
      setError('재생할 텍스트가 없습니다.')
      return
    }

    try {
      // 기존 재생 중지
      speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      
      // 사용 가능한 음성 목록 가져오기
      const voices = speechSynthesis.getVoices()
      
      // 한국어 음성 찾기 (남성 우선)
      const koreanVoices = voices.filter(voice => 
        voice.lang.includes('ko') || 
        voice.name.includes('Korean') ||
        voice.name.includes('한국')
      )
      
      // 남성 음성 우선 선택
      let selectedVoice = koreanVoices.find(voice => 
        voice.name.toLowerCase().includes('male') ||
        voice.name.toLowerCase().includes('man') ||
        voice.name.includes('남') ||
        !voice.name.toLowerCase().includes('female')
      )
      
      // 남성 음성이 없으면 첫 번째 한국어 음성 사용
      if (!selectedVoice && koreanVoices.length > 0) {
        selectedVoice = koreanVoices[0]
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice
        console.log('Selected voice:', selectedVoice.name, selectedVoice.lang)
      }
      
      // 최적화된 설정
      utterance.lang = 'ko-KR'
      utterance.rate = 0.9   // 적당한 속도
      utterance.pitch = 0.9  // 조금 더 낮게
      utterance.volume = 1.0

      utterance.onstart = () => {
        setIsPlaying(true)
        setError(null)
        console.log('Simple TTS started')
      }

      utterance.onend = () => {
        setIsPlaying(false)
        console.log('Simple TTS ended')
      }

      utterance.onerror = (event) => {
        console.log('Simple TTS error:', event)
        setError('음성 재생 중 문제가 발생했습니다. 브라우저를 새로고침해보세요.')
        setIsPlaying(false)
      }

      speechSynthesis.speak(utterance)
    } catch (err) {
      console.error('Simple TTS error:', err)
      setError('음성 재생을 시작할 수 없습니다.')
      setIsPlaying(false)
    }
  }

  const handleStop = () => {
    if (isSupported) {
      speechSynthesis.cancel()
      setIsPlaying(false)
    }
  }

  if (!isSupported) {
    return (
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <VolumeX className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="font-semibold text-gray-800 mb-2">음성 재생 미지원</h3>
          <p className="text-sm text-gray-600">
            이 브라우저는 음성 재생 기능을 지원하지 않습니다.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-gray-800 flex items-center space-x-2 text-lg md:text-xl">
          <div className="w-6 h-6 bg-gradient-to-r from-orange-400 to-rose-400 rounded-full flex items-center justify-center">
            <Volume2 className="w-3 h-3 text-white" />
          </div>
          <span>음성 낭독</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 재생 컨트롤 */}
        <div className="flex items-center justify-center space-x-3">
          {!isPlaying ? (
            <Button
              onClick={handleSpeak}
              className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300 px-6 py-3 text-base font-semibold"
              size="lg"
            >
              <div className="flex items-center space-x-2">
                <Play className="w-5 h-5" />
                <span>음성으로 듣기</span>
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
          <div className="text-center p-3 bg-gradient-to-r from-orange-50/50 to-rose-50/50 rounded-lg border border-orange-200/50 backdrop-blur-sm">
            <p className="text-orange-700 text-sm font-medium">
              🔊 음성으로 기도문을 들려드리고 있습니다...
            </p>
          </div>
        )}

        {/* 텍스트 미리보기 */}
        <div className="space-y-2">
          <label className="text-sm md:text-base font-medium text-gray-700">낭독할 텍스트</label>
          <div className="p-3 md:p-4 bg-gradient-to-r from-orange-50/50 to-rose-50/50 rounded-lg border border-orange-200/50 backdrop-blur-sm max-h-32 overflow-y-auto">
            <p className="text-sm md:text-base whitespace-pre-wrap leading-relaxed text-gray-700">
              {text}
            </p>
          </div>
        </div>

        {/* 개선된 안내 */}
        <div className="text-xs text-gray-500 text-center p-3 bg-orange-50/30 rounded border border-orange-200/30">
          <p className="mb-1">🎯 <strong>개선된 브라우저 음성</strong></p>
          <p className="mb-1">• 남성 음성 우선 선택으로 더 자연스러운 낭독</p>
          <p className="mb-1">• 최적화된 속도와 톤으로 기도문에 적합</p>
          <p>• 무료이며 인터넷 연결 없이도 사용 가능</p>
        </div>
      </CardContent>
    </Card>
  )
}