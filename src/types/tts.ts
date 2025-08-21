export interface TTSRequest {
  text: string
  voice?: 'nara' | 'jinho' | 'clara' | 'matt'
  speed?: number // 0.5 to 2.0
  format?: 'mp3' | 'wav'
}

export interface TTSResponse {
  success: boolean
  audio?: {
    url: string
    duration?: number
    fileSize?: number
    cached: boolean
  }
  error?: string
}

export interface CachedTTSFile {
  id: string
  textHash: string
  voice: string
  speed: number
  format: string
  fileUrl: string
  fileName: string
  fileSize: number
  duration?: number
  createdAt: string
  expiresAt: string
}