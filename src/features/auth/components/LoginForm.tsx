'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { authService, SignInData } from '@/services/authService'
import { useToast } from '@/hooks/use-toast'

const loginSchema = z.object({
  email: z.string().email('올바른 이메일 주소를 입력해주세요'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
})

interface LoginFormProps {
  onSuccess?: () => void
  onSwitchToSignUp?: () => void
}

export function LoginForm({ onSuccess, onSwitchToSignUp }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInData>({
    resolver: zodResolver(loginSchema) as any,
  })

  const onSubmit = async (data: SignInData) => {
    setIsLoading(true)
    
    try {
      const result = await authService.signIn(data)
      
      if (result.success) {
        toast({
          title: '로그인 성공',
          description: '환영합니다!',
        })
        onSuccess?.()
      } else {
        toast({
          title: '로그인 실패',
          description: result.error || '로그인에 실패했습니다.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: '오류 발생',
        description: '로그인 처리 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto border-0 shadow-xl bg-white/90 backdrop-blur-sm">
      <CardHeader className="text-center pb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-rose-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <span className="text-white text-xl">🙏</span>
        </div>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
          로그인
        </CardTitle>
        <p className="text-gray-600 text-sm mt-2">함께 기도하는 시간을 시작해보세요</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700 font-medium">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="이메일을 입력하세요"
              {...register('email')}
              disabled={isLoading}
              className="border-orange-200 focus:border-orange-400 focus:ring-orange-200 bg-white/70"
            />
            {errors.email && (
              <p className="text-sm text-red-600 flex items-center space-x-1">
                <span>⚠️</span>
                <span>{errors.email.message}</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700 font-medium">비밀번호</Label>
            <Input
              id="password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              {...register('password')}
              disabled={isLoading}
              className="border-orange-200 focus:border-orange-400 focus:ring-orange-200 bg-white/70"
            />
            {errors.password && (
              <p className="text-sm text-red-600 flex items-center space-x-1">
                <span>⚠️</span>
                <span>{errors.password.message}</span>
              </p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300 py-6 text-base font-semibold" 
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>로그인 중...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>✨</span>
                <span>로그인</span>
              </div>
            )}
          </Button>

          {onSwitchToSignUp && (
            <div className="text-center pt-4">
              <p className="text-sm text-gray-600">
                계정이 없으신가요?{' '}
                <button
                  type="button"
                  onClick={onSwitchToSignUp}
                  className="text-orange-600 hover:text-orange-700 hover:underline font-medium transition-colors duration-200"
                >
                  회원가입
                </button>
              </p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}