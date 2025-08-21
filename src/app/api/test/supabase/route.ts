import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function GET() {
  try {
    console.log('Testing Supabase connection...')
    
    const tests = []
    
    // 1. 기본 연결 테스트
    try {
      const { data, error } = await supabaseServer
        .from('prayer_cache')
        .select('*')
        .limit(1)
      
      tests.push({
        test: 'prayer_cache table access',
        success: !error,
        result: error ? error.message : `Table exists, ${data?.length || 0} records`,
        data: data
      })
    } catch (err) {
      tests.push({
        test: 'prayer_cache table access',
        success: false,
        result: (err as Error).message
      })
    }

    // 2. TTS 캐시 테이블 테스트
    try {
      const { data, error } = await supabaseServer
        .from('tts_cache')
        .select('*')
        .limit(1)
      
      tests.push({
        test: 'tts_cache table access',
        success: !error,
        result: error ? error.message : `Table exists, ${data?.length || 0} records`,
        data: data
      })
    } catch (err) {
      tests.push({
        test: 'tts_cache table access',
        success: false,
        result: (err as Error).message
      })
    }

    // 3. 기도 세션 테이블 테스트
    try {
      const { data, error } = await supabaseServer
        .from('prayer_sessions')
        .select('*')
        .limit(1)
      
      tests.push({
        test: 'prayer_sessions table access',
        success: !error,
        result: error ? error.message : `Table exists, ${data?.length || 0} records`,
        data: data
      })
    } catch (err) {
      tests.push({
        test: 'prayer_sessions table access',
        success: false,
        result: (err as Error).message
      })
    }

    // 4. 함수 테스트 (활성 기도자 수)
    try {
      const { data, error } = await supabaseServer.rpc('get_active_prayers_count')
      
      tests.push({
        test: 'get_active_prayers_count function',
        success: !error,
        result: error ? error.message : `Active prayers count: ${data}`,
        data: data
      })
    } catch (err) {
      tests.push({
        test: 'get_active_prayers_count function',
        success: false,
        result: (err as Error).message
      })
    }

    // 5. Storage 버킷 테스트
    try {
      const { data, error } = await supabaseServer.storage
        .from('tts-audio')
        .list()
      
      tests.push({
        test: 'tts-audio storage bucket',
        success: !error,
        result: error ? error.message : `Bucket accessible, ${data?.length || 0} files`,
        data: data
      })
    } catch (err) {
      tests.push({
        test: 'tts-audio storage bucket',
        success: false,
        result: (err as Error).message
      })
    }

    // 결과 집계
    const successCount = tests.filter(t => t.success).length
    const totalTests = tests.length
    const allSuccess = successCount === totalTests

    return NextResponse.json({
      success: allSuccess,
      summary: `${successCount}/${totalTests} tests passed`,
      timestamp: new Date().toISOString(),
      tests
    })

  } catch (error) {
    console.error('Supabase test error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to test Supabase connection',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}