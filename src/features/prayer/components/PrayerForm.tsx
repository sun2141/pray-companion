'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Share2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PRAYER_CATEGORIES } from '@/constants'
import { usePrayerGeneration } from '../hooks/usePrayerGeneration'
import { PrayerCompanion } from '@/components/PrayerCompanion'
import { PrayerShareDialog } from '@/components/PrayerShareDialog'
import { PrayerFeedback } from '@/components/PrayerFeedback'
import type { PrayerGenerationRequest } from '@/types/prayer'

const prayerFormSchema = z.object({
  title: z.string().min(1, '기도 제목을 입력해주세요').max(100, '제목이 너무 깁니다'),
  category: z.string().optional(),
  situation: z.string().max(500, '상황 설명이 너무 깁니다').optional(),
  tone: z.enum(['formal', 'casual', 'warm']).optional(),
  length: z.enum(['short', 'long']).optional(),
})

interface PrayerFormProps {
  onPrayerGenerated?: (prayer: { title: string; content: string }) => void
}

export function PrayerForm({ onPrayerGenerated }: PrayerFormProps = {}) {
  const { generatePrayer, isGenerating, error, lastPrayer, isSuccess } = usePrayerGeneration()
  const [showFeedback, setShowFeedback] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PrayerGenerationRequest>({
    resolver: zodResolver(prayerFormSchema) as any,
    defaultValues: {
      tone: 'warm',
      length: 'short',
    },
  })

  const onSubmit = (data: PrayerGenerationRequest) => {
    generatePrayer(data)
  }

  // 기도문이 생성되었을 때 콜백 호출
  useEffect(() => {
    if (isSuccess && lastPrayer && onPrayerGenerated) {
      onPrayerGenerated({
        title: lastPrayer.title,
        content: lastPrayer.content
      })
    }
  }, [isSuccess, lastPrayer, onPrayerGenerated])

  return (
    <div className="space-y-4 md:space-y-6">
      {/* 실시간 기도 동행 표시 */}
      <PrayerCompanion />
      
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-gray-800 flex items-center space-x-2 text-lg md:text-xl">
            <div className="w-6 h-6 bg-gradient-to-r from-orange-400 to-rose-400 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✨</span>
            </div>
            <span>AI 기도문 생성</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-gray-700 font-medium">기도 제목 *</Label>
              <Input
                id="title"
                placeholder="예: 오늘 하루를 위한 기도"
                {...register('title')}
                disabled={isGenerating}
                className="border-orange-200 focus:border-orange-400 focus:ring-orange-200 bg-white/70 text-gray-800 placeholder:text-gray-500"
              />
              {errors.title && (
                <p className="text-sm text-red-500 flex items-center space-x-1">
                  <span>⚠️</span>
                  <span>{errors.title.message}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-gray-700 font-medium">카테고리</Label>
              <Select
                onValueChange={(value) => setValue('category', value)}
                disabled={isGenerating}
              >
                <SelectTrigger className="border-orange-200 focus:border-orange-400 focus:ring-orange-200 bg-white/70">
                  <SelectValue placeholder="카테고리 선택 (선택사항)" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-sm border-orange-200">
                  {PRAYER_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category} className="hover:bg-orange-50">
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="situation" className="text-gray-700 font-medium">상황 설명</Label>
              <Textarea
                id="situation"
                placeholder="구체적인 상황이나 마음을 나눠주세요 (선택사항)"
                rows={3}
                {...register('situation')}
                disabled={isGenerating}
                className="border-orange-200 focus:border-orange-400 focus:ring-orange-200 bg-white/70 text-gray-800 placeholder:text-gray-500 resize-none"
              />
              {errors.situation && (
                <p className="text-sm text-red-500 flex items-center space-x-1">
                  <span>⚠️</span>
                  <span>{errors.situation.message}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">어조</Label>
                <Select
                  onValueChange={(value: 'formal' | 'casual' | 'warm') => setValue('tone', value)}
                  defaultValue="warm"
                  disabled={isGenerating}
                >
                  <SelectTrigger className="border-orange-200 focus:border-orange-400 focus:ring-orange-200 bg-white/70">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-sm border-orange-200">
                    <SelectItem value="warm" className="hover:bg-orange-50">🤗 따뜻하고 위로되는</SelectItem>
                    <SelectItem value="formal" className="hover:bg-orange-50">⛪ 격식있고 경건한</SelectItem>
                    <SelectItem value="casual" className="hover:bg-orange-50">😊 친근하고 편안한</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">길이</Label>
                <Select
                  onValueChange={(value: 'short' | 'long') => setValue('length', value)}
                  defaultValue="short"
                  disabled={isGenerating}
                >
                  <SelectTrigger className="border-orange-200 focus:border-orange-400 focus:ring-orange-200 bg-white/70">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-sm border-orange-200">
                    <SelectItem value="short" className="hover:bg-orange-50">📝 짧게 (6-7문장)</SelectItem>
                    <SelectItem value="long" className="hover:bg-orange-50">📜 길게 (15-20문장)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300 py-6 text-base font-semibold" 
              disabled={isGenerating}
            >
              {isGenerating ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>기도문 생성 중...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>✨</span>
                  <span>기도문 생성하기</span>
                </div>
              )}
            </Button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50/80 border border-red-200 rounded-lg backdrop-blur-sm">
              <p className="text-red-600 text-sm flex items-center space-x-2">
                <span>🚨</span>
                <span>{error instanceof Error ? error.message : '기도문 생성 중 오류가 발생했습니다.'}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {isSuccess && lastPrayer && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white/90 to-orange-50/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-lg md:text-xl">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-orange-400 to-rose-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">🙏</span>
                </div>
                <span className="text-gray-800">생성된 기도문</span>
              </div>
              {lastPrayer.cached && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full border border-orange-200">
                  캐시됨
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-lg md:text-xl text-gray-800 mb-3">{lastPrayer.title}</h3>
                <div className="bg-white/80 p-4 md:p-6 rounded-xl border border-orange-100 shadow-sm">
                  <p className="whitespace-pre-wrap leading-relaxed text-gray-700 text-sm md:text-base">
                    {lastPrayer.content}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-xs md:text-sm text-gray-500 space-y-1">
                  <div>
                    ⏰ {new Date(lastPrayer.generatedAt).toLocaleString('ko-KR')}
                  </div>
                  {lastPrayer.category && (
                    <div>📋 카테고리: {lastPrayer.category}</div>
                  )}
                </div>
                
                <PrayerShareDialog
                  shareOptions={{
                    title: lastPrayer.title,
                    content: lastPrayer.content,
                    category: lastPrayer.category,
                    generatedAt: lastPrayer.generatedAt
                  }}
                >
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-orange-200 text-orange-700 hover:bg-orange-50 flex items-center space-x-2 shadow-sm"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>공유하기</span>
                  </Button>
                </PrayerShareDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 피드백 섹션 */}
      {isSuccess && lastPrayer && (
        <>
          {!showFeedback ? (
            <div className="text-center">
              <Button
                onClick={() => setShowFeedback(true)}
                variant="outline"
                className="border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                <span>💝</span>
                <span className="ml-2">기도문이 어떠셨나요? (피드백)</span>
              </Button>
            </div>
          ) : (
            <PrayerFeedback
              prayerId={lastPrayer.id || 'unknown'}
              onFeedbackSubmitted={() => setShowFeedback(false)}
            />
          )}
        </>
      )}
    </div>
  )
}