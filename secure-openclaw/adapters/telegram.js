import TelegramBot from 'node-telegram-bot-api'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import BaseAdapter from './base.js'
import { transcribeAudio } from '../tools/transcribe.js'
import { formatForTelegram } from '../tools/formatter.js'
import { saveUpload, UPLOAD_LIMITS } from '../tools/uploads.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Telegram adapter using node-telegram-bot-api
 * Supports text, image, voice, audio, and document messages
 */
export default class TelegramAdapter extends BaseAdapter {
  constructor(config) {
    super(config)
    this.bot = null
    this.botInfo = null

    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true })
    }
  }

  async start() {
    if (!this.config.token) {
      throw new Error('Telegram bot token is required. Get one from @BotFather')
    }

    this.bot = new TelegramBot(this.config.token, { polling: true })

    // Get bot info
    this.botInfo = await this.bot.getMe()
    console.log(`[Telegram] Connected as @${this.botInfo.username}`)

    // Handle incoming messages
    this.bot.on('message', async (msg) => {
      await this.handleMessage(msg)
    })

    // Handle errors
    this.bot.on('polling_error', (err) => {
      console.error('[Telegram] Polling error:', err.message)
    })

    console.log('[Telegram] Adapter started')
  }

  async stop() {
    if (this.bot) {
      await this.bot.stopPolling()
      this.bot = null
    }
    console.log('[Telegram] Adapter stopped')
  }

  async sendMessage(chatId, text) {
    if (!this.bot) {
      throw new Error('Telegram not connected')
    }

    // Format markdown for Telegram
    const formatted = formatForTelegram(text)

    // Telegram has a 4096 character limit per message
    if (formatted.length > 4096) {
      const chunks = this.splitMessage(formatted, 4096)
      for (const chunk of chunks) {
        await this._sendFormatted(chatId, chunk)
      }
    } else {
      await this._sendFormatted(chatId, formatted)
    }
  }

  /**
   * Send a formatted message, falling back to plain text if parse_mode fails
   */
  async _sendFormatted(chatId, text) {
    try {
      await this.bot.sendMessage(chatId, text, { parse_mode: 'Markdown' })
    } catch (err) {
      // If Markdown parsing fails, send as plain text
      try {
        await this.bot.sendMessage(chatId, text)
      } catch (err2) {
        console.error('[Telegram] Failed to send message:', err2.message)
      }
    }
  }

  /**
   * Send an image to a chat
   * @param {string} chatId - Chat ID
   * @param {string} imagePath - Absolute path to the image file
   * @param {string} caption - Optional caption
   */
  async sendImage(chatId, imagePath, caption = '') {
    if (!this.bot) throw new Error('Telegram not connected')
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`)
    }
    const stream = fs.createReadStream(imagePath)
    await this.bot.sendPhoto(chatId, stream, { caption })
    console.log(`[Telegram] Sent image: ${path.basename(imagePath)}`)
  }

  /**
   * Send a document/file to a chat
   * @param {string} chatId - Chat ID
   * @param {string} filePath - Absolute path to the file
   * @param {string} caption - Optional caption
   */
  async sendDocument(chatId, filePath, caption = '') {
    if (!this.bot) throw new Error('Telegram not connected')
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`)
    }
    const stream = fs.createReadStream(filePath)
    await this.bot.sendDocument(chatId, stream, { caption })
    console.log(`[Telegram] Sent document: ${path.basename(filePath)}`)
  }

  splitMessage(text, maxLength) {
    const chunks = []
    let remaining = text
    while (remaining.length > 0) {
      if (remaining.length <= maxLength) {
        chunks.push(remaining)
        break
      }
      // Find a good break point
      let breakPoint = remaining.lastIndexOf('\n', maxLength)
      if (breakPoint === -1 || breakPoint < maxLength / 2) {
        breakPoint = remaining.lastIndexOf(' ', maxLength)
      }
      if (breakPoint === -1 || breakPoint < maxLength / 2) {
        breakPoint = maxLength
      }
      chunks.push(remaining.substring(0, breakPoint))
      remaining = remaining.substring(breakPoint).trim()
    }
    return chunks
  }

  async sendTyping(chatId) {
    if (!this.bot) return
    try {
      await this.bot.sendChatAction(chatId, 'typing')
    } catch (err) {
      // Ignore
    }
  }

  async handleMessage(msg) {
    // Skip messages without content
    if (!msg.text && !msg.photo && !msg.caption && !msg.document && !msg.voice && !msg.audio) return

    const chatId = msg.chat.id.toString()
    const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'
    const sender = msg.from?.id?.toString() || chatId

    // Extract text
    let text = msg.text || msg.caption || ''

    // Check for image
    let image = null
    if (msg.photo && msg.photo.length > 0) {
      // Get the largest photo
      const photo = msg.photo[msg.photo.length - 1]
      try {
        const fileLink = await this.bot.getFileLink(photo.file_id)
        const response = await fetch(fileLink)
        const buffer = Buffer.from(await response.arrayBuffer())
        image = {
          data: buffer.toString('base64'),
          mediaType: 'image/jpeg'
        }
        console.log('[Telegram] Image downloaded, size:', buffer.length)
        if (!text) {
          text = '[Image]'
        }
      } catch (err) {
        console.error('[Telegram] Failed to download image:', err.message)
      }
    }

    // Check for voice message
    if (msg.voice || msg.audio) {
      const voiceOrAudio = msg.voice || msg.audio
      try {
        console.log(`[Telegram] Downloading ${msg.voice ? 'voice' : 'audio'} message...`)
        const fileLink = await this.bot.getFileLink(voiceOrAudio.file_id)
        const response = await fetch(fileLink)
        const buffer = Buffer.from(await response.arrayBuffer())

        const mimeType = voiceOrAudio.mime_type || 'audio/ogg'
        const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'mp4' : 'ogg'
        const filename = `voice_${Date.now()}.${ext}`

        console.log(`[Telegram] Voice downloaded (${buffer.length} bytes), transcribing...`)
        const transcript = await transcribeAudio(buffer, { filename, mimeType })

        if (transcript) {
          console.log(`[Telegram] Transcription: "${transcript.substring(0, 80)}..."`)
          text = transcript
        } else {
          text = '[Voice message - transcription failed]'
        }
      } catch (err) {
        console.error('[Telegram] Failed to process voice message:', err.message)
        text = '[Voice message - could not process]'
      }
    }

    // Check for document (PDF, etc.)
    let file = null
    if (msg.document) {
      try {
        // Pre-check file size from Telegram metadata to avoid downloading huge files
        if (msg.document.file_size && msg.document.file_size > UPLOAD_LIMITS.maxBytes) {
          console.warn(`[Telegram] Rejecting document ${msg.document.file_name}: ${msg.document.file_size} bytes exceeds limit ${UPLOAD_LIMITS.maxBytes}`)
          await this.bot.sendMessage(chatId, `Sorry, that file is too large (max ${Math.floor(UPLOAD_LIMITS.maxBytes / 1024 / 1024)}MB).`)
          return
        }

        const fileLink = await this.bot.getFileLink(msg.document.file_id)
        const response = await fetch(fileLink)
        const buffer = Buffer.from(await response.arrayBuffer())

        file = saveUpload({
          buffer,
          fileName: msg.document.file_name,
          mimeType: msg.document.mime_type,
          platform: 'telegram',
          chatId
        })

        if (!image && file.mimetype.startsWith('image/')) {
          image = {
            data: buffer.toString('base64'),
            mediaType: file.mimetype
          }
        }

        console.log(`[Telegram] Document saved: ${file.path} (${file.size} bytes)`)
        if (!text) {
          text = image ? '[Image]' : `[File: ${file.name}]`
        }
      } catch (err) {
        console.error('[Telegram] Failed to download document:', err.message)
        if (err.message.includes('exceeds limit')) {
          try { await this.bot.sendMessage(chatId, `File rejected: ${err.message}`) } catch {}
        }
      }
    }

    if (!text && !image && !file) return

    // Check for bot mention in groups
    const botMentioned = text.includes(`@${this.botInfo.username}`)

    // Remove bot mention from text
    if (botMentioned) {
      text = text.replace(`@${this.botInfo.username}`, '').trim()
    }

    const message = {
      chatId,
      text,
      isGroup,
      sender,
      mentions: botMentioned ? ['self'] : [],
      image,
      file,
      raw: msg
    }

    if (!this.shouldRespond(message, this.config)) {
      return
    }

    this.emitMessage(message)
  }
}
