'use client'

import { useEffect, useState } from 'react'

interface Capture {
  id: string
  url: string
  screenshot_url?: string
  thumbnail_url?: string
  created_at: string
  datetime?: string
}

interface DebugInfo {
  hasSupabase: boolean
  supabaseType: string
  supabaseKeys: string[]
  envUrl: string | undefined
  envKey: string
  envUrlLength: number
  envKeyLength: number
  windowDefined: boolean
  userAgent: string
}

export const dynamic = 'force-dynamic'

export default function TestPage() {
  const [captures, setCaptures] = useState<Capture[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    hasSupabase: false,
    supabaseType: 'unknown',
    supabaseKeys: [],
    envUrl: undefined,
    envKey: 'NOT_SET',
    envUrlLength: 0,
    envKeyLength: 0,
    windowDefined: false,
    userAgent: 'N/A'
  })

  useEffect(() => {
    async function fetchCaptures() {
      try {
        const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        let supabase = null
        let supabaseType = 'unknown'
        let supabaseKeys: string[] = []
        
        try {
          const { supabase: supabaseClient } = await import('@/lib/supabase')
          supabase = supabaseClient
          supabaseType = typeof supabase
          supabaseKeys = supabase ? Object.keys(supabase) : []
        } catch (importError) {
          console.error('Failed to import supabase:', importError)
        }

        const debug: DebugInfo = {
          hasSupabase: !!supabase,
          supabaseType: supabaseType,
          supabaseKeys: supabaseKeys,
          envUrl: envUrl,
          envKey: envKey ? 'SET' : 'NOT_SET',
          envUrlLength: envUrl?.length || 0,
          envKeyLength: envKey?.length || 0,
          windowDefined: typeof window !== 'undefined',
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'
        }
        
        setDebugInfo(debug)

        if (!supabase) {
          setError('Supabase client not initialized')
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('captures')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10)

        if (error) {
          setError(error.message)
        } else {
          setCaptures(data || [])
        }
      } catch (err) {
        setError('Failed to fetch captures')
      } finally {
        setLoading(false)
      }
    }

    fetchCaptures()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">BRAIN DB - Test Page</h1>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-yellow-800 mb-4">Debug Information</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Supabase Client:</strong> {debugInfo.hasSupabase ? '✅ Available' : '❌ Not Available'}</p>
            <p><strong>Supabase Type:</strong> {debugInfo.supabaseType}</p>
            <p><strong>Environment URL:</strong> {debugInfo.envUrl ? '✅ Set' : '❌ Not Set'}</p>
            <p><strong>Environment Key:</strong> {debugInfo.envKey}</p>
            <p><strong>URL Length:</strong> {debugInfo.envUrlLength}</p>
            <p><strong>Key Length:</strong> {debugInfo.envKeyLength}</p>
            <p><strong>Window Defined:</strong> {debugInfo.windowDefined ? '✅ Yes' : '❌ No'}</p>
            <p><strong>User Agent:</strong> {debugInfo.userAgent.substring(0, 50)}...</p>
            <p><strong>Loading:</strong> {loading ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Error:</strong> {error || 'None'}</p>
          </div>
        </div>

        {loading && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <p className="text-gray-600">Loading captures...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Supabase Connection Test</h2>
            <p className="text-green-600 font-medium">✅ Connected successfully!</p>
            <p className="text-gray-600 mt-2">Found {captures.length} captures in database</p>
          </div>
        )}

        {captures.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Captures ({captures.length})</h2>
            <div className="space-y-4">
              {captures.map((capture) => (
                <div key={capture.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">Capture {capture.id}</h3>
                    <span className="text-sm text-gray-500">
                      {new Date(capture.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">
                    <strong>URL:</strong> {capture.url}
                  </p>
                  {capture.screenshot_url && (
                    <p className="text-gray-600 text-sm mb-2">
                      <strong>Screenshot:</strong> {capture.screenshot_url}
                    </p>
                  )}
                  {capture.thumbnail_url && (
                    <p className="text-gray-600 text-sm">
                      <strong>Thumbnail:</strong> {capture.thumbnail_url}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Raw Data</h2>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
            {JSON.stringify(captures, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
} 