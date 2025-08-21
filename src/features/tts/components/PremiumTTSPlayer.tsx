'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Volume2, Play, Square, Download, Users, Settings } from 'lucide-react'

interface PremiumTTSPlayerProps {
  text: string
  title?: string
}

// 음성 캐릭터 정의
const VOICE_CHARACTERS = {
  // Google Cloud TTS
  google: {
    male_adult: { name: 'ko-KR-Neural2-C', displayName: '성인 남성 (차분한)', age: 'adult', gender: 'male' },
    female_adult: { name: 'ko-KR-Neural2-A', displayName: '성인 여성 (온화한)', age: 'adult', gender: 'female' },
    male_elder: { name: 'ko-KR-Wavenet-C', displayName: '장년 남성 (깊은)', age: 'elder', gender: 'male' },
    female_elder: { name: 'ko-KR-Wavenet-A', displayName: '장년 여성 (부드러운)', age: 'elder', gender: 'female' },
  },
  // Azure Speech
  azure: {
    male_adult: { name: 'ko-KR-InJoonNeural', displayName: '성인 남성 (인준)', age: 'adult', gender: 'male' },
    female_adult: { name: 'ko-KR-SunHiNeural', displayName: '성인 여성 (선희)', age: 'adult', gender: 'female' },
    male_elder: { name: 'ko-KR-BongJinNeural', displayName: '장년 남성 (봉진)', age: 'elder', gender: 'male' },
    female_elder: { name: 'ko-KR-SeoHyeonNeural', displayName: '장년 여성 (서현)', age: 'elder', gender: 'female' },
    child: { name: 'ko-KR-JiMinNeural', displayName: '아이 (지민)', age: 'child', gender: 'female' },
  }
}

type TTSProvider = 'google' | 'azure'
type VoiceMode = 'single' | 'multicasting'

