"use client"

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

export function ConnectionStatus() {
  const {
    connectionState,
    setConnectionState,
    setOnlineState,
    attemptReconnection,
  } = useAppStore()
  
  const [isReconnecting, setIsReconnecting] = useState(false)

  useEffect(() => {
    // Monitor online/offline status
    const handleOnline = () => {
      setOnlineState(true)
      if (!connectionState.isConnected) {
        handleReconnect()
      }
    }

    const handleOffline = () => {
      setOnlineState(false)
      setConnectionState(false)
      toast.error('You are offline. Some features may not work.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Start health monitoring
    api.startHealthMonitoring((healthy) => {
      setConnectionState(healthy)
      if (!healthy) {
        toast.error('Connection to server lost. Attempting to reconnect...')
      } else {
        toast.success('Connection restored!')
      }
    })

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      api.stopHealthMonitoring()
    }
  }, [setConnectionState, setOnlineState, connectionState.isConnected])

  const handleReconnect = async () => {
    if (isReconnecting) return
    
    setIsReconnecting(true)
    try {
      const success = await attemptReconnection()
      if (success) {
        toast.success('Reconnected successfully!')
      } else {
        toast.error('Reconnection failed. Please try again.')
      }
    } catch (error) {
      toast.error('Reconnection failed. Please check your connection.')
    } finally {
      setIsReconnecting(false)
    }
  }

  // Don't show anything if everything is working fine
  if (connectionState.isOnline && connectionState.isConnected) {
    return null
  }

  const getStatusInfo = () => {
    if (!connectionState.isOnline) {
      return {
        icon: WifiOff,
        text: 'Offline',
        variant: 'destructive' as const,
        description: 'No internet connection'
      }
    }
    
    if (!connectionState.isConnected) {
      return {
        icon: AlertTriangle,
        text: 'Disconnected',
        variant: 'destructive' as const,
        description: `Server unreachable (${connectionState.reconnectAttempts}/${connectionState.maxReconnectAttempts} attempts)`
      }
    }

    return {
      icon: Wifi,
      text: 'Connected',
      variant: 'default' as const,
      description: 'All systems operational'
    }
  }

  const statusInfo = getStatusInfo()
  const Icon = statusInfo.icon

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-background border rounded-lg shadow-lg p-3 max-w-sm">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-4 w-4" />
          <Badge variant={statusInfo.variant}>
            {statusInfo.text}
          </Badge>
        </div>
        
        <p className="text-sm text-muted-foreground mb-3">
          {statusInfo.description}
        </p>
        
        {!connectionState.isConnected && connectionState.isOnline && (
          <Button
            size="sm"
            onClick={handleReconnect}
            disabled={isReconnecting || connectionState.reconnectAttempts >= connectionState.maxReconnectAttempts}
            className="w-full"
          >
            {isReconnecting ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Reconnecting...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry Connection
              </>
            )}
          </Button>
        )}
        
        {connectionState.reconnectAttempts >= connectionState.maxReconnectAttempts && (
          <p className="text-xs text-muted-foreground mt-2">
            Max retry attempts reached. Please refresh the page.
          </p>
        )}
      </div>
    </div>
  )
}