// Global type definitions for the pray companion app
export interface PrayerRequest {
  id: string
  title: string
  content?: string
  category?: string
  createdAt: Date
}

export interface AIGeneratedPrayer {
  id: string
  title: string
  content: string
  requestId: string
  generatedAt: Date
}

export interface CompanionCount {
  current: number
  updatedAt: Date
}

export interface User {
  id: string
  email?: string
  isSubscribed: boolean
  subscriptionExpiry?: Date
}