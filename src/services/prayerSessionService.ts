'use client'

import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface PrayerSession {
  id: string
  sessionId: string
  prayerTitle?: string
  startedAt: string
  status: 'active' | 'ended'
}

export class PrayerSessionService {
  private static currentSession: PrayerSession | null = null
  private static heartbeatInterval: NodeJS.Timeout | null = null
  private static realtimeChannel: RealtimeChannel | null = null
  private static sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  private static reconnectAttempts = 0
  private static maxReconnectAttempts = 3
  private static reconnectDelay = 1000 // 1초
  private static enableRealtime = true // 실시간 기능 활성화 여부
  private static autoSessionStarted = false // 자동 세션 시작 여부

  // 자동 세션 시작 (페이지 접속 시 자동 호출)
  static async startAutoSession(): Promise<PrayerSession | null> {
    if (this.autoSessionStarted) {
      return this.currentSession
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // 기존 활성 세션 종료
      await this.endCurrentSession()

      const { data, error } = await supabase
        .from('prayer_sessions')
        .insert({
          user_id: user?.id || null,
          session_id: this.sessionId,
          prayer_title: '함께하는 기도시간',
          status: 'active'
        })
        .select()
        .single()

      if (error) {
        console.error('Error starting auto prayer session:', error)
        return null
      }

      this.currentSession = {
        id: data.id,
        sessionId: data.session_id,
        prayerTitle: data.prayer_title,
        startedAt: data.started_at,
        status: data.status
      }

      this.autoSessionStarted = true

      // 하트비트 시작 (30초마다)
      this.startHeartbeat()

      return this.currentSession
    } catch (error) {
      console.error('Error starting auto prayer session:', error)
      return null
    }
  }

  // 기도 세션 시작 (기존 메서드는 호환성을 위해 유지)
  static async startSession(prayerTitle?: string): Promise<PrayerSession | null> {
    return this.startAutoSession()
  }

  // 기도 세션 종료
  static async endSession(): Promise<boolean> {
    return await this.endCurrentSession()
  }

  // 현재 세션 종료 (내부 메서드)
  private static async endCurrentSession(): Promise<boolean> {
    if (!this.currentSession) {
      return true
    }

    try {
      // 하트비트 중지
      this.stopHeartbeat()

      const { error } = await supabase
        .from('prayer_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('id', this.currentSession.id)

      if (error) {
        console.error('Error ending prayer session:', error)
        return false
      }

      this.currentSession = null
      return true
    } catch (error) {
      console.error('Error ending prayer session:', error)
      return false
    }
  }

  // 하트비트 시작
  private static startHeartbeat() {
    this.stopHeartbeat() // 기존 하트비트 정리

    this.heartbeatInterval = setInterval(async () => {
      if (this.currentSession) {
        try {
          await supabase
            .from('prayer_sessions')
            .update({
              last_heartbeat: new Date().toISOString()
            })
            .eq('id', this.currentSession.id)
        } catch (error) {
          console.error('Error sending heartbeat:', error)
        }
      }
    }, 30000) // 30초마다
  }

  // 하트비트 중지
  private static stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  // 활성 기도자 수 조회
  static async getActivePrayersCount(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('get_active_prayers_count')

      if (error) {
        console.error('Error getting active prayers count:', error)
        return 0
      }

      return data || 0
    } catch (error) {
      console.error('Error getting active prayers count:', error)
      return 0
    }
  }

