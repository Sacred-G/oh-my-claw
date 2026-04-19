import fs from 'fs'
import path from 'path'
import os from 'os'

/**
 * Transcribe audio using OpenAI Whisper API
 * Falls back to returning null if no API key is available
 */
export async function transcribeAudio(audioBuffer, { filename = 'audio.ogg', mimeType = 'audio/ogg' } = {}) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.error('[Transcribe] No OPENAI_API_KEY set — cannot transcribe voice messages')
    return null
  }

  // Write buffer to a temp file (OpenAI API requires multipart file upload)
  const tmpDir = path.join(os.tmpdir(), 'openclaw-audio')
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true })
  }
  const tmpPath = path.join(tmpDir, `${Date.now()}_${filename}`)
  fs.writeFileSync(tmpPath, audioBuffer)

  try {
    // Build multipart form data manually using fetch
    const formData = new FormData()
    const fileBlob = new Blob([audioBuffer], { type: mimeType })
    formData.append('file', fileBlob, filename)
    formData.append('model', 'whisper-1')
    formData.append('response_format', 'text')

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Transcribe] Whisper API error (${response.status}):`, errorText)
      return null
    }

    const transcript = await response.text()
    console.log(`[Transcribe] Transcribed ${audioBuffer.length} bytes → ${transcript.length} chars`)
    return transcript.trim()
  } catch (err) {
    console.error('[Transcribe] Failed:', err.message)
    return null
  } finally {
    // Clean up temp file
    try { fs.unlinkSync(tmpPath) } catch (_) {}
  }
}
