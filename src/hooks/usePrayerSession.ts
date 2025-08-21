'use client'

import { useState, useEffect, useCallback } from 'react'
import { PrayerSessionService, type PrayerSession } from '@/services/prayerSessionService'

export interface UsePrayerSessionReturn {
  // 세션 상태
  currentSession: PrayerSession | null
  isActive: boolean
  
  // 실시간 카운트
  activePrayersCount: number
  isCountLoading: boolean
  
  // 세션 제어 함수
  startSession: (prayerTitle?: string) => Promise<boolean>
  endSession: () => Promise<boolean>
  
  // 에러 상태
  error: string | null
}

export const usePrayerSession = (): UsePrayerSessionReturn => {
  const [currentSession, setCurrentSession] = useState<PrayerSession | null>(null)
  const [activePrayersCount, setActivePrayersCount] = useState<number>(0)
  const [isCountLoading, setIsCountLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // 기도 세션 시작
  const startSession = useCallback(async (prayerTitle?: string): Promise<boolean> => {
    try {
      setError(null)
      const session = await PrayerSessionService.startSession(prayerTitle)
      
      if (session) {
        setCurrentSession(session)
        return true
      } else {
        setError('기도 세션을 시작할 수 없습니다.')
        return false
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '기도 세션 시작 중 오류가 발생했습니다.'
      setError(errorMessage)
      return false
    }
  }, [])

  // 기도 세션 종료
  const endSession = useCallback(async (): Promise<boolean> => {
    try {
      setError(null)
      const success = await PrayerSessionService.endSession()
      
      if (success) {
        setCurrentSession(null)
        return true
      } else {
        setError('기도 세션을 종료할 수 없습니다.')
        return false
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '기도 세션 종료 중 오류가 발생했습니다.'
      setError(errorMessage)
      return false
    }
  }, [])

  // 실시간 카운트 구독 및 자동 세션 시작
  useEffect(() => {
    setIsCountLoading(true)
    
    const unsubscribe = PrayerSessionService.subscribeToActivePrayersCount((count) => {
      setActivePrayersCount(count)
      setIsCountLoading(false)
      setError(null) // 성공 시 에러 초기화
    })

    // 자동으로 세션 시작 (페이지 접속 시)
    const initializeSession = async () => {
      try {
        const session = await PrayerSessionService.startAutoSession()
        setCurrentSession(session)
      } catch (err) {
        console.error('Error starting auto session:', err)
        // 자동 세션 시작 실패해도 카운트는 보여주기
      }
    }

    initializeSession()

    // 초기 카운트 로드 시 에러 처리
    PrayerSessionService.getActivePrayersCount()
      .then((count) => {
        setActivePrayersCount(count)
        setIsCountLoading(false)
      })
      .catch((err) => {
        console.error('Error loading initial prayer count:', err)
        setError('실시간 동행자 수를 불러올 수 없습니다.')
        setIsCountLoading(false)
      })

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      unsubscribe()
    }
  }, [])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      PrayerSessionService.cleanup()
    }
  }, [])

  return {
    // 세션 상태
    currentSession,
    isActive: currentSession !== null && currentSession.status === 'active',
    
    // 실시간 카운트
    activePrayersCount,
    isCountLoading,
    
    // 세션 제어 함수
    startSession,
    endSession,
    
    // 에러 상태
    error
  }
}