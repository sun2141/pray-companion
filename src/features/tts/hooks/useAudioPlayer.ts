'use client'

import { useState, useRef, useEffect } from 'react'

interface AudioPlayerState {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  playbackRate: number
  loading: boolean
}

export function useAudioPlayer(audioUrl?: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    playbackRate: 1,
    loading: false,
  })

  useEffect(() => {
    if (!audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      setState(prev => ({ ...prev, isPlaying: false, currentTime: 0, duration: 0 }))
      return
    }

    // Create new audio element
    const audio = new Audio(audioUrl)
    audioRef.current = audio

    // Audio event handlers
    const handleLoadStart = () => setState(prev => ({ ...prev, loading: true }))
    const handleCanPlay = () => setState(prev => ({ ...prev, loading: false }))
    
    const handleLoadedMetadata = () => {
      setState(prev => ({ 
        ...prev, 
        duration: audio.duration || 0,
        loading: false 
      }))
    }

    const handleTimeUpdate = () => {
      setState(prev => ({ ...prev, currentTime: audio.currentTime }))
    }

    const handlePlay = () => setState(prev => ({ ...prev, isPlaying: true }))
    const handlePause = () => setState(prev => ({ ...prev, isPlaying: false }))
    const handleEnded = () => setState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }))

    const handleError = () => {
      setState(prev => ({ ...prev, loading: false, isPlaying: false }))
      console.error('Audio playback error')
    }

    // Attach event listeners
    audio.addEventListener('loadstart', handleLoadStart)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    return () => {
      // Cleanup
      audio.removeEventListener('loadstart', handleLoadStart)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      
      audio.pause()
      audioRef.current = null
    }
  }, [audioUrl])

  const play = async () => {
    if (audioRef.current) {
      try {
        await audioRef.current.play()
      } catch (error) {
        console.error('Failed to play audio:', error)
      }
    }
  }

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
  }

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(time, state.duration))
    }
  }

  const setVolume = (volume: number) => {
    const newVolume = Math.max(0, Math.min(1, volume))
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
    setState(prev => ({ ...prev, volume: newVolume }))
  }

  const setPlaybackRate = (rate: number) => {
    const newRate = Math.max(0.5, Math.min(2, rate))
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate
    }
    setState(prev => ({ ...prev, playbackRate: newRate }))
  }

  return {
    ...state,
    play,
    pause,
    stop,
    seek,
    setVolume,
    setPlaybackRate,
    togglePlayPause: state.isPlaying ? pause : play,
  }
}