export function PremiumTTSPlayer({ text, title }: PremiumTTSPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [provider, setProvider] = useState<TTSProvider>('google')
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('single')
  const [selectedVoice, setSelectedVoice] = useState('male_adult')
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // 기도문을 문장 단위로 분할하는 함수
  const splitIntoSentences = (text: string): string[] => {
    return text
      .split(/[.!?。！？]\s*/)
      .filter(sentence => sentence.trim().length > 0)
      .map(sentence => sentence.trim())
  }

  // SSML 생성 함수 - 기도 톤에 최적화
  const generateSSML = (text: string, provider: TTSProvider): string => {
    const sentences = splitIntoSentences(text)
    
    if (voiceMode === 'single') {
      const voice = VOICE_CHARACTERS[provider][selectedVoice as keyof typeof VOICE_CHARACTERS[typeof provider]]
      
      if (provider === 'google') {
        const ssmlSentences = sentences.map(sentence => 
          `<s><prosody rate="0.9" pitch="-2st" volume="soft">${sentence}.</prosody><break time="700ms"/></s>`
        ).join('\n        ')
        
        return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ko-KR">
      <voice name="${voice.name}">
        <prosody rate="0.9" pitch="-1st">
          <emphasis level="reduced">
            ${ssmlSentences}
          </emphasis>
        </prosody>
      </voice>
    </speak>`
      } else {
        // Azure SSML
        const ssmlSentences = sentences.map(sentence => 
          `<s><prosody rate="0.9" pitch="-10%" volume="soft">${sentence}.</prosody><break time="700ms"/></s>`
        ).join('\n        ')
        
        return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ko-KR">
      <voice name="${voice.name}">
        <prosody rate="0.9" pitch="-5%">
          <emphasis level="reduced">
            ${ssmlSentences}
          </emphasis>
        </prosody>
      </voice>
    </speak>`
      }
    } else {
      // 멀티캐스팅 모드 - 문장마다 다른 음성
      const voices = Object.values(VOICE_CHARACTERS[provider])
      const ssmlSentences = sentences.map((sentence, index) => {
        const voice = voices[index % voices.length]
        const rate = voice.age === 'elder' ? '0.8' : voice.age === 'child' ? '0.95' : '0.9'
        const pitch = voice.gender === 'male' ? '-2st' : voice.age === 'elder' ? '-1st' : '0st'
        
        if (provider === 'google') {
          return `<voice name="${voice.name}">
          <s><prosody rate="${rate}" pitch="${pitch}" volume="soft">${sentence}.</prosody><break time="800ms"/></s>
        </voice>`
        } else {
          const azurePitch = voice.gender === 'male' ? '-10%' : voice.age === 'elder' ? '-5%' : '0%'
          return `<voice name="${voice.name}">
          <s><prosody rate="${rate}" pitch="${azurePitch}" volume="soft">${sentence}.</prosody><break time="800ms"/></s>
        </voice>`
        }
      }).join('\n        ')
      
      return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ko-KR">
      <emphasis level="reduced">
        ${ssmlSentences}
      </emphasis>
    </speak>`
    }
  }

  const generateAudio = useCallback(async () => {
    if (!text || text.trim().length === 0) {
      setError('재생할 텍스트가 없습니다.')
      return null
    }

    try {
      setError(null)
      setIsGenerating(true)
      
      const ssml = generateSSML(text, provider)
      console.log('Generated SSML:', ssml)
      
      const endpoint = provider === 'google' ? '/api/google-tts-ssml' : '/api/azure-tts-ssml'
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ssml,
          provider,
          voiceMode,
          primaryVoice: selectedVoice
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
      console.error('Premium TTS error:', err)
      setError(err instanceof Error ? err.message : '음성 생성 중 오류가 발생했습니다.')
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [text, provider, voiceMode, selectedVoice])

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
      const modeLabel = voiceMode === 'multicasting' ? 'multicasting' : selectedVoice
      const a = document.createElement('a')
      a.href = audioUrl
      a.download = `기도문-${provider}-${modeLabel}.mp3`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  // 오디오 URL이 변경되면 기존 URL 정리
  const resetAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
    }
  }

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-gray-800 flex items-center space-x-2 text-lg md:text-xl">
          <div className="w-6 h-6 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full flex items-center justify-center">
            <Volume2 className="w-3 h-3 text-white" />
          </div>
          <span>프리미엄 기도 음성</span>
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full border border-purple-200">
            SSML 기도 톤
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 md:space-y-5">
        {/* 제공자 선택 */}
        <div className="space-y-2">
          <label className="text-sm md:text-base font-medium text-gray-700">음성 제공자</label>
          <Select
            value={provider}
            onValueChange={(value: TTSProvider) => {
              setProvider(value)
              resetAudio()
            }}
            disabled={isPlaying || isGenerating}
          >
            <SelectTrigger className="border-purple-200 focus:border-purple-400 focus:ring-purple-200 bg-white/70">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white/95 backdrop-blur-sm border-purple-200">
              <SelectItem value="google" className="hover:bg-purple-50">
                <div className="flex items-center space-x-2">
                  <span>🎯</span>
                  <span>Google Cloud TTS (Neural2 고품질)</span>
                </div>
              </SelectItem>
              <SelectItem value="azure" className="hover:bg-purple-50">
                <div className="flex items-center space-x-2">
                  <span>💎</span>
                  <span>Azure Speech (Neural 최신)</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 음성 모드 선택 */}
        <div className="space-y-3">
          <label className="text-sm md:text-base font-medium text-gray-700">음성 모드</label>
          <div className="flex items-center space-x-4 p-3 bg-purple-50/50 rounded-lg border border-purple-200/50">
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium">단일 음성</span>
            </div>
            <Switch
              checked={voiceMode === 'multicasting'}
              onCheckedChange={(checked) => {
                setVoiceMode(checked ? 'multicasting' : 'single')
                resetAudio()
              }}
              disabled={isPlaying || isGenerating}
            />
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium">멀티캐스팅</span>
            </div>
          </div>
        </div>

        {/* 단일 음성 선택 */}
        {voiceMode === 'single' && (
          <div className="space-y-2">
            <label className="text-sm md:text-base font-medium text-gray-700">음성 캐릭터</label>
            <Select
              value={selectedVoice}
              onValueChange={(value) => {
                setSelectedVoice(value)
                resetAudio()
              }}
              disabled={isPlaying || isGenerating}
            >
              <SelectTrigger className="border-purple-200 focus:border-purple-400 focus:ring-purple-200 bg-white/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-sm border-purple-200">
                {Object.entries(VOICE_CHARACTERS[provider]).map(([key, voice]) => (
                  <SelectItem key={key} value={key} className="hover:bg-purple-50">
                    <div className="flex items-center space-x-2">
                      <span>
                        {voice.age === 'child' ? '👶' : 
                         voice.age === 'elder' ? (voice.gender === 'male' ? '👴' : '👵') :
                         voice.gender === 'male' ? '👨' : '👩'}
                      </span>
                      <span>{voice.displayName}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 멀티캐스팅 설명 */}
        {voiceMode === 'multicasting' && (
          <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200/50">
            <p className="text-sm text-blue-700">
              🎭 <strong>멀티캐스팅 모드</strong>: 각 문장을 다른 음성으로 낭독하여 마치 여러 사람이 함께 기도하는 듯한 느낌을 연출합니다.
            </p>
          </div>
        )}

        {/* 재생 컨트롤 */}
        <div className="flex items-center justify-center space-x-3">
          {!isPlaying ? (
            <Button
              onClick={handleSpeak}
              disabled={isGenerating}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300 px-6 py-3 text-base font-semibold"
              size="lg"
            >
              {isGenerating ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>기도 톤 생성 중...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Play className="w-5 h-5" />
                  <span>기도 톤으로 듣기</span>
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
                <span>기도 음성 다운로드</span>
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
          <div className="text-center p-3 bg-gradient-to-r from-purple-50/50 to-indigo-50/50 rounded-lg border border-purple-200/50 backdrop-blur-sm">
            <p className="text-purple-700 text-sm font-medium">
              🙏 {voiceMode === 'multicasting' ? '여러 음성이 함께' : '차분한 기도 톤으로'} 낭독 중...
            </p>
          </div>
        )}

        {/* 텍스트 미리보기 */}
        <div className="space-y-2">
          <label className="text-sm md:text-base font-medium text-gray-700">기도문 미리보기</label>
          <div className="p-3 md:p-4 bg-gradient-to-r from-purple-50/50 to-indigo-50/50 rounded-lg border border-purple-200/50 backdrop-blur-sm max-h-32 overflow-y-auto">
            <p className="text-sm md:text-base whitespace-pre-wrap leading-relaxed text-gray-700">
              {text}
            </p>
          </div>
        </div>

        {/* SSML 기도 톤 안내 */}
        <div className="text-xs text-gray-500 text-center p-3 bg-purple-50/30 rounded border border-purple-200/30">
          <p className="mb-1">🎵 <strong>SSML 기도 톤 최적화</strong></p>
          <p className="mb-1">• 자연스러운 속도 (0.9배)와 낮은 피치로 차분한 분위기</p>
          <p className="mb-1">• 문장 사이 700-800ms 휴지로 묵상 시간 제공</p>
          <p className="mb-1">• 부드러운 강세로 평화로운 기도 환경 조성</p>
          <p>• 멀티캐스팅으로 공동체 기도 느낌 연출</p>
        </div>
      </CardContent>
    </Card>
  )
}