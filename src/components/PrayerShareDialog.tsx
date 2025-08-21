'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { PrayerCard } from './PrayerCard'
import { usePrayerShare, type ShareOptions } from '@/hooks/usePrayerShare'
import { 
  Share2, 
  Download, 
  MessageCircle, 
  Copy, 
  Loader2, 
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PrayerShareDialogProps {
  shareOptions: ShareOptions
  children: React.ReactNode
}

export function PrayerShareDialog({ shareOptions, children }: PrayerShareDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })

  const {
    cardRef,
    isGenerating,
    error,
    downloadImage,
    shareNative,
    copyLink,
    canShare,
    canCopy
  } = usePrayerShare()

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setActionFeedback({ type, message })
    setTimeout(() => {
      setActionFeedback({ type: null, message: '' })
    }, 3000)
  }

  const handleDownload = async () => {
    const success = await downloadImage(shareOptions)
    if (success) {
      showFeedback('success', '이미지가 다운로드되었습니다! 📱')
    }
  }

  const handleNativeShare = async () => {
    const success = await shareNative(shareOptions)
    if (success) {
      showFeedback('success', '공유되었습니다! 🙌')
    }
  }

  const handleCopyLink = async () => {
    const success = await copyLink(shareOptions)
    if (success) {
      showFeedback('success', '링크가 복사되었습니다! 📋')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm border-orange-200">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-gray-800">
            <div className="w-6 h-6 bg-gradient-to-r from-orange-400 to-rose-400 rounded-full flex items-center justify-center">
              <Share2 className="h-3 w-3 text-white" />
            </div>
            <span className="bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
              기도문 공유하기
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 md:space-y-6">
          {/* 숨겨진 원본 크기 카드 (이미지 생성용) */}
          <div className="fixed -top-[9999px] -left-[9999px] pointer-events-none z-[-1]">
            <PrayerCard
              ref={cardRef}
              title={shareOptions.title}
              content={shareOptions.content}
              category={shareOptions.category}
              generatedAt={shareOptions.generatedAt}
            />
          </div>

          {/* 이미지 카드 미리보기 (표시용) */}
          <div className="flex justify-center">
            <div className="scale-75 origin-top relative">
              <PrayerCard
                title={shareOptions.title}
                content={shareOptions.content}
                category={shareOptions.category}
                generatedAt={shareOptions.generatedAt}
              />
            </div>
          </div>

          {/* 액션 피드백 */}
          {actionFeedback.type && (
            <Card className={cn(
              'border-0 shadow-md',
              actionFeedback.type === 'success' 
                ? 'bg-green-50/80 border border-green-200' 
                : 'bg-red-50/80 border border-red-200'
            )}>
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  {actionFeedback.type === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className={cn(
                    'text-sm font-medium',
                    actionFeedback.type === 'success' 
                      ? 'text-green-700' 
                      : 'text-red-700'
                  )}>
                    {actionFeedback.message}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 에러 메시지 */}
          {error && (
            <Card className="bg-red-50/80 border border-red-200 shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 공유 버튼들 */}
          <div className="grid grid-cols-1 gap-3">
            {/* 다운로드 */}
            <Button
              onClick={handleDownload}
              disabled={isGenerating}
              variant="outline"
              className="w-full justify-start space-x-3 h-12 border-orange-200 hover:bg-orange-50 hover:border-orange-300 transition-all duration-200"
            >
              {isGenerating ? (
                <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
              ) : (
                <Download className="h-5 w-5 text-orange-600" />
              )}
              <div className="text-left">
                <div className="font-medium text-gray-800">이미지 저장</div>
                <div className="text-xs text-gray-600">갤러리에 저장하기</div>
              </div>
            </Button>

            {/* 네이티브 공유 (모바일) */}
            {canShare && (
              <Button
                onClick={handleNativeShare}
                disabled={isGenerating}
                variant="outline"
                className="w-full justify-start space-x-3 h-12 border-rose-200 hover:bg-rose-50 hover:border-rose-300 transition-all duration-200"
              >
                {isGenerating ? (
                  <Loader2 className="h-5 w-5 animate-spin text-rose-500" />
                ) : (
                  <Share2 className="h-5 w-5 text-rose-600" />
                )}
                <div className="text-left">
                  <div className="font-medium text-gray-800">앱으로 공유</div>
                  <div className="text-xs text-gray-600">카카오톡, 메시지 등</div>
                </div>
              </Button>
            )}

            {/* 링크 복사 */}
            {canCopy && (
              <Button
                onClick={handleCopyLink}
                disabled={isGenerating}
                variant="outline"
                className="w-full justify-start space-x-3 h-12 border-amber-200 hover:bg-amber-50 hover:border-amber-300 transition-all duration-200"
              >
                {isGenerating ? (
                  <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                ) : (
                  <Copy className="h-5 w-5 text-amber-600" />
                )}
                <div className="text-left">
                  <div className="font-medium text-gray-800">링크 복사</div>
                  <div className="text-xs text-gray-600">텍스트로 공유하기</div>
                </div>
              </Button>
            )}
          </div>

          {/* 안내 메시지 */}
          <Card className="bg-gradient-to-r from-orange-50/80 to-rose-50/80 border border-orange-200/50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-orange-200 to-rose-200 rounded-full flex items-center justify-center">
                  <span className="text-orange-700 text-sm">💡</span>
                </div>
                <div className="text-sm text-orange-800">
                  <p className="font-medium mb-1">공유 팁</p>
                  <p className="leading-relaxed">생성된 기도문 이미지를 SNS나 메신저로 공유해서 더 많은 사람들과 함께 기도하세요!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}