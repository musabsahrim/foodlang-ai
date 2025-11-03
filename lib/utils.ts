import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { LANGUAGE_DETECTION } from "./constants"
import type { Language } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Detect the primary language of a text string
 */
export function detectLanguage(text: string): Language {
  if (!text || text.trim().length === 0) return 'unknown'
  
  const arabicChars = Array.from(text).filter(char => {
    const code = char.charCodeAt(0)
    return code >= LANGUAGE_DETECTION.arabicRange[0] && code <= LANGUAGE_DETECTION.arabicRange[1]
  }).length
  
  const englishChars = Array.from(text).filter(char => 
    /[a-zA-Z]/.test(char)
  ).length
  
  const totalChars = arabicChars + englishChars
  
  if (totalChars === 0) return 'unknown'
  
  const arabicRatio = arabicChars / totalChars
  
  if (arabicRatio > LANGUAGE_DETECTION.threshold) return 'arabic'
  if (arabicRatio < (1 - LANGUAGE_DETECTION.threshold)) return 'english'
  return 'mixed'
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount)
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

/**
 * Format time duration in MM:SS format
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Validate image file type and size
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const maxSize = 10 * 1024 * 1024 // 10MB
  
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.' }
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File too large. Please upload an image smaller than 10MB.' }
  }
  
  return { valid: true }
}

/**
 * Validate Excel file for glossary upload
 */
export function validateGlossaryFile(file: File): { valid: boolean; error?: string } {
  const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
  const maxSize = 50 * 1024 * 1024 // 50MB
  
  if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx')) {
    return { valid: false, error: 'Invalid file type. Please upload an Excel (.xlsx) file.' }
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File too large. Please upload a file smaller than 50MB.' }
  }
  
  return { valid: true }
}

/**
 * Convert File to base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      // Remove data:image/jpeg;base64, prefix
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = error => reject(error)
  })
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

/**
 * Check if device has camera support
 */
export function hasCameraSupport(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
}

/**
 * Generate a random JWT secret (for development)
 */
export function generateJWTSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
