/**
 * Shared upload handler — sanitizes filenames, avoids collisions, enforces
 * size limits, and organizes files by platform + chat + day.
 *
 * Layout:
 *   uploads/<platform>/<chatId>/<YYYY-MM-DD>/<timestamp>_<safeName>
 *
 * Also provides a cleanup helper to prune files older than N days.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads')

// Max upload size (default 25MB, matches most messaging platform caps). Override with UPLOAD_MAX_BYTES.
const MAX_BYTES = Number(process.env.UPLOAD_MAX_BYTES) || 25 * 1024 * 1024

// Retention (default 30 days). Override with UPLOAD_RETENTION_DAYS.
const RETENTION_DAYS = Number(process.env.UPLOAD_RETENTION_DAYS) || 30

if (!fs.existsSync(UPLOADS_ROOT)) {
  fs.mkdirSync(UPLOADS_ROOT, { recursive: true })
}

/**
 * Sanitize a filename: strip path separators, control chars, and leading
 * dots. Preserve extension. Cap at 120 chars.
 */
export function sanitizeFileName(name) {
  if (!name || typeof name !== 'string') return `file_${Date.now()}`
  // Strip directory components
  let base = path.basename(name)
  // Replace unsafe characters
  base = base.replace(/[\x00-\x1f\x7f<>:"/\\|?*]/g, '_')
  // Collapse whitespace
  base = base.replace(/\s+/g, '_')
  // Strip leading dots (avoid hidden files / "..")
  base = base.replace(/^\.+/, '')
  if (!base) base = `file_${Date.now()}`
  // Truncate preserving extension
  if (base.length > 120) {
    const ext = path.extname(base).slice(0, 12)
    const stem = base.slice(0, 120 - ext.length)
    base = stem + ext
  }
  return base
}

/**
 * Sanitize a chat identifier for use as a directory name (phone numbers,
 * JIDs, etc.).
 */
function sanitizeSegment(seg) {
  if (!seg) return 'unknown'
  return String(seg).replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 80) || 'unknown'
}

function todayStamp() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/**
 * Save an uploaded file buffer to disk with a safe, collision-free path.
 *
 * @param {Object} opts
 * @param {Buffer} opts.buffer     - Raw bytes
 * @param {string} opts.fileName   - Original filename from sender (untrusted)
 * @param {string} [opts.mimeType] - MIME type from sender (untrusted)
 * @param {string} [opts.platform] - 'telegram' | 'whatsapp' | 'imessage' | 'signal'
 * @param {string} [opts.chatId]   - Chat identifier (used as subdir)
 * @returns {{path: string, name: string, mimetype: string, size: number}}
 * @throws if file exceeds MAX_BYTES
 */
export function saveUpload({ buffer, fileName, mimeType, platform = 'unknown', chatId = 'unknown' }) {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error('saveUpload: buffer must be a Buffer')
  }
  if (buffer.length > MAX_BYTES) {
    throw new Error(`Upload rejected: ${buffer.length} bytes exceeds limit of ${MAX_BYTES}`)
  }

  const safeName = sanitizeFileName(fileName)
  const dir = path.join(
    UPLOADS_ROOT,
    sanitizeSegment(platform),
    sanitizeSegment(chatId),
    todayStamp()
  )
  fs.mkdirSync(dir, { recursive: true })

  // Prefix with timestamp to guarantee uniqueness even across identical names.
  const prefix = `${Date.now()}_`
  let filePath = path.join(dir, prefix + safeName)
  // Extreme edge case — identical timestamps in the same ms. Append counter.
  let counter = 1
  while (fs.existsSync(filePath)) {
    filePath = path.join(dir, `${prefix}${counter}_${safeName}`)
    counter++
  }

  fs.writeFileSync(filePath, buffer)

  return {
    path: filePath,
    name: safeName,
    mimetype: mimeType || 'application/octet-stream',
    size: buffer.length
  }
}

/**
 * Delete upload files older than RETENTION_DAYS. Safe to call repeatedly.
 * Returns the count of files deleted.
 */
export function cleanupOldUploads(retentionDays = RETENTION_DAYS) {
  if (!fs.existsSync(UPLOADS_ROOT)) return 0
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000
  let deleted = 0

  function walk(dir) {
    if (!fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(full)
        // Remove empty dirs
        try {
          if (fs.readdirSync(full).length === 0) fs.rmdirSync(full)
        } catch {}
      } else if (entry.isFile()) {
        try {
          const stat = fs.statSync(full)
          if (stat.mtimeMs < cutoff) {
            fs.unlinkSync(full)
            deleted++
          }
        } catch (err) {
          // ignore per-file errors
        }
      }
    }
  }

  walk(UPLOADS_ROOT)
  return deleted
}

export const UPLOAD_LIMITS = {
  maxBytes: MAX_BYTES,
  retentionDays: RETENTION_DAYS,
  uploadsRoot: UPLOADS_ROOT
}
