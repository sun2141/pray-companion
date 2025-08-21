'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

export interface WebSpeechTTSOptions {
  text: string
  voice?: string
  rate?: number // 0.1 ~ 10
  pitch?: number // 0 ~ 2
  volume?: number // 0 ~ 1
  lang?: string
}

export const useWebSpeechTTS = () => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // 사용 가능한 음성 목록 로드
  useEffect(() => {
    const loadVoices = () => {
      try {
        const voices = speechSynthesis.getVoices()
        console.log('Available voices:', voices.length, voices.map(v => ({ name: v.name, lang: v.lang })))
        
        // 한국어 음성 우선 정렬
        const sortedVoices = voices.sort((a, b) => {
          if (a.lang.includes('ko') && !b.lang.includes('ko')) return -1
          if (!a.lang.includes('ko') && b.lang.includes('ko')) return 1
          return 0
        })
        setAvailableVoices(sortedVoices)
      } catch (error) {
        console.error('Error loading voices:', error)
        setAvailableVoices([])
      }
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // 즉시 로드 시도
      loadVoices()
      
      // 음성 목록이 비어있다면 약간의 지연 후 다시 시도
      if (speechSynthesis.getVoices().length === 0) {
        setTimeout(loadVoices, 100)
        setTimeout(loadVoices, 500)
        setTimeout(loadVoices, 1000)
      }
      
      // 음성 변경 이벤트 리스너
      speechSynthesis.onvoiceschanged = loadVoices
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        speechSynthesis.onvoiceschanged = null
      }
    }
  }, [])

  // 브라우저 TTS 지원 여부 확인
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

  // 한국어 음성 찾기
  const getKoreanVoice = useCallback(() => {
    return availableVoices.find(voice => 
      voice.lang.includes('ko') || 
      voice.name.includes('Korean') ||
      voice.name.includes('한국')
    )
  }, [availableVoices])

  // TTS 재생
  const speak = useCallback((options: WebSpeechTTSOptions) => {
    if (!isSupported) {
      setError('이 브라우저는 음성 재생을 지원하지 않습니다.')
      return false
    }

    // 텍스트 유효성 검증
    if (!options.text || options.text.trim().length === 0) {
      setError('재생할 텍스트가 없습니다.')
      return false
    }

    // 텍스트 길이 제한 (브라우저 제한 회피)
    let textToSpeak = options.text.trim()
    if (textToSpeak.length > 32767) {
      textToSpeak = textToSpeak.substring(0, 32767)
      console.warn('Text truncated to 32767 characters for speech synthesis')
    }

    try {
      // 기존 재생 중지
      stop()

      // 음성 합성 큐가 비어있는지 확인
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel()
      }

      const utterance = new SpeechSynthesisUtterance(textToSpeak)
      
      // 음성 설정
      const koreanVoice = getKoreanVoice()
      if (koreanVoice && koreanVoice.voiceURI) {
        utterance.voice = koreanVoice
      }
      
      utterance.lang = options.lang || 'ko-KR'
      utterance.rate = Math.max(0.1, Math.min(10, options.rate || 1.0))
      utterance.pitch = Math.max(0, Math.min(2, options.pitch || 1.0))
      utterance.volume = Math.max(0, Math.min(1, options.volume || 1.0))

      // 이벤트 핸들러
      utterance.onstart = () => {
        setIsPlaying(true)
        setIsPaused(false)
        setError(null)
      }

      utterance.onend = () => {
        setIsPlaying(false)
        setIsPaused(false)
        utteranceRef.current = null
      }

      utterance.onerror = (event) => {
        // 안전한 오류 정보 추출
        const errorInfo = {
          error: event?.error || 'unknown',
          type: event?.type || 'error',
          elapsedTime: event?.elapsedTime || 0,
          charIndex: event?.charIndex || 0,
          eventKeys: event ? Object.keys(event) : []
        }
        
        console.error('Speech synthesis error:', errorInfo)
        console.error('Raw event object:', event)
        
        let errorMessage = '음성 재생 중 오류가 발생했습니다.'
        
        // 안전한 에러 타입 확인
        const errorType = event?.error || ''
        
        switch (errorType) {
          case 'network':
            errorMessage = '네트워크 연결을 확인해주세요.'
            break
          case 'synthesis-unavailable':
            errorMessage = '음성 합성을 사용할 수 없습니다.'
            break
          case 'synthesis-failed':
            errorMessage = '음성 합성에 실패했습니다. 다시 시도해주세요.'
            break
          case 'audio-busy':
            errorMessage = '오디오가 사용 중입니다. 잠시 후 다시 시도해주세요.'
            break
          case 'not-allowed':
            errorMessage = '음성 재생 권한이 없습니다. 브라우저 설정을 확인해주세요.'
            break
          case 'text-too-long':
            errorMessage = '텍스트가 너무 깁니다.'
            break
          case 'invalid-argument':
            errorMessage = '잘못된 설정입니다.'
            break
          case 'interrupted':
            errorMessage = '음성 재생이 중단되었습니다.'
            break
          case '':
          case 'unknown':
          default:
            // 사용 가능한 음성이 없는 경우
            if (availableVoices.length === 0) {
              errorMessage = '사용 가능한 음성이 없습니다. 브라우저를 새로고침하거나 시스템에 한국어 음성을 설치해보세요.'
            } else {
              errorMessage = '음성 재생에 실패했습니다. 다른 음성을 선택하거나 브라우저를 새로고침해보세요.'
            }
        }
        
        setError(errorMessage)
        setIsPlaying(false)
        setIsPaused(false)
        utteranceRef.current = null
      }

      utterance.onpause = () => {
        setIsPaused(true)
      }

      utterance.onresume = () => {
        setIsPaused(false)
      }

      utteranceRef.current = utterance
      
      // 안전한 재생 시작
      try {
        speechSynthesis.speak(utterance)
        
        // iOS Safari 호환성을 위한 추가 처리
        if (speechSynthesis.paused && speechSynthesis.speaking) {
          speechSynthesis.resume()
        }
        
        return true
      } catch (speakError) {
        console.error('Error calling speechSynthesis.speak:', speakError)
        setError('음성 재생을 시작할 수 없습니다. 브라우저를 새로고침 후 다시 시도해주세요.')
        setIsPlaying(false)
        setIsPaused(false)
        utteranceRef.current = null
        return false
      }
    } catch (err) {
      console.error('Error starting speech synthesis:', err)
      setError('음성 재생을 시작할 수 없습니다.')
      return false
    }
  }, [isSupported, getKoreanVoice])

  // 일시정지/재개
  const togglePause = useCallback(() => {
    if (!isSupported || !isPlaying) return

    if (isPaused) {
      speechSynthesis.resume()
    } else {
      speechSynthesis.pause()
    }
  }, [isSupported, isPlaying, isPaused])

  // 정지
  const stop = useCallback(() => {
    if (!isSupported) return

    speechSynthesis.cancel()
    setIsPlaying(false)
    setIsPaused(false)
    utteranceRef.current = null
  }, [isSupported])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        speechSynthesis.cancel()
      }
    }
  }, [])

  return {
    // 상태
    isSupported,
    isPlaying,
    isPaused,
    error,
    availableVoices,
    
    // 메서드
    speak,
    togglePause,
    stop,
    
    // 유틸리티
    getKoreanVoice,
  }
}