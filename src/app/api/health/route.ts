import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

interface HealthStatus {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  services: {
    database: 'up' | 'down'
    openai: 'configured' | 'not_configured'
    naver_tts: 'configured' | 'not_configured'
    supabase_storage: 'up' | 'down'
  }
  version: string
  environment: string
}

export async function GET() {
  const startTime = Date.now()
  
  try {
    const healthStatus: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'down',
        openai: 'not_configured',
        naver_tts: 'not_configured',
        supabase_storage: 'down',
      },
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
    }

    // Check Supabase connection
    try {
      const { error } = await supabaseServer
        .from('prayer_cache')
        .select('cache_key')
        .limit(1)
      
      if (!error) {
        healthStatus.services.database = 'up'
      }
    } catch (error) {
      console.warn('Database health check failed:', error)
    }

    // Check Supabase Storage
    try {
      const { data, error } = await supabaseServer.storage.listBuckets()
      if (!error && data) {
        healthStatus.services.supabase_storage = 'up'
      }
    } catch (error) {
      console.warn('Storage health check failed:', error)
    }

    // Check OpenAI configuration
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'placeholder-key') {
      healthStatus.services.openai = 'configured'
    }

    // Check Naver TTS configuration
    if (
      process.env.NAVER_CLIENT_ID && 
      process.env.NAVER_CLIENT_SECRET &&
      process.env.NAVER_CLIENT_ID !== 'placeholder' &&
      process.env.NAVER_CLIENT_SECRET !== 'placeholder'
    ) {
      healthStatus.services.naver_tts = 'configured'
    }

    // Determine overall health
    const criticalServicesUp = healthStatus.services.database === 'up'
    
    if (!criticalServicesUp) {
      healthStatus.status = 'unhealthy'
    }

    const responseTime = Date.now() - startTime

    return NextResponse.json({
      ...healthStatus,
      responseTime: `${responseTime}ms`,
    }, { 
      status: healthStatus.status === 'healthy' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('Health check error:', error)

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      responseTime: `${Date.now() - startTime}ms`,
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  }
}