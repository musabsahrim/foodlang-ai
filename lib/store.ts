import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface CostTracker {
  sessionCost: number
  totalCalls: number
  embeddingTokens: number
  completionTokens: number
}

interface ConnectionState {
  isOnline: boolean
  isConnected: boolean
  lastConnected: Date | null
  reconnectAttempts: number
  maxReconnectAttempts: number
}

interface SessionState {
  sessionId: string
  startTime: Date
  lastActivity: Date
  isActive: boolean
}

interface AppState {
  costTracker: CostTracker
  connectionState: ConnectionState
  sessionState: SessionState
  
  // Cost tracking methods
  updateCost: (cost: number, tokens: number, embeddingTokens?: number) => void
  resetSession: () => void
  loadCostFromBackend: () => Promise<void>
  
  // Connection management methods
  setConnectionState: (connected: boolean) => void
  setOnlineState: (online: boolean) => void
  incrementReconnectAttempts: () => void
  resetReconnectAttempts: () => void
  
  // Session management methods
  initializeSession: () => void
  updateLastActivity: () => void
  setSessionActive: (active: boolean) => void
  
  // Recovery methods
  handleConnectionError: () => void
  attemptReconnection: () => Promise<boolean>
}

const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      costTracker: {
        sessionCost: 0,
        totalCalls: 0,
        embeddingTokens: 0,
        completionTokens: 0,
      },
      
      connectionState: {
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
        isConnected: true,
        lastConnected: new Date(),
        reconnectAttempts: 0,
        maxReconnectAttempts: 5,
      },
      
      sessionState: {
        sessionId: generateSessionId(),
        startTime: new Date(),
        lastActivity: new Date(),
        isActive: true,
      },
      
      // Cost tracking methods
      updateCost: (cost: number, tokens: number, embeddingTokens = 0) => {
        set((state) => ({
          costTracker: {
            ...state.costTracker,
            sessionCost: state.costTracker.sessionCost + cost,
            totalCalls: state.costTracker.totalCalls + 1,
            completionTokens: state.costTracker.completionTokens + tokens,
            embeddingTokens: state.costTracker.embeddingTokens + embeddingTokens,
          },
        }))
        get().updateLastActivity()
      },
      
      resetSession: () => {
        set({
          costTracker: {
            sessionCost: 0,
            totalCalls: 0,
            embeddingTokens: 0,
            completionTokens: 0,
          },
          sessionState: {
            sessionId: generateSessionId(),
            startTime: new Date(),
            lastActivity: new Date(),
            isActive: true,
          },
        })
      },
      
      loadCostFromBackend: async () => {
        try {
          const { api } = await import('./api')
          const backendCost = await api.getSessionCost()
          set({
            costTracker: {
              sessionCost: backendCost.session_cost,
              totalCalls: backendCost.total_calls,
              embeddingTokens: backendCost.embedding_tokens,
              completionTokens: backendCost.completion_tokens,
            },
          })
          get().setConnectionState(true)
          get().resetReconnectAttempts()
        } catch (error) {
          console.error('Failed to load cost from backend:', error)
          get().handleConnectionError()
        }
      },
      
      // Connection management methods
      setConnectionState: (connected: boolean) =>
        set((state) => ({
          connectionState: {
            ...state.connectionState,
            isConnected: connected,
            lastConnected: connected ? new Date() : state.connectionState.lastConnected,
          },
        })),
      
      setOnlineState: (online: boolean) =>
        set((state) => ({
          connectionState: {
            ...state.connectionState,
            isOnline: online,
          },
        })),
      
      incrementReconnectAttempts: () =>
        set((state) => ({
          connectionState: {
            ...state.connectionState,
            reconnectAttempts: state.connectionState.reconnectAttempts + 1,
          },
        })),
      
      resetReconnectAttempts: () =>
        set((state) => ({
          connectionState: {
            ...state.connectionState,
            reconnectAttempts: 0,
          },
        })),
      
      // Session management methods
      initializeSession: () => {
        set((state) => ({
          sessionState: {
            ...state.sessionState,
            sessionId: generateSessionId(),
            startTime: new Date(),
            lastActivity: new Date(),
            isActive: true,
          },
        }))
      },
      
      updateLastActivity: () =>
        set((state) => ({
          sessionState: {
            ...state.sessionState,
            lastActivity: new Date(),
          },
        })),
      
      setSessionActive: (active: boolean) =>
        set((state) => ({
          sessionState: {
            ...state.sessionState,
            isActive: active,
          },
        })),
      
      // Recovery methods
      handleConnectionError: () => {
        const state = get()
        if (state.connectionState.reconnectAttempts < state.connectionState.maxReconnectAttempts) {
          get().setConnectionState(false)
          get().incrementReconnectAttempts()
          
          // Attempt reconnection after a delay
          setTimeout(() => {
            get().attemptReconnection()
          }, Math.min(1000 * Math.pow(2, state.connectionState.reconnectAttempts), 30000))
        } else {
          console.error('Max reconnection attempts reached')
          get().setConnectionState(false)
        }
      },
      
      attemptReconnection: async (): Promise<boolean> => {
        try {
          const { api } = await import('./api')
          
          // Test connection with health check
          const response = await fetch(`${api.baseURL}/api/health`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(5000), // 5 second timeout
          })
          
          if (response.ok) {
            get().setConnectionState(true)
            get().resetReconnectAttempts()
            console.log('Reconnection successful')
            
            // Reload cost data from backend
            await get().loadCostFromBackend()
            return true
          } else {
            throw new Error(`Health check failed: ${response.status}`)
          }
        } catch (error) {
          console.error('Reconnection failed:', error)
          get().handleConnectionError()
          return false
        }
      },
    }),
    {
      name: 'foodlang-ai-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist cost tracker and session state, not connection state
        costTracker: state.costTracker,
        sessionState: state.sessionState,
      }),
    }
  )
)