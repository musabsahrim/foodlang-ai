export const APP_CONFIG = {
  name: 'FoodLang AI',
  description: 'Arabic ↔ English Food Packaging Translator',
  version: '1.0.0',
  author: 'FoodLang AI Team',
} as const

export const API_CONFIG = {
  baseUrl: typeof window !== 'undefined' 
    ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:8000'
      : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 30000, // 30 seconds
} as const

export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp'
] as const

export const SUPPORTED_GLOSSARY_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
] as const

export const MAX_FILE_SIZE = {
  image: 10 * 1024 * 1024, // 10MB
  glossary: 50 * 1024 * 1024, // 50MB
} as const

export const CAMERA_CONFIG = {
  width: { ideal: 1280 },
  height: { ideal: 720 },
  facingMode: 'environment', // Back camera on mobile
} as const

export const SESSION_CONFIG = {
  duration: 30 * 60, // 30 minutes in seconds
  warningThreshold: 5 * 60, // 5 minutes warning
} as const

export const COST_CONFIG = {
  embedding: {
    model: 'text-embedding-3-small',
    pricePerMillion: 0.02,
  },
  completion: {
    model: 'gpt-4o-mini',
    pricePerMillion: 0.15,
  },
  vision: {
    model: 'gpt-4-vision-preview',
    pricePerImage: 0.01,
  },
} as const

export const LANGUAGE_DETECTION = {
  arabicRange: [0x0600, 0x06FF], // Arabic Unicode range
  threshold: 0.7, // 70% Arabic characters to detect as Arabic
} as const

export const UI_CONFIG = {
  toastDuration: 3000, // 3 seconds
  skeletonDelay: 200, // 200ms before showing skeleton
  debounceDelay: 300, // 300ms for input debouncing
} as const