'use client'

import React from 'react'
import { Play, Pause, Square, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { useAudioPlayer } from '../hooks/useAudioPlayer'

interface AudioPlayerProps {
  audioUrl?: string
  title?: string
  cached?: boolean
  onPlayStateChange?: (isPlaying: boolean) => void
}

export function AudioPlayer({ audioUrl, title, cached, onPlayStateChange }: AudioPlayerProps) {
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackRate,
    loading,
    togglePlayPause,
    stop,
    seek,
    setVolume,
    setPlaybackRate,
  } = useAudioPlayer(audioUrl)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleProgressChange = (values: number[]) => {
    const newTime = (values[0] / 100) * duration
    seek(newTime)
  }

  const handleVolumeChange = (values: number[]) => {
    setVolume(values[0] / 100)
  }

  const handleSpeedChange = (value: string) => {
    setPlaybackRate(parseFloat(value))
  }

  React.useEffect(() => {
    onPlayStateChange?.(isPlaying)
  }, [isPlaying, onPlayStateChange])

  if (!audioUrl) {
    return null
  }

  return (
    <Card className="border-0 shadow-md bg-gradient-to-r from-orange-50/50 to-rose-50/50 border border-orange-200/50">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Title and Cache Status */}
          {title && (
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm md:text-base text-gray-800">{title}</h3>
              {cached && (
                <span className="text-xs bg-gradient-to-r from-orange-100 to-rose-100 text-orange-800 px-2 py-1 rounded-full border border-orange-200">
                  캐시됨
                </span>
              )}
            </div>
          )}

          {/* Progress Bar */}
          <div className="space-y-2">
            <Slider
              value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
              onValueChange={handleProgressChange}
              className="w-full"
              disabled={loading || duration === 0}
            />
            <div className="flex justify-between text-xs text-orange-700/80">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Play/Pause Button */}
              <Button
                size="sm"
                variant="outline"
                onClick={togglePlayPause}
                disabled={loading}
                className="w-10 h-10 border-orange-200 text-orange-700 hover:bg-orange-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>

              {/* Stop Button */}
              <Button
                size="sm"
                variant="outline"
                onClick={stop}
                disabled={loading}
                className="w-10 h-10 border-orange-200 text-orange-700 hover:bg-orange-50"
              >
                <Square className="w-4 h-4" />
              </Button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center space-x-2">
              {volume === 0 ? (
                <VolumeX className="w-4 h-4 text-orange-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-orange-400" />
              )}
              <Slider
                value={[volume * 100]}
                onValueChange={handleVolumeChange}
                className="w-20"
                max={100}
                step={1}
              />
            </div>

            {/* Speed Control */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-orange-700/80">속도</span>
              <Select value={playbackRate.toString()} onValueChange={handleSpeedChange}>
                <SelectTrigger className="w-16 h-8 text-xs border-orange-200 focus:border-orange-400 focus:ring-orange-200 bg-white/70">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-sm border-orange-200">
                  <SelectItem value="0.5" className="hover:bg-orange-50">0.5x</SelectItem>
                  <SelectItem value="0.75" className="hover:bg-orange-50">0.75x</SelectItem>
                  <SelectItem value="1" className="hover:bg-orange-50">1x</SelectItem>
                  <SelectItem value="1.25" className="hover:bg-orange-50">1.25x</SelectItem>
                  <SelectItem value="1.5" className="hover:bg-orange-50">1.5x</SelectItem>
                  <SelectItem value="2" className="hover:bg-orange-50">2x</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}