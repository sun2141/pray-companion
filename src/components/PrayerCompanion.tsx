'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Loader2, Heart } from 'lucide-react'
import { usePrayerSession } from '@/hooks/usePrayerSession'
import { cn } from '@/lib/utils'

interface PrayerCompanionProps {
  className?: string
}

export function PrayerCompanion({ className }: PrayerCompanionProps) {
  const {
    currentSession,
    isActive,
    activePrayersCount,
    isCountLoading,
    error
  } = usePrayerSession()

  return (
    <Card className={cn(
      'shadow-lg bg-gradient-to-br from-orange-50/90 to-rose-50/80 backdrop-blur-sm transition-all duration-300 border border-orange-200/50',
      className
    )}>
      <CardContent className="p-4 md:p-6">
        <div className="space-y-4">
          {/* 헤더 아이콘과 타이틀 */}
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-rose-400 rounded-full flex items-center justify-center shadow-md">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
              실시간 동행
            </h3>
          </div>

          {/* 동행자 수 표시 */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-rose-400 rounded-full flex items-center justify-center shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              
              {isCountLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-orange-400" />
              ) : (
                <span className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
                  {activePrayersCount}
                </span>
              )}
            </div>
            
            <p className="text-base md:text-lg text-orange-700 font-medium">
              지금 이 순간 함께하고 있습니다
            </p>
          </div>

          {/* 현재 세션 상태 */}
          {isActive && currentSession && (
            <div className="text-center">
              <Badge className="bg-gradient-to-r from-orange-100 to-rose-100 text-orange-800 border-orange-200 px-3 py-1">
                🙏 {currentSession.prayerTitle}
              </Badge>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="text-center text-sm text-red-600 bg-red-50/80 p-3 rounded-lg border border-red-200 backdrop-blur-sm">
              <div className="flex items-center justify-center space-x-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* 동행 메시지 */}
          <div className="text-center text-sm md:text-base leading-relaxed">
            <p className="text-orange-700 font-medium">
              혼자가 아닙니다. 지금 이 순간 함께 하나님께 나아가고 있습니다. 🙏
            </p>
            <p className="text-orange-600/80 text-sm mt-2">
              페이지에 접속하는 것만으로도 동행이 시작됩니다
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}