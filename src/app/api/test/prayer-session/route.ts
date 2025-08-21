import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { action, title } = await request.json()

    if (action === 'start') {
      // 기도 세션 시작
      const sessionId = `test_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const { data, error } = await supabaseServer
        .from('prayer_sessions')
        .insert({
          user_id: null, // 테스트용으로 null
          session_id: sessionId,
          prayer_title: title,
          status: 'active'
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      // 활성 기도자 수 조회
      const { data: countData, error: countError } = await supabaseServer.rpc('get_active_prayers_count')
      
      return NextResponse.json({
        success: true,
        session: data,
        activePrayersCount: countError ? 0 : countData,
        message: 'Prayer session started'
      })
    }
    
    if (action === 'end') {
      // 최근 활성 세션 종료
      const { error } = await supabaseServer
        .from('prayer_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('status', 'active')
        .is('user_id', null) // 테스트 세션만

      const success = !error

      // 활성 기도자 수 조회
      const { data: countData, error: countError } = await supabaseServer.rpc('get_active_prayers_count')
      
      return NextResponse.json({
        success,
        activePrayersCount: countError ? 0 : countData,
        message: success ? 'Prayer session ended' : 'Failed to end session',
        error: error?.message
      })
    }

    if (action === 'count') {
      // 활성 기도자 수만 조회
      const { data: countData, error: countError } = await supabaseServer.rpc('get_active_prayers_count')
      
      return NextResponse.json({
        success: !countError,
        activePrayersCount: countError ? 0 : countData,
        error: countError?.message
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use "start", "end", or "count"'
    }, { status: 400 })

  } catch (error) {
    console.error('Prayer session test error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Prayer session test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}