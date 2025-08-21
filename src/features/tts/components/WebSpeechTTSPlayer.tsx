'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Volume2, Play, Pause, Square, VolumeX } from 'lucide-react'
import { useWebSpeechTTS } from '../hooks/useWebSpeechTTS'

interface WebSpeechTTSPlayerProps {
  text: string
  title?: string
}

export function WebSpeechTTSPlayer({ text, title }: WebSpeechTTSPlayerProps) {
  const [rate, setRate] = useState<number>(1.0)
  const [pitch, setPitch] = useState<number>(1.0)
  const [volume, setVolume] = useState<number>(1.0)
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState<number>(0)
  
  const {
    isSupported,
    isPlaying,
    isPaused,
    error,
    availableVoices,
    speak,
    togglePause,
    stop,
    getKoreanVoice
  } = useWebSpeechTTS()

  const handleSpeak = () => {
    const selectedVoice = availableVoices[selectedVoiceIndex] || getKoreanVoice()
    
    speak({
      text,
      rate,
      pitch,
      volume,
      lang: 'ko-KR'
    })
  }

  const getVoiceDisplayName = (voice: SpeechSynthesisVoice) => {
    if (voice.lang.includes('ko')) {
      return `🇰🇷 ${voice.name}`
    }
    return `${voice.name} (${voice.lang})`
  }

  const getRateDisplayText = (rate: number) => {
    if (rate <= 0.7) return '🐌 느리게'
    if (rate <= 0.9) return '🚶 조금 느리게'
    if (rate <= 1.1) return '👍 보통'
    if (rate <= 1.3) return '🏃 조금 빠르게'
    return '⚡ 빠르게'
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
      <CardContent className="space-y-4 md:space-y-5">
        {/* 음성 선택 */}
        {availableVoices.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm md:text-base font-medium text-gray-700">음성 선택</label>
            <Select
              value={selectedVoiceIndex.toString()}
              onValueChange={(value) => setSelectedVoiceIndex(parseInt(value))}
              disabled={isPlaying}
            >
              <SelectTrigger className="border-orange-200 focus:border-orange-400 focus:ring-orange-200 bg-white/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-sm border-orange-200 max-h-60">
                {availableVoices.map((voice, index) => (
                  <SelectItem 
                    key={index} 
                    value={index.toString()} 
                    className="hover:bg-orange-50"
                  >
                    {getVoiceDisplayName(voice)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 속도 조절 */}
        <div className="space-y-2">
          <label className="text-sm md:text-base font-medium text-gray-700">
            읽기 속도: {getRateDisplayText(rate)} ({rate.toFixed(1)}x)
          </label>
          <Slider
            value={[rate]}
            onValueChange={([value]) => setRate(value)}
            min={0.5}
            max={2.0}
            step={0.1}
            disabled={isPlaying}
            className="w-full"
          />
        </div>

        {/* 음성 높이 조절 */}
        <div className="space-y-2">
          <label className="text-sm md:text-base font-medium text-gray-700">
            음성 높이: {pitch.toFixed(1)}
          </label>
          <Slider
            value={[pitch]}
            onValueChange={([value]) => setPitch(value)}
            min={0.5}
            max={2.0}
            step={0.1}
            disabled={isPlaying}
            className="w-full"
          />
        </div>

        {/* 볼륨 조절 */}
        <div className="space-y-2">
          <label className="text-sm md:text-base font-medium text-gray-700">
            볼륨: {Math.round(volume * 100)}%
          </label>
          <Slider
            value={[volume]}
            onValueChange={([value]) => setVolume(value)}
            min={0}
            max={1}
            step={0.1}
            className="w-full"
          />
        </div>

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
            <>
              <Button
                onClick={togglePause}
                variant="outline"
                className="border-orange-200 text-orange-700 hover:bg-orange-50 px-4 py-3 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                size="lg"
              >
                <div className="flex items-center space-x-2">
                  {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                  <span>{isPaused ? '재개' : '일시정지'}</span>
                </div>
              </Button>
              
              <Button
                onClick={stop}
                variant="outline"
                className="border-red-200 text-red-700 hover:bg-red-50 px-4 py-3 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                size="lg"
              >
                <div className="flex items-center space-x-2">
                  <Square className="w-5 h-5" />
                  <span>정지</span>
                </div>
              </Button>
            </>
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
              {isPaused ? '⏸️ 일시정지됨' : '🔊 재생 중...'}
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

        {/* 브라우저 TTS 안내 */}
        <div className="text-xs text-gray-500 text-center p-3 bg-orange-50/30 rounded border border-orange-200/30">
          <p className="mb-1">💡 <strong>브라우저 음성 엔진 사용</strong></p>
          <p className="mb-1">• 음성 품질은 운영체제와 브라우저에 따라 다를 수 있습니다</p>
          <p className="mb-1">• Chrome/Safari에서는 사용자 클릭 후 음성이 재생됩니다</p>
          <p>• 한국어 음성이 없다면 시스템 설정에서 한국어 음성을 추가해보세요</p>
        </div>
      </CardContent>
    </Card>
  )
}