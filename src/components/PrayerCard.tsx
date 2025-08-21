'use client'

import React, { forwardRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface PrayerCardProps {
  title: string
  content: string
  category?: string
  generatedAt: string
  className?: string
}

export const PrayerCard = forwardRef<HTMLDivElement, PrayerCardProps>(
  ({ title, content, category, generatedAt, className }, ref) => {
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    return (
      <div
        ref={ref}
        className={cn(
          'w-[400px] h-auto min-h-[500px] bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50 p-0 overflow-hidden',
          className
        )}
      >
        <Card className="border-0 shadow-none bg-transparent h-full">
          <CardContent className="p-8 space-y-6 h-full flex flex-col justify-between">
            {/* 헤더 */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-orange-500 to-rose-500 rounded-full mb-4 shadow-lg">
                <span className="text-white text-xl">🙏</span>
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent break-words">
                {title}
              </h2>
              {category && (
                <div className="inline-block bg-gradient-to-r from-orange-100 to-rose-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium border border-orange-200">
                  {category}
                </div>
              )}
            </div>

            {/* 기도문 내용 */}
            <div className="flex-1 flex items-center justify-center">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-md border border-orange-100/50">
                <p className="text-gray-700 leading-relaxed text-center whitespace-pre-wrap text-sm">
                  {content}
                </p>
              </div>
            </div>

            {/* 푸터 */}
            <div className="text-center space-y-3">
              <div className="w-full h-px bg-gradient-to-r from-transparent via-orange-300/50 to-transparent"></div>
              
              <div className="space-y-1">
                <p className="text-orange-700 text-sm font-medium">
                  {formatDate(generatedAt)}
                </p>
                <div className="flex items-center justify-center space-x-2 text-xs text-orange-600/80">
                  <span>기도동행</span>
                  <span>•</span>
                  <span>함께하는 기도</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
)

PrayerCard.displayName = 'PrayerCard'