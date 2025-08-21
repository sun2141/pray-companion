import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function GET() {
  try {
    // 직접적인 세션 조회
    const { data: sessions, error: sessionsError } = await supabaseServer
      .from('prayer_sessions')
      .select('*')
      .eq('status', 'active')

    // 세션 수 카운트 (null user_id 포함)
    const { data: countData, error: countError } = await supabaseServer
      .from('prayer_sessions')
      .select('id', { count: 'exact' })
      .eq('status', 'active')

    return NextResponse.json({
      success: true,
      activeSessions: sessions || [],
      activeSessionsCount: sessions?.length || 0,
      exactCount: countData?.length || 0,
      countError: countError?.message,
      sessionsError: sessionsError?.message
    })

  } catch (error) {
    console.error('Direct prayer sessions query error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to query prayer sessions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}