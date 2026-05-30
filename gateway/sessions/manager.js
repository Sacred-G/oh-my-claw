import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TRANSCRIPTS_DIR = path.join(__dirname, '..', 'transcripts')
const MAX_IN_MEMORY = 200     // Max entries kept in memory per session
const MAX_JSONL_ENTRIES = 500 // When JSONL exceeds this, archive old entries

/**
 * Session manager with JSONL transcript storage
 */
export default class SessionManager {
  constructor() {
    this.sessions = new Map()
    this.ensureTranscriptsDir()
  }

  ensureTranscriptsDir() {
    if (!fs.existsSync(TRANSCRIPTS_DIR)) {
      fs.mkdirSync(TRANSCRIPTS_DIR, { recursive: true })
    }
  }

  /**
   * Get or create a session by key
   * @param {string} key - Session key
   * @returns {Object} Session state
   */
  getSession(key) {
    if (!this.sessions.has(key)) {
      this.sessions.set(key, {
        key,
        lastRunId: null,
        lastActivity: Date.now(),
        transcript: []
      })
    }
    const session = this.sessions.get(key)
    session.lastActivity = Date.now()
    return session
  }

  /**
   * Generate filename for a session's transcript
   * @param {string} key - Session key
   * @returns {string} Filename
   */
  getTranscriptFilename(key) {
    // Sanitize key for filesystem
    const sanitized = key.replace(/[^a-zA-Z0-9_-]/g, '_')
    return path.join(TRANSCRIPTS_DIR, `${sanitized}.jsonl`)
  }

  /**
   * Append an entry to the session transcript
   * @param {string} key - Session key
   * @param {Object} entry - Entry to append (role, content, timestamp)
   */
  appendTranscript(key, entry) {
    const session = this.getSession(key)
    const timestampedEntry = {
      ...entry,
      timestamp: entry.timestamp || Date.now()
    }

    // Add to in-memory transcript (capped)
    session.transcript.push(timestampedEntry)
    if (session.transcript.length > MAX_IN_MEMORY) {
      session.transcript = session.transcript.slice(-MAX_IN_MEMORY)
    }

    // Append to JSONL file
    const filename = this.getTranscriptFilename(key)
    const line = JSON.stringify(timestampedEntry) + '\n'
    fs.appendFileSync(filename, line, 'utf-8')

    // Check if JSONL file needs pruning
    this.maybePruneFile(filename)
  }

  /**
   * Get recent transcript entries for context
   * @param {string} key - Session key
   * @param {number} limit - Max entries to return (default 50)
   * @returns {Array} Recent transcript entries
   */
  getTranscript(key, limit = 50) {
    const session = this.getSession(key)

    // If in-memory transcript is empty, try loading from file
    if (session.transcript.length === 0) {
      const filename = this.getTranscriptFilename(key)
      if (fs.existsSync(filename)) {
        try {
          const content = fs.readFileSync(filename, 'utf-8')
          const lines = content.trim().split('\n').filter(Boolean)
          session.transcript = lines.map(line => JSON.parse(line))
        } catch (err) {
          console.error(`Error loading transcript for ${key}:`, err)
        }
      }
    }

    // Return last N entries (capped at MAX_IN_MEMORY)
    return session.transcript.slice(-limit)
  }

  /**
   * Prune a JSONL file if it exceeds MAX_JSONL_ENTRIES.
   * Moves old entries to a .archive file and keeps only the last MAX_IN_MEMORY entries.
   */
  maybePruneFile(filename) {
    try {
      const content = fs.readFileSync(filename, 'utf-8')
      const lines = content.trim().split('\n').filter(Boolean)

      if (lines.length <= MAX_JSONL_ENTRIES) return

      console.log(`[Sessions] Pruning transcript: ${path.basename(filename)} (${lines.length} entries)`)

      // Archive old entries
      const archivePath = filename.replace('.jsonl', '.archive.jsonl')
      const oldEntries = lines.slice(0, lines.length - MAX_IN_MEMORY)
      const keepEntries = lines.slice(-MAX_IN_MEMORY)

      // Append old entries to archive
      fs.appendFileSync(archivePath, oldEntries.join('\n') + '\n', 'utf-8')

      // Rewrite main file with only recent entries
      fs.writeFileSync(filename, keepEntries.join('\n') + '\n', 'utf-8')

      console.log(`[Sessions] Archived ${oldEntries.length} entries, kept ${keepEntries.length}`)
    } catch (err) {
      console.error(`[Sessions] Prune failed for ${filename}:`, err.message)
    }
  }

  /**
   * Set the last run ID for a session
   * @param {string} key - Session key
   * @param {string} runId - Run ID
   */
  setLastRunId(key, runId) {
    const session = this.getSession(key)
    session.lastRunId = runId
  }

  /**
   * Get the last run ID for a session
   * @param {string} key - Session key
   * @returns {string|null} Last run ID
   */
  getLastRunId(key) {
    const session = this.getSession(key)
    return session.lastRunId
  }
}
