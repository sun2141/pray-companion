'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Star, Send, Heart, BookOpen, Users } from 'lucide-react'
import { toast } from 'sonner'

interface PrayerFeedbackProps {
  prayerId: string
  onFeedbackSubmitted?: () => void
}

const IMPROVEMENT_OPTIONS = [
  { id: 'too_formal', label: '너무 격식적임', icon: '📝' },
  { id: 'too_casual', label: '너무 편안함', icon: '😊' },
  { id: 'repetitive', label: '반복적인 표현', icon: '🔄' },
  { id: 'not_personal', label: '개인적이지 않음', icon: '👤' },
  { id: 'too_abstract', label: '추상적임', icon: '☁️' },
  { id: 'not_natural', label: '자연스럽지 않음', icon: '🤖' },
  { id: 'too_long', label: '너무 길어요', icon: '📏' },
  { id: 'too_short', label: '너무 짧아요', icon: '⏰' },
  { id: 'off_topic', label: '주제에서 벗어남', icon: '🎯' },
  { id: 'not_comforting', label: '위로가 되지 않음', icon: '💔' },
]

export function PrayerFeedback({ prayerId, onFeedbackSubmitted }: PrayerFeedbackProps) {
  const [rating, setRating] = useState<number>(0)
  const [feedback, setFeedback] = useState('')
  const [selectedImprovements, setSelectedImprovements] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleRatingClick = (value: number) => {
    setRating(value)
  }

  const handleImprovementToggle = (improvementId: string) => {
    setSelectedImprovements(prev => 
      prev.includes(improvementId)
        ? prev.filter(id => id !== improvementId)
        : [...prev, improvementId]
    )
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('별점을 선택해주세요.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/prayer/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prayerId,
          rating,
          feedback,
          improvements: selectedImprovements.map(id => 
            IMPROVEMENT_OPTIONS.find(opt => opt.id === id)?.label || id
          ),
        }),
      })

      if (!response.ok) {
        throw new Error('피드백 전송에 실패했습니다.')
      }

      setSubmitted(true)
      toast.success('소중한 피드백 감사합니다! 더 나은 기도문 생성을 위해 활용하겠습니다.')
      onFeedbackSubmitted?.()
    } catch (error) {
      console.error('Feedback submission error:', error)
      toast.error('피드백 전송 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50/80 to-emerald-50/80 backdrop-blur-sm">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-semibold text-green-800 mb-2">피드백 완료</h3>
          <p className="text-sm text-green-600">
            소중한 의견을 주셔서 감사합니다. 더 나은 기도문 생성을 위해 활용하겠습니다.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-gray-800 flex items-center space-x-2 text-lg md:text-xl">
          <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full flex items-center justify-center">
            <BookOpen className="w-3 h-3 text-white" />
          </div>
          <span>기도문 피드백</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
            AI 학습
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 md:space-y-5">
        {/* 안내 메시지 */}
        <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200/50">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">함께 만들어가는 기도문</span>
          </div>
          <p className="text-xs text-blue-600">
            여러분의 피드백으로 AI가 더 자연스럽고 감동적인 기도문을 만들어갑니다. 솔직한 의견을 부탁드립니다.
          </p>
        </div>

        {/* 별점 평가 */}
        <div className="space-y-3">
          <label className="text-sm md:text-base font-medium text-gray-700">
            이 기도문이 마음에 와닿았나요?
          </label>
          <div className="flex items-center justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handleRatingClick(value)}
                className="transition-all duration-200 hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    value <= rating
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300 hover:text-yellow-200'
                  }`}
                />
              </button>
            ))}
          </div>
          <div className="text-center text-xs text-gray-500">
            {rating === 0 && '별점을 선택해주세요'}
            {rating === 1 && '많이 아쉬워요 😢'}
            {rating === 2 && '조금 아쉬워요 😕'}
            {rating === 3 && '괜찮아요 😐'}
            {rating === 4 && '좋아요! 😊'}
            {rating === 5 && '정말 감동적이에요! 🥰'}
          </div>
        </div>

        {/* 개선 사항 선택 (별점이 4점 미만일 때) */}
        {rating > 0 && rating < 4 && (
          <div className="space-y-3">
            <label className="text-sm md:text-base font-medium text-gray-700">
              어떤 부분이 아쉬웠나요? (여러 개 선택 가능)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {IMPROVEMENT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleImprovementToggle(option.id)}
                  className={`p-2 text-xs rounded-lg border transition-all duration-200 text-left ${
                    selectedImprovements.includes(option.id)
                      ? 'bg-orange-100 border-orange-300 text-orange-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span>{option.icon}</span>
                    <span>{option.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 자유 의견 */}
        <div className="space-y-2">
          <label htmlFor="feedback" className="text-sm md:text-base font-medium text-gray-700">
            추가 의견이나 제안사항 (선택사항)
          </label>
          <Textarea
            id="feedback"
            placeholder="어떤 표현이 좋았는지, 어떻게 개선했으면 좋겠는지 자유롭게 말씀해주세요..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="border-blue-200 focus:border-blue-400 focus:ring-blue-200 bg-white/70 text-gray-800 placeholder:text-gray-500 resize-none"
            rows={3}
          />
        </div>

        {/* 제출 버튼 */}
        <Button
          onClick={handleSubmit}
          disabled={rating === 0 || isSubmitting}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300"
        >
          {isSubmitting ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>전송 중...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Send className="w-4 h-4" />
              <span>피드백 보내기</span>
            </div>
          )}
        </Button>

        {/* 개인정보 안내 */}
        <div className="text-xs text-gray-500 text-center p-2 bg-gray-50/50 rounded border border-gray-200/50">
          📝 피드백은 익명으로 처리되며, AI 학습 개선 목적으로만 사용됩니다.
        </div>
      </CardContent>
    </Card>
  )
}