  // 실시간 채널 구독 (재연결 로직 포함)
  static subscribeToActivePrayersCount(
    callback: (count: number) => void
  ): (() => void) {
    // 기존 채널 정리
    this.unsubscribeFromActivePrayersCount()

    // 실시간 기능이 비활성화된 경우 폴링으로 대체
    if (!this.enableRealtime) {
      console.log('Realtime disabled, using polling mode')
      this.startPeriodicPolling(callback)
      return () => {
        this.stopPeriodicPolling()
      }
    }

    const setupChannel = () => {
      try {
        // 새 채널 생성 (고유한 채널명 사용)
        const channelName = `prayer_sessions_${Date.now()}`
        this.realtimeChannel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'prayer_sessions'
            },
            async () => {
              try {
                // 변경 발생 시 활성 사용자 수 업데이트
                const count = await this.getActivePrayersCount()
                callback(count)
                this.reconnectAttempts = 0 // 성공 시 재연결 시도 횟수 리셋
              } catch (error) {
                console.error('Error updating prayer count:', error)
                // 에러 시 즉시 재연결하지 않고 잠시 기다림
                setTimeout(() => {
                  this.handleReconnect(callback)
                }, 5000)
              }
            }
          )
          .subscribe((status) => {
            console.log('Realtime channel status:', status)
            
            if (status === 'SUBSCRIBED') {
              console.log('Successfully subscribed to prayer sessions updates')
              this.reconnectAttempts = 0
            } else if (status === 'CHANNEL_ERROR') {
              console.error('Channel error, will retry...')
              setTimeout(() => {
                this.handleReconnect(callback)
              }, 3000)
            } else if (status === 'TIMED_OUT') {
              console.warn('Channel subscription timed out, will retry...')
              setTimeout(() => {
                this.handleReconnect(callback)
              }, 5000)
            } else if (status === 'CLOSED') {
              console.log('Channel closed')
              // CLOSED 상태에서는 즉시 재연결하지 않음 (cleanup에 의한 정상 종료일 수 있음)
            }
          })
      } catch (error) {
        console.error('Error setting up channel:', error)
        this.handleReconnect(callback)
      }
    }

    setupChannel()

    // 초기 카운트 로드
    this.getActivePrayersCount().then(callback)

    // 구독 해제 함수 반환
    return () => this.unsubscribeFromActivePrayersCount()
  }

  // 재연결 처리
  private static handleReconnect(callback: (count: number) => void) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
      
      setTimeout(() => {
        this.unsubscribeFromActivePrayersCount()
        this.subscribeToActivePrayersCount(callback)
      }, this.reconnectDelay * this.reconnectAttempts) // 지연 시간을 점진적으로 증가
    } else {
      console.warn('Max reconnection attempts reached. Falling back to periodic polling.')
      // 폴백: 주기적 폴링으로 전환
      this.startPeriodicPolling(callback)
    }
  }

  // 주기적 폴링 폴백
  private static pollingInterval: NodeJS.Timeout | null = null
  
  private static startPeriodicPolling(callback: (count: number) => void) {
    this.stopPeriodicPolling()
    
    // 30초마다 활성 사용자 수 폴링
    this.pollingInterval = setInterval(async () => {
      try {
        const count = await this.getActivePrayersCount()
        callback(count)
      } catch (error) {
        console.error('Error during periodic polling:', error)
      }
    }, 30000) // 30초마다
    
    console.log('Switched to periodic polling mode (30s interval)')
  }
  
  private static stopPeriodicPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }
  }

  // 실시간 채널 구독 해제
  static unsubscribeFromActivePrayersCount() {
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel)
      this.realtimeChannel = null
    }
  }

  // 현재 세션 정보 가져오기
  static getCurrentSession(): PrayerSession | null {
    return this.currentSession
  }

  // 실시간 기능 제어
  static setRealtimeEnabled(enabled: boolean) {
    this.enableRealtime = enabled
    if (!enabled) {
      console.log('Realtime functionality disabled')
      this.unsubscribeFromActivePrayersCount()
    }
  }

  static isRealtimeEnabled(): boolean {
    return this.enableRealtime
  }

  // 페이지 종료 시 정리
  static cleanup() {
    this.endCurrentSession()
    this.unsubscribeFromActivePrayersCount()
    this.stopPeriodicPolling()
  }
}

// 페이지 언로드 시 세션 정리
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    PrayerSessionService.cleanup()
  })

  // 페이지 숨김/보임 처리 (모바일 대응)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // 페이지가 숨겨질 때 세션 종료
      PrayerSessionService.endSession()
    }
  })
}

export default PrayerSessionService