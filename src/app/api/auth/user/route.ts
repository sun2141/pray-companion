import { NextResponse } from 'next/server'
import { authService } from '@/services/authService'

export async function GET() {
  try {
    const user = await authService.getCurrentUser()
    
    return NextResponse.json({
      success: true,
      user: user || null
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}