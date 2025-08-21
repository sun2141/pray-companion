'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import type { PrayerGenerationRequest, PrayerGenerationResponse } from '@/types/prayer'

const generatePrayer = async (request: PrayerGenerationRequest): Promise<PrayerGenerationResponse> => {
  const response = await axios.post('/api/prayer/generate', request)
  return response.data
}

export function usePrayerGeneration() {
  const [lastGeneratedPrayer, setLastGeneratedPrayer] = useState<PrayerGenerationResponse['prayer'] | null>(null)

  const mutation = useMutation({
    mutationFn: generatePrayer,
    onSuccess: (data) => {
      if (data.success && data.prayer) {
        setLastGeneratedPrayer(data.prayer)
      }
    },
  })

  return {
    generatePrayer: mutation.mutate,
    isGenerating: mutation.isPending,
    error: mutation.error,
    data: mutation.data,
    lastPrayer: lastGeneratedPrayer,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
  }
}