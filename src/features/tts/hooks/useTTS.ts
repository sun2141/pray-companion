'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import type { TTSRequest, TTSResponse } from '@/types/tts'

const generateTTS = async (request: TTSRequest): Promise<TTSResponse> => {
  const response = await axios.post('/api/tts/generate', request)
  return response.data
}

export function useTTS() {
  const [currentAudio, setCurrentAudio] = useState<{
    url: string
    cached: boolean
    duration?: number
  } | null>(null)

  const mutation = useMutation({
    mutationFn: generateTTS,
    onSuccess: (data) => {
      if (data.success && data.audio) {
        setCurrentAudio({
          url: data.audio.url,
          cached: data.audio.cached,
          duration: data.audio.duration,
        })
      }
    },
  })

  const clearAudio = () => {
    setCurrentAudio(null)
  }

  return {
    generateTTS: mutation.mutate,
    isGenerating: mutation.isPending,
    error: mutation.error,
    data: mutation.data,
    currentAudio,
    clearAudio,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
  }
}