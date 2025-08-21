export interface PrayerGenerationRequest {
  title: string
  category?: string
  situation?: string
  tone?: 'formal' | 'casual' | 'warm'
  length?: 'short' | 'long'
}

export interface PrayerGenerationResponse {
  success: boolean
  prayer?: {
    id: string
    content: string
    title: string
    category?: string
    generatedAt: string
    cached: boolean
  }
  error?: string
}

export interface CachedPrayer {
  id: string
  content: string
  title: string
  category?: string
  generatedAt: string
  cacheKey: string
  expiresAt: string
}