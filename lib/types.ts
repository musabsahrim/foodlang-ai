export type Language = 'arabic' | 'english' | 'mixed' | 'unknown'

export interface TranslationResult {
  translatedText: string
  detectedLanguage: Language
  cost: number
  tokensUsed: number
}

export interface OCRResult {
  extractedText: string
  translatedText: string
  detectedLanguage: Language
  cost: number
  tokensUsed: number
}

export interface AdminState {
  isAuthenticated: boolean
  token: string | null
  username: string
  expiresAt: string | null
}

export interface GlossaryStats {
  totalEntries: number
  lastUpdated: string
  fileSize: string
}

export interface UpdateHistoryEntry {
  id: number
  date: string
  entries: number
  updatedBy: string
  action: string
}

export interface ValidationResult {
  valid: boolean
  entries?: number
  preview?: Array<{ english: string; arabic: string }>
  error?: string
}

export interface CostBreakdown {
  embeddingTokens: number
  completionTokens: number
  embeddingCost: number
  completionCost: number
  totalCost: number
}

export type OCRMethod = 'gpt4' | 'tesseract'

export type TabValue = 'text' | 'upload' | 'camera' | 'admin'