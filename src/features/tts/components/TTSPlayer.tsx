'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Volume2 } from 'lucide-react'
import { SimpleTTSPlayer } from './SimpleTTSPlayer'
import { PremiumTTSPlayer } from './PremiumTTSPlayer'
import { OfflineTTSPlayer } from './OfflineTTSPlayer'

interface TTSPlayerProps {
  text: string
  title?: string
}

type TTSProvider = 'browser' | 'premium' | 'offline'

const TTS_PROVIDERS = [
  {
    value: 'browser' as TTSProvider,
    label: '브라우저 기본 음성',
    description: '무료, 즉시 재생',
    icon: '🌐'
  },
  {
    value: 'premium' as TTSProvider,
    label: '프리미엄 기도 음성',
    description: 'SSML 기도 톤 + 멀티캐스팅',
    icon: '🙏'
  },
  {
    value: 'offline' as TTSProvider,
    label: '오프라인 기도 음성',
    description: '완전 무료 + 개인정보 보호',
    icon: '🔐'
  }
]

export function TTSPlayer({ text, title }: TTSPlayerProps) {
  const [selectedProvider, setSelectedProvider] = useState<TTSProvider>('premium')

  const renderTTSPlayer = () => {
    switch (selectedProvider) {
      case 'browser':
        return <SimpleTTSPlayer text={text} title={title} />
      case 'premium':
        return <PremiumTTSPlayer text={text} title={title} />
      case 'offline':
        return <OfflineTTSPlayer text={text} title={title} />
      default:
        return <PremiumTTSPlayer text={text} title={title} />
    }
  }

  const selectedProviderInfo = TTS_PROVIDERS.find(p => p.value === selectedProvider)

  return (
    <div className="space-y-4">
      {/* TTS 제공자 선택 */}
      <Card className="border-0 shadow-md bg-white/70 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-gray-800 flex items-center space-x-2 text-base md:text-lg">
            <div className="w-5 h-5 bg-gradient-to-r from-orange-400 to-rose-400 rounded-full flex items-center justify-center">
              <Volume2 className="w-2 h-2 text-white" />
            </div>
            <span>음성 엔진 선택</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select
            value={selectedProvider}
            onValueChange={(value: TTSProvider) => setSelectedProvider(value)}
          >
            <SelectTrigger className="border-orange-200 focus:border-orange-400 focus:ring-orange-200 bg-white/70">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white/95 backdrop-blur-sm border-orange-200">
              {TTS_PROVIDERS.map((provider) => (
                <SelectItem 
                  key={provider.value} 
                  value={provider.value} 
                  className="hover:bg-orange-50"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{provider.icon}</span>
                    <div>
                      <div className="font-medium">{provider.label}</div>
                      <div className="text-xs text-gray-500">{provider.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* 선택된 제공자 정보 */}
          <div className="text-xs text-gray-600 bg-orange-50/50 p-2 rounded border border-orange-200/50">
            <div className="flex items-center space-x-2">
              <span>{selectedProviderInfo?.icon}</span>
              <span><strong>{selectedProviderInfo?.label}</strong></span>
            </div>
            <p className="mt-1">{selectedProviderInfo?.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* 선택된 TTS 플레이어 */}
      {renderTTSPlayer()}
    </div>
  )
}