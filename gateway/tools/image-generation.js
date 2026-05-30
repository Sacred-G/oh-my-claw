import OpenAI from 'openai'
import { saveUpload } from './uploads.js'

const DEFAULT_MODEL = 'gpt-image-1.5'
const DEFAULT_SIZE = '1024x1024'
const DEFAULT_QUALITY = 'auto'

const ALLOWED_SIZES = new Set(['auto', '1024x1024', '1024x1536', '1536x1024'])
const ALLOWED_QUALITIES = new Set(['auto', 'low', 'medium', 'high'])

function normalizeOption(value, allowed, fallback, name) {
  if (!value) return fallback
  if (allowed.has(value)) return value
  throw new Error(`Invalid ${name}: ${value}`)
}

function extractImageBase64(response) {
  const image = response?.data?.[0]
  if (!image) return null
  if (image.b64_json) return image.b64_json
  if (typeof image === 'string') return image
  return null
}

export async function generateImage({
  prompt,
  size = DEFAULT_SIZE,
  quality = DEFAULT_QUALITY,
  platform = 'generated',
  chatId = 'generated'
}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required to generate images')
  }
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    throw new Error('Image prompt is required')
  }

  const model = process.env.OPENAI_IMAGE_MODEL || DEFAULT_MODEL
  const normalizedSize = normalizeOption(size, ALLOWED_SIZES, DEFAULT_SIZE, 'size')
  const normalizedQuality = normalizeOption(quality, ALLOWED_QUALITIES, DEFAULT_QUALITY, 'quality')

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const response = await openai.images.generate({
    model,
    prompt: prompt.trim(),
    size: normalizedSize,
    quality: normalizedQuality,
    n: 1
  })

  const b64Data = extractImageBase64(response)
  if (!b64Data) {
    throw new Error('No image data returned from OpenAI')
  }

  const buffer = Buffer.from(b64Data, 'base64')
  const file = saveUpload({
    buffer,
    fileName: `generated_${Date.now()}.png`,
    mimeType: 'image/png',
    platform,
    chatId
  })

  return {
    success: true,
    model,
    prompt: prompt.trim(),
    size: normalizedSize,
    quality: normalizedQuality,
    file_path: file.path,
    file_name: file.name,
    mime_type: file.mimetype,
    bytes: file.size
  }
}
