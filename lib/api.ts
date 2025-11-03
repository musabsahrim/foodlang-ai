const API_BASE_URL = (() => {
  // Server-side rendering
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  }
  
  // Client-side
  const isLocalhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1'
  
  if (isLocalhost) {
    return 'http://localhost:8000'
  }
  
  // Production - use environment variable or fallback
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
})()

// Connection configuration
const CONNECTION_CONFIG = {
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  healthCheckInterval: 60000, // 1 minute
}

export interface TranslationResponse {
  translated_text: string
  detected_language: 'arabic' | 'english'
  tokens_used: number
  cost_estimate: number
}

export interface OCRResponse {
  extracted_text: string
  translated_text: string
  detected_language: 'arabic' | 'english'
  tokens_used: number
  cost_estimate: number
}

export interface LoginResponse {
  token: string
  expires_at: string
}

export interface GlossaryInfo {
  total_entries: number
  last_updated: string
  file_size: string
}

export interface CostBreakdown {
  embedding_tokens: number
  completion_tokens: number
  embedding_cost: number
  completion_cost: number
  total_cost: number
}

class APIError extends Error {
  constructor(public status: number, message: string, public isNetworkError: boolean = false) {
    super(message)
    this.name = 'APIError'
  }
}

class ConnectionManager {
  private static instance: ConnectionManager
  private healthCheckInterval: NodeJS.Timeout | null = null
  private isHealthy = true
  
  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager()
    }
    return ConnectionManager.instance
  }
  
  startHealthCheck(onStatusChange?: (healthy: boolean) => void) {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }
    
    this.healthCheckInterval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        })
        
        const wasHealthy = this.isHealthy
        this.isHealthy = response.ok
        
        if (wasHealthy !== this.isHealthy && onStatusChange) {
          onStatusChange(this.isHealthy)
        }
      } catch (error) {
        const wasHealthy = this.isHealthy
        this.isHealthy = false
        
        if (wasHealthy && onStatusChange) {
          onStatusChange(false)
        }
      }
    }, CONNECTION_CONFIG.healthCheckInterval)
  }
  
  stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }
  }
  
  getHealthStatus(): boolean {
    return this.isHealthy
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function apiRequestWithRetry<T>(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), CONNECTION_CONFIG.timeout)
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      
      // Don't retry client errors (4xx), only server errors (5xx) and network errors
      if (response.status >= 400 && response.status < 500) {
        throw new APIError(
          response.status,
          errorData.detail || `HTTP ${response.status}: ${response.statusText}`
        )
      }
      
      // Retry server errors
      if (retryCount < CONNECTION_CONFIG.retryAttempts) {
        await sleep(CONNECTION_CONFIG.retryDelay * Math.pow(2, retryCount))
        return apiRequestWithRetry(endpoint, options, retryCount + 1)
      }
      
      throw new APIError(
        response.status,
        errorData.detail || `HTTP ${response.status}: ${response.statusText}`
      )
    }

    return response.json()
  } catch (error) {
    // Handle network errors and timeouts
    if (error instanceof DOMException && error.name === 'AbortError') {
      if (retryCount < CONNECTION_CONFIG.retryAttempts) {
        await sleep(CONNECTION_CONFIG.retryDelay * Math.pow(2, retryCount))
        return apiRequestWithRetry(endpoint, options, retryCount + 1)
      }
      throw new APIError(408, 'Request timeout', true)
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      if (retryCount < CONNECTION_CONFIG.retryAttempts) {
        await sleep(CONNECTION_CONFIG.retryDelay * Math.pow(2, retryCount))
        return apiRequestWithRetry(endpoint, options, retryCount + 1)
      }
      throw new APIError(0, 'Network error - please check your connection', true)
    }
    
    throw error
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  return apiRequestWithRetry<T>(endpoint, options)
}

export const api = {
  baseURL: API_BASE_URL,
  connectionManager: ConnectionManager.getInstance(),
  
  // Translation
  translate: async (text: string): Promise<TranslationResponse> => {
    return apiRequest('/api/translate', {
      method: 'POST',
      body: JSON.stringify({ text }),
    })
  },

  // OCR with retry logic
  ocr: async (file: File, method: 'gpt-vision' | 'tesseract' = 'gpt-vision'): Promise<OCRResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('ocr_method', method)

    return apiRequestWithRetry('/api/ocr', {
      method: 'POST',
      body: formData,
      headers: {}, // Don't set Content-Type for FormData
    })
  },

  // Admin authentication
  login: async (username: string, password: string): Promise<LoginResponse> => {
    return apiRequest('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
  },

  // Admin endpoints (require authentication)
  admin: {
    getGlossaryInfo: async (token: string): Promise<GlossaryInfo> => {
      return apiRequest('/api/admin/glossary', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    },

    uploadGlossary: async (token: string, file: File): Promise<{ success: boolean; message: string }> => {
      const formData = new FormData()
      formData.append('file', file)

      return apiRequestWithRetry('/api/admin/glossary/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })
    },

    getCostBreakdown: async (token: string): Promise<CostBreakdown> => {
      return apiRequest('/api/admin/cost', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    },

    getUpdateHistory: async (token: string): Promise<any[]> => {
      return apiRequest('/api/admin/history', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    },

    getUsageStatistics: async (token: string): Promise<{
      total_requests: number
      total_cost: number
      total_tokens: number
      endpoint_breakdown: Record<string, { requests: number; cost: number; tokens: number }>
      recent_logs: any[]
      current_session: any
    }> => {
      return apiRequest('/api/admin/usage', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    },

    getMonitoringData: async (token: string): Promise<{
      timestamp: string
      system: any
      application: any
      rate_limiting: any
      recent_errors: string[]
      health_status: string
    }> => {
      return apiRequest('/api/admin/monitoring', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    },
  },

  // Enhanced health check
  health: async (): Promise<{
    status: string
    service: string
    version: string
    timestamp: string
    uptime_hours: number
    glossary: any
    services: any
    ocr_methods: any
    system: any
    session_stats: any
  }> => {
    return apiRequest('/api/health')
  },

  // Cost tracking
  getSessionCost: async (): Promise<{
    session_cost: number
    total_calls: number
    embedding_tokens: number
    completion_tokens: number
  }> => {
    return apiRequest('/api/cost')
  },

  // Connection utilities
  startHealthMonitoring: (onStatusChange?: (healthy: boolean) => void) => {
    api.connectionManager.startHealthCheck(onStatusChange)
  },

  stopHealthMonitoring: () => {
    api.connectionManager.stopHealthCheck()
  },

  getConnectionStatus: (): boolean => {
    return api.connectionManager.getHealthStatus()
  },
}

export { APIError, ConnectionManager }