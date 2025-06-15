// src/components/debug/OAuth-Session-Debug.tsx - FOR PRODUCTION DEBUGGING
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function OAuthSessionDebug() {
  const [logs, setLogs] = useState<string[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [sessionData, setSessionData] = useState<any>(null)
  const searchParams = useSearchParams()

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `${timestamp}: ${message}`
    setLogs(prev => [...prev.slice(-9), logMessage])
    console.log(`🔍 OAuth Debug: ${logMessage}`)
  }

  // Check for OAuth callback parameters
  useEffect(() => {
    const params = {
      code: searchParams.get('code'),
      error: searchParams.get('error'),
      error_description: searchParams.get('error_description'),
      state: searchParams.get('state'),
      redirect_to: searchParams.get('redirect_to')
    }

    if (params.code) {
      addLog(`OAuth code received: ${params.code.substring(0, 10)}...`)
    }
    if (params.error) {
      addLog(`OAuth error: ${params.error} - ${params.error_description}`)
    }
    if (params.redirect_to) {
      addLog(`Redirect target: ${params.redirect_to}`)
    }

    // Auto-show debugger if we have OAuth parameters
    if (params.code || params.error) {
      setIsVisible(true)
      addLog('OAuth callback detected - showing debugger')
    }
  }, [searchParams])

  const checkSession = async () => {
    try {
      addLog('Checking current session...')
      const supabase = createClient()
      
      if (!supabase) {
        addLog('❌ No Supabase client available')
        return
      }

      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        addLog(`❌ Session check error: ${error.message}`)
        return
      }

      if (session) {
        addLog(`✅ Active session found for: ${session.user.email}`)
        setSessionData({
          user_id: session.user.id.substring(0, 8) + '...',
          email: session.user.email,
          provider: session.user.app_metadata?.provider,
          expires_at: new Date(session.expires_at! * 1000).toLocaleString(),
          access_token: session.access_token.substring(0, 20) + '...',
          refresh_token: session.refresh_token?.substring(0, 20) + '...'
        })
      } else {
        addLog('❌ No active session found')
        setSessionData(null)
      }
    } catch (err: any) {
      addLog(`❌ Session check failed: ${err.message}`)
    }
  }

  const testOAuthCallback = async () => {
    try {
      addLog('Testing OAuth callback endpoint...')
      
      const response = await fetch('/api/auth/callback', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })

      addLog(`OAuth callback response: ${response.status} ${response.statusText}`)
      
      if (!response.ok) {
        const text = await response.text()
        addLog(`OAuth callback error: ${text}`)
      } else {
        addLog('✅ OAuth callback endpoint accessible')
      }
    } catch (err: any) {
      addLog(`❌ OAuth callback test failed: ${err.message}`)
    }
  }

  const manualOAuthFlow = async () => {
    try {
      addLog('Starting manual OAuth flow...')
      const supabase = createClient()
      
      if (!supabase) {
        addLog('❌ No Supabase client available');
        return;
      }
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })

      if (error) {
        addLog(`❌ OAuth initiation failed: ${error.message}`)
      } else {
        addLog('✅ OAuth flow initiated successfully')
      }
    } catch (err: any) {
      addLog(`❌ Manual OAuth failed: ${err.message}`)
    }
  }

  const clearLogs = () => {
    setLogs([])
    setSessionData(null)
    addLog('Logs cleared')
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-red-700 text-sm font-medium"
        >
          🔍 OAuth Debug
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 w-96 bg-white border border-gray-300 rounded-lg shadow-xl max-h-96 overflow-hidden">
      {/* Header */}
      <div className="bg-red-600 text-white px-4 py-2 rounded-t-lg flex justify-between items-center">
        <h3 className="font-medium">OAuth Session Debug</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-white hover:text-gray-200"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto max-h-80">
        {/* Current URL */}
        <div className="mb-3 p-2 bg-gray-50 rounded text-xs">
          <strong>Current URL:</strong><br />
          {window.location.href}
        </div>

        {/* Session Info */}
        {sessionData && (
          <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded">
            <h4 className="font-medium text-sm mb-2 text-green-800">Active Session</h4>
            <div className="text-xs text-green-700 space-y-1">
              <div><strong>Email:</strong> {sessionData.email}</div>
              <div><strong>Provider:</strong> {sessionData.provider}</div>
              <div><strong>Expires:</strong> {sessionData.expires_at}</div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-3 space-y-2">
          <button
            onClick={checkSession}
            className="w-full bg-blue-100 text-blue-800 px-3 py-2 rounded text-sm hover:bg-blue-200"
          >
            Check Session
          </button>
          <button
            onClick={testOAuthCallback}
            className="w-full bg-purple-100 text-purple-800 px-3 py-2 rounded text-sm hover:bg-purple-200"
          >
            Test OAuth Callback
          </button>
          <button
            onClick={manualOAuthFlow}
            className="w-full bg-green-100 text-green-800 px-3 py-2 rounded text-sm hover:bg-green-200"
          >
            Start OAuth Flow
          </button>
          <button
            onClick={clearLogs}
            className="w-full bg-gray-100 text-gray-800 px-3 py-2 rounded text-sm hover:bg-gray-200"
          >
            Clear Logs
          </button>
        </div>

        {/* Debug Logs */}
        <div>
          <h4 className="font-medium text-sm mb-2">Debug Logs</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto bg-gray-900 text-green-400 p-2 rounded text-xs font-mono">
            {logs.length === 0 ? (
              <p>No logs yet...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}