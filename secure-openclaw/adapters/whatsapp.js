import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  downloadMediaMessage
} from '@whiskeysockets/baileys'
import qrcode from 'qrcode-terminal'
import pino from 'pino'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import BaseAdapter from './base.js'
import { transcribeAudio } from '../tools/transcribe.js'
import { formatForWhatsApp } from '../tools/formatter.js'
import { saveUpload, UPLOAD_LIMITS } from '../tools/uploads.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const AUTH_DIR = path.join(__dirname, '..', 'auth_whatsapp')

/**
 * WhatsApp adapter using Baileys
 * Supports text, image, and document messages
 */
export default class WhatsAppAdapter extends BaseAdapter {
  constructor(config) {
    super(config)
    this.sock = null
    this.myJid = null
    this.myLid = null
    this.jidMap = new Map()
    this.latestQr = null
    this.sentMessageIds = new Set()
    // LID↔phone bidirectional maps (populated from contacts events)
    this.lidToPhone = new Map()
    this.phoneToLid = new Map()
    // Normalize allowedDMs: accept bare numbers, add @s.whatsapp.net if missing
    this.config.allowedDMs = this.config.allowedDMs.map(entry => {
      if (entry === '*') return entry
      if (entry.includes('@')) return entry
      return `${entry}@s.whatsapp.net`
    })

    // Uploads directory is managed by tools/uploads.js
  }

  async start() {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR)
    const { version } = await fetchLatestBaileysVersion()

    const logger = pino({ level: 'silent' })

    this.sock = makeWASocket({
      version,
      auth: state,
      logger,
      printQRInTerminal: false,
      generateHighQualityLinkPreview: false
    })

    this.sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update

      if (qr) {
        this.latestQr = qr
        console.log('\n[WhatsApp] Scan QR code to connect:')
        qrcode.generate(qr, { small: true })
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode

        console.log(`[WhatsApp] Connection closed. Status: ${statusCode}`)

        if (statusCode === DisconnectReason.loggedOut) {
          console.log('[WhatsApp] Logged out. Please delete auth folder and restart.')
        } else if (this.myJid) {
          console.log('[WhatsApp] Reconnecting...')
          this.start()
        } else {
          console.log('[WhatsApp] QR code expired. Restart to try again.')
        }
      }

