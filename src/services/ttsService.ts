import { createHash } from 'crypto'
import { supabaseServer } from '@/lib/supabase-server'
import type { TTSRequest, CachedTTSFile } from '@/types/tts'

export class TTSService {
  private static readonly CACHE_TABLE = 'tts_cache'
  private static readonly STORAGE_BUCKET = 'tts-audio'
  private static readonly CACHE_TTL_HOURS = 24 * 7 // 7 days
  
  static generateTextHash(text: string, voice: string, speed: number): string {
    const normalizedText = text.toLowerCase().trim().replace(/\s+/g, ' ')
    const dataString = `${normalizedText}:${voice}:${speed}`
    return createHash('sha256').update(dataString).digest('hex')
  }

  static async getCachedTTS(textHash: string): Promise<CachedTTSFile | null> {
    try {
      const { data, error } = await supabaseServer
        .from(this.CACHE_TABLE)
        .select('*')
        .eq('text_hash', textHash)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (error || !data) {
        return null
      }

      return {
        id: data.id,
        textHash: data.text_hash,
        voice: data.voice,
        speed: data.speed,
        format: data.format,
        fileUrl: data.file_url,
        fileName: data.file_name,
        fileSize: data.file_size,
        duration: data.duration,
        createdAt: data.created_at,
        expiresAt: data.expires_at,
      }
    } catch (error) {
      console.error('Error fetching cached TTS:', error)
      return null
    }
  }

  static async saveTTSToCache(
    textHash: string,
    ttsFile: {
      voice: string
      speed: number
      format: string
      fileUrl: string
      fileName: string
      fileSize: number
      duration?: number
    }
  ): Promise<void> {
    try {
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + this.CACHE_TTL_HOURS)

      await supabaseServer.from(this.CACHE_TABLE).upsert({
        text_hash: textHash,
        voice: ttsFile.voice,
        speed: ttsFile.speed,
        format: ttsFile.format,
        file_url: ttsFile.fileUrl,
        file_name: ttsFile.fileName,
        file_size: ttsFile.fileSize,
        duration: ttsFile.duration,
        created_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      })
    } catch (error) {
      console.error('Error saving TTS to cache:', error)
    }
  }

  static async generateTTSWithNaver(request: TTSRequest): Promise<ArrayBuffer> {
    const { text, voice = 'nara', speed = 1.0 } = request

    if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
      throw new Error('Naver TTS credentials not configured')
    }

    const response = await fetch('https://naveropenapi.apigw.ntruss.com/tts-premium/v1/tts', {
      method: 'POST',
      headers: {
        'X-NCP-APIGW-API-KEY-ID': process.env.NAVER_CLIENT_ID,
        'X-NCP-APIGW-API-KEY': process.env.NAVER_CLIENT_SECRET,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        speaker: voice,
        speed: speed.toString(),
        text: text,
        format: 'mp3',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Naver TTS API error: ${response.status} ${errorText}`)
    }

    return await response.arrayBuffer()
  }

  static async uploadTTSFile(audioBuffer: ArrayBuffer, fileName: string): Promise<string> {
    try {
      const { data, error } = await supabaseServer.storage
        .from(this.STORAGE_BUCKET)
        .upload(fileName, audioBuffer, {
          contentType: 'audio/mpeg',
          cacheControl: '3600',
        })

      if (error) {
        throw new Error(`Failed to upload TTS file: ${error.message}`)
      }

      const { data: publicUrlData } = supabaseServer.storage
        .from(this.STORAGE_BUCKET)
        .getPublicUrl(fileName)

      return publicUrlData.publicUrl
    } catch (error) {
      console.error('Error uploading TTS file:', error)
      throw error
    }
  }

  static async generateTTS(request: TTSRequest): Promise<{
    audio: {
      url: string
      duration?: number
      fileSize: number
      cached: boolean
    }
  }> {
    const { text, voice = 'nara', speed = 1.0, format = 'mp3' } = request
    const textHash = this.generateTextHash(text, voice, speed)

    // Check cache first
    const cachedTTS = await this.getCachedTTS(textHash)
    if (cachedTTS) {
      // Verify file still exists
      try {
        const response = await fetch(cachedTTS.fileUrl, { method: 'HEAD' })
        if (response.ok) {
          return {
            audio: {
              url: cachedTTS.fileUrl,
              duration: cachedTTS.duration,
              fileSize: cachedTTS.fileSize,
              cached: true,
            },
          }
        }
      } catch (error) {
        console.warn('Cached TTS file not accessible:', error)
      }
    }

    // Generate new TTS
    const audioBuffer = await this.generateTTSWithNaver(request)
    const fileSize = audioBuffer.byteLength
    const fileName = `tts_${textHash}_${Date.now()}.${format}`
    
    // Upload to Supabase Storage
    const fileUrl = await this.uploadTTSFile(audioBuffer, fileName)

    // Save to cache
    await this.saveTTSToCache(textHash, {
      voice,
      speed,
      format,
      fileUrl,
      fileName,
      fileSize,
    })

    return {
      audio: {
        url: fileUrl,
        fileSize,
        cached: false,
      },
    }
  }

  // Cleanup expired cached files
  static async cleanupExpiredFiles(): Promise<void> {
    try {
      const { data: expiredFiles } = await supabaseServer
        .from(this.CACHE_TABLE)
        .select('file_name')
        .lt('expires_at', new Date().toISOString())

      if (expiredFiles && expiredFiles.length > 0) {
        const fileNames = expiredFiles.map(file => file.file_name)
        
        // Delete from storage
        await supabaseServer.storage
          .from(this.STORAGE_BUCKET)
          .remove(fileNames)

        // Delete from cache table
        await supabaseServer
          .from(this.CACHE_TABLE)
          .delete()
          .lt('expires_at', new Date().toISOString())

        console.log(`Cleaned up ${fileNames.length} expired TTS files`)
      }
    } catch (error) {
      console.error('Error cleaning up expired TTS files:', error)
    }
  }
}

export const ttsService = TTSService