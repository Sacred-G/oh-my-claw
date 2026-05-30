/**
 * Platform-specific markdown formatting utilities
 * Converts LLM markdown output into platform-native formatting
 */

/**
 * Convert markdown to Telegram MarkdownV2 format
 * Telegram MarkdownV2 requires escaping special characters outside formatting
 */
export function formatForTelegram(text) {
  // First, handle code blocks (preserve them as-is)
  const codeBlocks = []
  let processed = text.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    codeBlocks.push({ lang, code: code.trim() })
    return `__CODEBLOCK_${codeBlocks.length - 1}__`
  })

  // Handle inline code (preserve)
  const inlineCodes = []
  processed = processed.replace(/`([^`]+)`/g, (_, code) => {
    inlineCodes.push(code)
    return `__INLINECODE_${inlineCodes.length - 1}__`
  })

  // Convert **bold** to *bold* (Telegram uses single asterisks for bold)
  processed = processed.replace(/\*\*(.+?)\*\*/g, '*$1*')

  // Convert __italic__ to _italic_ (already Telegram-compatible)
  // Note: _italic_ already works in Telegram

  // Strip markdown headers → just bold the text
  processed = processed.replace(/^#{1,6}\s+(.+)$/gm, '*$1*')

  // Convert markdown links [text](url) → text (url)
  processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')

  // Strip bullet point markers but keep content
  processed = processed.replace(/^[\s]*[-*+]\s+/gm, '• ')

  // Numbered lists are fine as-is

  // Restore code blocks
  processed = processed.replace(/__CODEBLOCK_(\d+)__/g, (_, i) => {
    const block = codeBlocks[parseInt(i)]
    return '```' + (block.lang || '') + '\n' + block.code + '\n```'
  })

  // Restore inline code
  processed = processed.replace(/__INLINECODE_(\d+)__/g, (_, i) => {
    return '`' + inlineCodes[parseInt(i)] + '`'
  })

  return processed
}

/**
 * Convert markdown to WhatsApp format
 * WhatsApp supports: *bold*, _italic_, ~strikethrough~, ```monospace```
 */
export function formatForWhatsApp(text) {
  // Handle code blocks (WhatsApp uses ``` without language specifier)
  let processed = text.replace(/```\w*\n?([\s\S]*?)```/g, '```$1```')

  // Handle inline code → WhatsApp doesn't have inline code, use ```
  // Actually WhatsApp does support single backticks for inline code in some clients
  // Leave `` `code` `` as-is

  // Convert **bold** to *bold*
  processed = processed.replace(/\*\*(.+?)\*\*/g, '*$1*')

  // Convert ~~strikethrough~~ to ~strikethrough~
  processed = processed.replace(/~~(.+?)~~/g, '~$1~')

  // Strip markdown headers → bold
  processed = processed.replace(/^#{1,6}\s+(.+)$/gm, '*$1*')

  // Convert markdown links [text](url) → text: url
  processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1: $2')

  // Convert bullet points
  processed = processed.replace(/^[\s]*[-*+]\s+/gm, '• ')

  return processed
}

/**
 * Convert markdown to plain text (for iMessage / Signal / fallback)
 */
export function formatForPlainText(text) {
  let processed = text

  // Strip code block markers
  processed = processed.replace(/```\w*\n?/g, '')

  // Strip inline code backticks
  processed = processed.replace(/`([^`]+)`/g, '$1')

  // Strip bold markers
  processed = processed.replace(/\*\*(.+?)\*\*/g, '$1')
  processed = processed.replace(/\*(.+?)\*/g, '$1')

  // Strip italic markers
  processed = processed.replace(/__(.+?)__/g, '$1')
  processed = processed.replace(/_(.+?)_/g, '$1')

  // Strip strikethrough
  processed = processed.replace(/~~(.+?)~~/g, '$1')

  // Strip headers
  processed = processed.replace(/^#{1,6}\s+(.+)$/gm, '$1')

  // Convert links
  processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')

  // Convert bullet points
  processed = processed.replace(/^[\s]*[-*+]\s+/gm, '• ')

  return processed
}

/**
 * Format text for a specific platform
 */
export function formatForPlatform(text, platform) {
  switch (platform) {
    case 'telegram':
      return formatForTelegram(text)
    case 'whatsapp':
      return formatForWhatsApp(text)
    case 'imessage':
    case 'signal':
    default:
      return formatForPlainText(text)
  }
}
