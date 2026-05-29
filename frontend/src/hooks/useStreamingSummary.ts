import { useState, useRef, useEffect, useCallback } from 'react'

interface UseStreamingSummaryResult {
  summary: string
  isStreaming: boolean
  error: string | null
  start: () => void
  stop: () => void
}

// Characters displayed per interval tick (one char per 20ms ≈ 50 chars/sec)
const DRAIN_INTERVAL_MS = 20

export default function useStreamingSummary(ticketId: number | string): UseStreamingSummaryResult {
  const [summary, setSummary] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  // Characters buffered from network, waiting to be displayed
  const queueRef = useRef<string[]>([])
  // True once the fetch stream has finished sending all tokens
  const fetchDoneRef = useRef(false)
  const drainRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopDrain = useCallback(() => {
    if (drainRef.current !== null) {
      clearInterval(drainRef.current)
      drainRef.current = null
    }
  }, [])

  const startDrain = useCallback(() => {
    if (drainRef.current !== null) return
    drainRef.current = setInterval(() => {
      if (queueRef.current.length > 0) {
        const char = queueRef.current.shift()!  // shift BEFORE the updater — must not be a side-effect inside setSummary
        setSummary(prev => prev + char)
      } else if (fetchDoneRef.current) {
        // Queue exhausted and fetch is done — stop cursor, finish animation
        stopDrain()
        abortRef.current = null
        setIsStreaming(false)
      }
    }, DRAIN_INTERVAL_MS)
  }, [stopDrain])

  const stop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    stopDrain()
    queueRef.current = []
    setIsStreaming(false)
  }, [stopDrain])

  const start = useCallback(() => {
    // Guard on abortRef.current, not stale isStreaming state
    if (abortRef.current) return

    setSummary('')
    setError(null)
    setIsStreaming(true)
    queueRef.current = []
    fetchDoneRef.current = false

    const controller = new AbortController()
    abortRef.current = controller

    const run = async () => {
      try {
        const response = await fetch(`/api/tickets/${ticketId}/summary/stream`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          setError('Failed to generate summary. Please try again.')
          abortRef.current = null
          setIsStreaming(false)
          return
        }

        if (!response.body) {
          setError('No response stream available.')
          abortRef.current = null
          setIsStreaming(false)
          return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        startDrain()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          // Split on SSE event boundaries (\n\n), keep incomplete tail in buffer
          const events = buffer.split('\n\n')
          buffer = events.pop() ?? ''

          for (const event of events) {
            for (const line of event.split('\n')) {
              if (!line.startsWith('data: ')) continue
              const data = line.slice(6)

              if (data === '[DONE]') {
                // Signal drain to finish; setIsStreaming(false) happens after queue empties
                fetchDoneRef.current = true
                return
              }
              if (data === '[ERROR]') {
                setError('Failed to generate summary. Please try again.')
                fetchDoneRef.current = true
                stopDrain()
                queueRef.current = []
                abortRef.current = null
                setIsStreaming(false)
                return
              }
              // Enqueue each character so the drain reveals them one by one
              for (const char of data) {
                queueRef.current.push(char)
              }
            }
          }
        }

        // Stream closed without [DONE]
        fetchDoneRef.current = true
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError('Failed to generate summary. Please try again.')
        stopDrain()
        queueRef.current = []
        abortRef.current = null
        setIsStreaming(false)
      }
    }

    run()
  }, [ticketId, startDrain, stopDrain])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort()
        abortRef.current = null
      }
      stopDrain()
    }
  }, [stopDrain])

  return { summary, isStreaming, error, start, stop }
}
