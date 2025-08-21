'use client'

import { useState, useRef, useCallback } from 'react'
import html2canvas from 'html2canvas'

export interface ShareOptions {
  title: string
  content: string
  category?: string
  generatedAt: string
}

export const usePrayerShare = () => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  // 이미지 생성
  const generateImage = useCallback(async (): Promise<string | null> => {
    if (!cardRef.current) {
      setError('카드 요소를 찾을 수 없습니다.')
      return null
    }

    const element = cardRef.current

    // 요소의 크기 확인
    const rect = element.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) {
      setError('카드가 아직 렌더링되지 않았습니다. 잠시 후 다시 시도해주세요.')
      return null
    }

    setIsGenerating(true)
    setError(null)

    try {
      // 렌더링이 완료될 때까지 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 100))

      // 다시 크기 확인
      const finalRect = element.getBoundingClientRect()
      if (finalRect.width === 0 || finalRect.height === 0) {
        throw new Error('Element has zero dimensions')
      }

      const canvas = await html2canvas(element, {
        backgroundColor: null,
        scale: 2, // 고해상도
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: Math.max(400, finalRect.width),
        height: Math.max(500, finalRect.height),
        // 추가 옵션으로 안정성 개선
        foreignObjectRendering: true,
        removeContainer: true
      })

      // 캔버스 크기 확인
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Generated canvas has zero dimensions')
      }

      const dataUrl = canvas.toDataURL('image/png', 0.9)
      return dataUrl
    } catch (err) {
      console.error('Error generating image:', err)
      
      // 더 구체적인 에러 메시지 제공
      if (err instanceof Error) {
        if (err.message.includes('zero dimensions')) {
          setError('카드 크기를 확인할 수 없습니다. 페이지를 새로고침 후 다시 시도해주세요.')
        } else if (err.message.includes('createPattern')) {
          setError('이미지 처리 중 오류가 발생했습니다. 다시 시도해주세요.')
        } else {
          setError('이미지 생성 중 오류가 발생했습니다.')
        }
      } else {
        setError('이미지 생성 중 오류가 발생했습니다.')
      }
      
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [])

  // 이미지 다운로드
  const downloadImage = useCallback(async (options: ShareOptions): Promise<boolean> => {
    const imageDataUrl = await generateImage()
    
    if (!imageDataUrl) {
      return false
    }

    try {
      // Data URL을 Blob으로 변환
      const response = await fetch(imageDataUrl)
      const blob = await response.blob()

      // 다운로드 링크 생성
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `기도문_${options.title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_${new Date().toISOString().split('T')[0]}.png`
      
      // 다운로드 실행
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // URL 정리
      window.URL.revokeObjectURL(url)
      
      return true
    } catch (err) {
      console.error('Error downloading image:', err)
      setError('이미지 다운로드 중 오류가 발생했습니다.')
      return false
    }
  }, [generateImage])

  // Web Share API를 사용한 네이티브 공유
  const shareNative = useCallback(async (options: ShareOptions): Promise<boolean> => {
    if (!navigator.share) {
      setError('이 브라우저는 공유 기능을 지원하지 않습니다.')
      return false
    }

    const imageDataUrl = await generateImage()
    
    if (!imageDataUrl) {
      return false
    }

    try {
      // Data URL을 Blob으로 변환
      const response = await fetch(imageDataUrl)
      const blob = await response.blob()
      
      // File 객체 생성
      const file = new File([blob], `기도문_${options.title}.png`, { type: 'image/png' })

      await navigator.share({
        title: `기도문: ${options.title}`,
        text: `함께 기도해요! 🙏\n\n${options.title}`,
        files: [file]
      })

      return true
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Error sharing:', err)
        setError('공유 중 오류가 발생했습니다.')
      }
      return false
    }
  }, [generateImage])

  // 카카오톡 공유
  const shareKakao = useCallback(async (options: ShareOptions): Promise<boolean> => {
    if (typeof window === 'undefined' || !window.Kakao) {
      setError('카카오톡 공유 기능을 초기화할 수 없습니다.')
      return false
    }

    const imageDataUrl = await generateImage()
    
    if (!imageDataUrl) {
      return false
    }

    try {
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: `기도문: ${options.title}`,
          description: '함께 기도해요! 🙏',
          imageUrl: imageDataUrl,
          link: {
            mobileWebUrl: window.location.origin,
            webUrl: window.location.origin
          }
        },
        buttons: [
          {
            title: '기도동행 앱 보기',
            link: {
              mobileWebUrl: window.location.origin,
              webUrl: window.location.origin
            }
          }
        ]
      })

      return true
    } catch (err) {
      console.error('Error sharing to Kakao:', err)
      setError('카카오톡 공유 중 오류가 발생했습니다.')
      return false
    }
  }, [generateImage])

  // URL 복사
  const copyLink = useCallback(async (options: ShareOptions): Promise<boolean> => {
    try {
      const shareText = `함께 기도해요! 🙏\n\n${options.title}\n\n기도동행: ${window.location.origin}`
      
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText)
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = shareText
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }

      return true
    } catch (err) {
      console.error('Error copying link:', err)
      setError('링크 복사 중 오류가 발생했습니다.')
      return false
    }
  }, [])

  return {
    cardRef,
    isGenerating,
    error,
    generateImage,
    downloadImage,
    shareNative,
    shareKakao,
    copyLink,
    // 지원 여부 체크
    canShare: typeof navigator !== 'undefined' && !!navigator.share,
    canCopy: typeof navigator !== 'undefined' && !!navigator.clipboard
  }
}