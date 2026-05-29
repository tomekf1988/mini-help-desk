import { useState, useRef, useEffect, useCallback } from 'react'

interface UseStreamingSummaryResult {
  summary: string
  isStreaming: boolean
  error: string | null
  start: () => void
  stop: () => void
}

export default function useStreamingSummary(ticketId: number | string): UseStreamingSummaryResult {
  const [summary, setSummary] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const esRef = useRef<EventSource | null>(null)

  const stop = useCallback(() => {
    if (esRef.current) {
      esRef.current.close()
      esRef.current = null
    }
    setIsStreaming(false)
  }, [])

  const start = useCallback(() => {
    // Guard on esRef.current, not stale isStreaming state
    if (esRef.current) return

    setSummary('')
    setError(null)
    setIsStreaming(true)

    const url = `/api/tickets/${ticketId}/summary/stream`
    const es = new EventSource(url)
    esRef.current = es

    es.onmessage = (event: MessageEvent) => {
      if (event.data === '[DONE]') {
        es.close()
        esRef.current = null
        setIsStreaming(false)
        return
      }
      if (event.data === '[ERROR]') {
        setError('Failed to generate summary. Please try again.')
        es.close()
        esRef.current = null
        setIsStreaming(false)
        return
      }
      setSummary(prev => prev + event.data)
    }

    es.onerror = () => {
      setError('Failed to generate summary. Please try again.')
      es.close()
      esRef.current = null
      setIsStreaming(false)
    }
  }, [ticketId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (esRef.current) {
        esRef.current.close()
        esRef.current = null
      }
    }
  }, [])

  return { summary, isStreaming, error, start, stop }
}