      if (connection === 'open') {
        this.latestQr = null
        this.myJid = this.sock.user?.id
        this.myLid = this.sock.user?.lid || null
        console.log(`[WhatsApp] Connected as ${this.myJid} (LID: ${this.myLid})`)

        // Always allow messaging yourself (self-DM) — add both phone JID and LID formats
        if (!this.config.allowedDMs.includes('*')) {
          if (this.myJid) {
            const selfJid = this.myJid.replace(/:.*@/, '@')
            if (!this.config.allowedDMs.includes(selfJid)) {
              this.config.allowedDMs.push(selfJid)
              console.log(`[WhatsApp] Auto-allowed self-DM (phone): ${selfJid}`)
            }
          }
          if (this.myLid) {
            const selfLid = this.myLid.replace(/:.*@/, '@')
            if (!this.config.allowedDMs.includes(selfLid)) {
              this.config.allowedDMs.push(selfLid)
              console.log(`[WhatsApp] Auto-allowed self-DM (LID): ${selfLid}`)
            }
          }
        }

        // Seed own LID↔phone mapping
        if (this.myJid && this.myLid) {
          this._mapContact(this.myJid, this.myLid)
        }

        // Resolve allowlisted phone numbers to LIDs
        this._resolveAllowlist()
      }
    })

    this.sock.ev.on('creds.update', saveCreds)

    // Learn LID↔phone mappings from all contact-related events
    const learnContacts = (contacts) => {
      let learned = 0
      for (const c of contacts) {
        if (c.id && c.lid) { this._mapContact(c.id, c.lid); learned++ }
      }
      if (learned) console.log(`[WhatsApp] Learned ${learned} contacts (total map: ${this.lidToPhone.size})`)
    }
    this.sock.ev.on('contacts.upsert', learnContacts)
    this.sock.ev.on('contacts.update', learnContacts)
    // History sync (fires on first connect, has contacts with both id+lid)
    this.sock.ev.on('messaging-history.set', ({ contacts }) => {
      if (contacts?.length) learnContacts(contacts)
    })

    this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return

      for (const msg of messages) {
        await this.handleMessage(msg)
      }
    })

    console.log('[WhatsApp] Adapter starting...')
  }

  async stop() {
    if (this.sock) {
      this.sock.end()
      this.sock = null
    }
    console.log('[WhatsApp] Adapter stopped')
  }

  async sendMessage(chatId, text) {
    if (!this.sock) {
      throw new Error('WhatsApp not connected')
    }

    // Format markdown for WhatsApp
    const formatted = formatForWhatsApp(text)

    const targetJid = this.jidMap?.get(chatId) || chatId
    const sentMsg = await this.sock.sendMessage(targetJid, { text: formatted })

    // Track sent message ID so we can filter out our own echoes in self-DMs
    if (sentMsg?.key?.id) {
      this.sentMessageIds.add(sentMsg.key.id)
      setTimeout(() => this.sentMessageIds.delete(sentMsg.key.id), 10000)
    }
  }

  /**
   * Send an image to a chat
   * @param {string} chatId - Chat JID
   * @param {string} imagePath - Absolute path to the image file
   * @param {string} caption - Optional caption
   */
  async sendImage(chatId, imagePath, caption = '') {
    if (!this.sock) throw new Error('WhatsApp not connected')
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`)
    }
    const targetJid = this.jidMap?.get(chatId) || chatId
    const imageBuffer = fs.readFileSync(imagePath)
    const sentMsg = await this.sock.sendMessage(targetJid, {
      image: imageBuffer,
      caption: caption || undefined
    })
    if (sentMsg?.key?.id) {
      this.sentMessageIds.add(sentMsg.key.id)
      setTimeout(() => this.sentMessageIds.delete(sentMsg.key.id), 10000)
    }
    console.log(`[WhatsApp] Sent image: ${path.basename(imagePath)}`)
  }

  /**
   * Send a document/file to a chat
   * @param {string} chatId - Chat JID
   * @param {string} filePath - Absolute path to the file
   * @param {string} caption - Optional caption
   */
  async sendDocument(chatId, filePath, caption = '') {
    if (!this.sock) throw new Error('WhatsApp not connected')
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`)
    }
    const targetJid = this.jidMap?.get(chatId) || chatId
    const fileBuffer = fs.readFileSync(filePath)
    const fileName = path.basename(filePath)
    const sentMsg = await this.sock.sendMessage(targetJid, {
      document: fileBuffer,
      fileName,
      caption: caption || undefined
    })
    if (sentMsg?.key?.id) {
      this.sentMessageIds.add(sentMsg.key.id)
      setTimeout(() => this.sentMessageIds.delete(sentMsg.key.id), 10000)
    }
    console.log(`[WhatsApp] Sent document: ${fileName}`)
  }

  async sendTyping(chatId) {
    if (!this.sock) return
    try {
      await this.sock.sendPresenceUpdate('composing', chatId)
    } catch (err) {
      // Ignore
    }
  }

  async stopTyping(chatId) {
    if (!this.sock) return
    try {
      await this.sock.sendPresenceUpdate('paused', chatId)
    } catch (err) {
      // Ignore
    }
  }

  async react(chatId, messageId, emoji) {
    if (!this.sock) return
    try {
      await this.sock.sendMessage(chatId, {
        react: { text: emoji, key: { remoteJid: chatId, id: messageId } }
      })
    } catch (err) {
      // Ignore
    }
  }

  /**
   * Download media from message
   */
  async downloadMedia(msg) {
    try {
      const buffer = await downloadMediaMessage(
        msg,
        'buffer',
        {},
        {
          logger: pino({ level: 'silent' }),
          reuploadRequest: this.sock.updateMediaMessage
        }
      )
      return buffer
    } catch (err) {
      console.error('[WhatsApp] Failed to download media:', err.message)
      return null
    }
  }

  /**
   * Download image from message
   */
  async downloadImage(msg) {
    return this.downloadMedia(msg)
  }

  /**
   * Check if a chatId is in the allowedDMs list.
   * Handles LID↔phone translation so users can just put phone numbers in the env var.
   */
  async _resolveAllowlist() {
    const phoneEntries = this.config.allowedDMs.filter(e => e.endsWith('@s.whatsapp.net'))
    if (!phoneEntries.length || this.config.allowedDMs.includes('*')) return

    console.log(`[WhatsApp] Resolving ${phoneEntries.length} allowlisted numbers...`)
    for (const phoneJid of phoneEntries) {
      // Skip if already mapped
      if (this.phoneToLid.has(phoneJid)) continue
      const num = phoneJid.replace('@s.whatsapp.net', '')
      try {
        const [result] = await this.sock.onWhatsApp(num)
        if (result) {
          if (result.lid) {
            const lid = result.lid.replace(/:.*@/, '@')
            this._mapContact(phoneJid, lid)
            // Also add the LID to the allowlist directly
            if (!this.config.allowedDMs.includes(lid)) {
              this.config.allowedDMs.push(lid)
            }
            console.log(`[WhatsApp] Resolved ${num} → LID ${lid}`)
          }
        }
      } catch (err) {
        console.log(`[WhatsApp] Could not resolve ${num}: ${err.message}`)
      }
    }
    console.log(`[WhatsApp] Allowlist resolved (${this.lidToPhone.size} LID↔phone pairs)`)
  }

  /**
   * Store a LID↔phone mapping (strips :device suffixes)
   */
  _mapContact(phoneJid, lidJid) {
    const phone = phoneJid.replace(/:.*@/, '@')
    const lid = lidJid.replace(/:.*@/, '@')
    this.lidToPhone.set(lid, phone)
    this.phoneToLid.set(phone, lid)
  }

  /**
   * Check if a chatId is in the allowedDMs list.
   * Handles LID↔phone translation so users can just put phone numbers in the env var.
   */
  _isAllowedDM(chatId, allowedDMs) {
    if (allowedDMs.includes('*')) return true
    // Direct match (e.g. chatId is phone JID and allowlist has phone JID)
    if (allowedDMs.includes(chatId)) return true
    // Translate via map: chatId is LID → look up phone, or vice versa
    const alt = this.lidToPhone.get(chatId) || this.phoneToLid.get(chatId)
    if (alt && allowedDMs.includes(alt)) return true
    return false
  }

  async handleMessage(msg) {
    if (msg.key.fromMe) {
      if (this.sentMessageIds.has(msg.key.id)) {
        this.sentMessageIds.delete(msg.key.id)
        return // This is our own bot reply echoing back
      }
      // Otherwise this is the user messaging themselves — allow it through
    }

    const jid = msg.key.remoteJid
    const isGroup = jid?.endsWith('@g.us')
    const sender = isGroup ? msg.key.participant : jid

    // Early bail-out for DMs: check allowlist before any heavy work
    if (!isGroup) {
      if (!this._isAllowedDM(jid, this.config.allowedDMs)) {
        return
      }
    } else {
      // Early bail-out for groups: check group allowlist (mention check comes later)
      if (this.config.allowedGroups.length === 0) return
      if (!this.config.allowedGroups.includes('*') && !this.config.allowedGroups.includes(jid)) return
    }

    // Extract text
    let text = msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      msg.message?.videoMessage?.caption ||
      msg.message?.documentMessage?.caption ||
      ''

    // Extract mentions (needed for group mention-gating)
    const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
    const myNumber = this.myJid?.split('@')[0]?.split(':')[0]
    const myLidNumber = this.myLid?.split('@')[0]?.split(':')[0]
    const isMentioned = mentions.some(m => {
      const mBase = m.split('@')[0]?.split(':')[0]
      return (myNumber && mBase === myNumber) || (myLidNumber && mBase === myLidNumber)
    })

    // Group mention-only gating — bail before downloading media
    if (isGroup && this.config.respondToMentionsOnly && !isMentioned) {
      return
    }

    // Check for image (only after passing security checks)
    let image = null
    if (msg.message?.imageMessage) {
      console.log('[WhatsApp] Downloading image...')
      const buffer = await this.downloadMedia(msg)
      if (buffer) {
        image = {
          data: buffer.toString('base64'),
          mediaType: 'image/jpeg'
        }
        console.log('[WhatsApp] Image downloaded, size:', buffer.length)
      }
      if (!text) {
        text = '[Image]'
      }
    }

    // Check for voice/audio message
    if (msg.message?.audioMessage) {
      const audioMsg = msg.message.audioMessage
      const isVoiceNote = audioMsg.ptt === true
      console.log(`[WhatsApp] Downloading ${isVoiceNote ? 'voice note' : 'audio'}...`)

      const buffer = await this.downloadMedia(msg)
      if (buffer) {
        const mimeType = audioMsg.mimetype || 'audio/ogg'
        const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'mp4' : 'ogg'
        const filename = `voice_${Date.now()}.${ext}`

        console.log(`[WhatsApp] Audio downloaded (${buffer.length} bytes), transcribing...`)
        const transcript = await transcribeAudio(buffer, { filename, mimeType })

        if (transcript) {
          console.log(`[WhatsApp] Transcription: "${transcript.substring(0, 80)}..."`)
          text = transcript
        } else {
          text = '[Voice message - transcription failed]'
        }
      } else {
        text = '[Voice message - could not download]'
      }
    }

    // Check for document (PDF, etc.)
    let file = null
    if (msg.message?.documentMessage) {
      const doc = msg.message.documentMessage
      const rawName = doc.fileName || `file_${Date.now()}`

      // Pre-check file size from metadata to avoid large downloads
      const fileSize = Number(doc.fileLength) || 0
      if (fileSize && fileSize > UPLOAD_LIMITS.maxBytes) {
        console.warn(`[WhatsApp] Rejecting document ${rawName}: ${fileSize} bytes exceeds limit ${UPLOAD_LIMITS.maxBytes}`)
        try {
          await this.sock.sendMessage(jid, { text: `Sorry, that file is too large (max ${Math.floor(UPLOAD_LIMITS.maxBytes / 1024 / 1024)}MB).` })
        } catch {}
        return
      }

      console.log(`[WhatsApp] Downloading document: ${rawName} (${doc.mimetype})...`)

      try {
        const buffer = await this.downloadMedia(msg)
        if (buffer) {
          file = saveUpload({
            buffer,
            fileName: rawName,
            mimeType: doc.mimetype,
            platform: 'whatsapp',
            chatId: jid
          })
          console.log(`[WhatsApp] Document saved: ${file.path} (${file.size} bytes)`)
        }
      } catch (err) {
        console.error('[WhatsApp] Failed to save document:', err.message)
        if (err.message.includes('exceeds limit')) {
          try { await this.sock.sendMessage(jid, { text: `File rejected: ${err.message}` }) } catch {}
        }
      }

      if (!text) {
        text = `[File: ${file?.name || rawName}]`
      }
    }

    if (!text && !image && !file) return

    this.emitMessage({
      chatId: jid,
      text,
      isGroup,
      sender,
      mentions: isMentioned ? ['self'] : mentions,
      image,
      file,
      raw: msg
    })
  }
}
