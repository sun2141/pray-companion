// App-wide constants
export const APP_CONFIG = {
  name: '기도동행',
  description: 'AI 기반 동행 기도 PWA',
  maxDailyPrayersForFreeUsers: 3,
  prayerMaxLength: 500,
  ttsSpeedRange: { min: 0.5, max: 2.0 },
  companionCountUpdateInterval: 5000, // 5 seconds
} as const

export const PRAYER_CATEGORIES = [
  '감사',
  '회개',
  '간구',
  '중보',
  '찬양',
  '묵상',
] as const

export const TTS_VOICES = {
  female: 'nara',
  male: 'jinho',
} as const

export const SUBSCRIPTION = {
  monthlyPrice: 4900,
  benefits: ['광고 제거', '무제한 기도문 생성', '고급 음성 옵션'],
} as const