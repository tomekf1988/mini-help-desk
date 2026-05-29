import { useEffect, useRef, useState } from 'react'
import type { ChatMessage, CreatedTicket } from '../types'

interface SSEEvent {
  type: 'thinking' | 'message' | 'tool_call' | 'ticket_created' | 'tasks_updated' | 'search_results' | 'done' | 'error'
  content: string
}

const SESSION_KEY = 'chat_messages'

function loadPersistedMessages(): ChatMessage[] {
  try {
    const saved = sessionStorage.getItem(SESSION_KEY)
    return saved ? (JSON.parse(saved) as ChatMessage[]) : []
  } catch {
    return []
  }
}

export function useChat(onTasksUpdated: () => void) {
  const [messages, setMessages] = useState<ChatMessage[]>(loadPersistedMessages)
  const [isStreaming, setIsStreaming] = useState(false)
  const [activeToolCall, setActiveToolCall] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  // Ref kept in sync with messages so sendMessage always reads current history,
  // avoiding stale closure when called on rapid successive sends.
  const messagesRef = useRef<ChatMessage[]>([])

  useEffect(() => {
    messagesRef.current = messages
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages))
  }, [messages])

  function appendToLastAssistantMessage(token: string) {
    setMessages((prev) => {
      const updated = [...prev]
      const last = updated[updated.length - 1]
      if (last && last.role === 'assistant') {
        updated[updated.length - 1] = { ...last, content: last.content + token }
      }
      return updated
    })
  }

  function sendMessage(text: string) {
    if (abortRef.current) return

    const userMessage: ChatMessage = { role: 'user', content: text }
    // Send only role+content to backend — strip extra UI fields and skip empty messages
    const historyWithNewMessage = [
      ...messagesRef.current.map(({ role, content }) => ({ role, content })),
      { role: 'user' as const, content: text },
    ]

    setMessages((prev) => [
      ...prev,
      userMessage,
      { role: 'assistant', content: '' },
    ])
    setIsStreaming(true)
    setActiveToolCall(null)

    const controller = new AbortController()
    abortRef.current = controller

    void streamChat(historyWithNewMessage, controller)
  }

  async function streamChat(history: ChatMessage[], controller: AbortController) {
    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Split on double newline to extract complete SSE frames
        const frames = buffer.split('\n\n')
        // Keep the last (potentially incomplete) frame in the buffer
        buffer = frames.pop() ?? ''

        for (const frame of frames) {
          const dataLine = frame
            .split('\n')
            .find((line) => line.startsWith('data: '))
          if (!dataLine) continue

          const jsonStr = dataLine.slice('data: '.length)
          let event: SSEEvent
          try {
            event = JSON.parse(jsonStr) as SSEEvent
          } catch {
            continue
          }

          handleEvent(event)
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
      const message = err instanceof Error ? err.message : 'Unknown error'
      appendToLastAssistantMessage(`Error: ${message}`)
    } finally {
      // Reset streaming state if the stream ended without a done/error event
      // (e.g. backend timeout, connection drop, or AbortError path)
      if (abortRef.current === controller) {
        setIsStreaming(false)
        abortRef.current = null
      }
    }
  }

  function handleEvent(event: SSEEvent) {
    switch (event.type) {
      case 'thinking':
        // "Thinking..." is already shown via the empty assistant bubble while isStreaming=true.
        // This event is intentionally a no-op here.
        break
      case 'message':
        appendToLastAssistantMessage(event.content)
        break
      case 'tool_call':
        setActiveToolCall(event.content)
        break
      case 'ticket_created':
        try {
          const ticket = JSON.parse(event.content) as CreatedTicket
          setMessages((prev) => {
            const updated = [...prev]
            const last = updated[updated.length - 1]
            if (last && last.role === 'assistant') {
              // Summary text goes into history for multi-turn context
              updated[updated.length - 1] = {
                ...last,
                content: `Created ticket: "${ticket.title}"`,
                ticket,
              }
            }
            return updated
          })
        } catch {
          // skip malformed JSON
        }
        break
      case 'search_results':
        try {
          const results = JSON.parse(event.content) as CreatedTicket[]
          const summary =
            results.length > 0
              ? `Found ${results.length} ticket${results.length > 1 ? 's' : ''}.`
              : 'No tickets found.'
          setMessages((prev) => {
            const updated = [...prev]
            const last = updated[updated.length - 1]
            if (last && last.role === 'assistant') {
              updated[updated.length - 1] = { ...last, content: summary, searchResults: results }
            }
            return updated
          })
        } catch {
          // skip malformed
        }
        break
      case 'tasks_updated':
        onTasksUpdated()
        break
      case 'done':
        setIsStreaming(false)
        setActiveToolCall(null)
        abortRef.current = null
        break
      case 'error':
        appendToLastAssistantMessage(event.content)
        setIsStreaming(false)
        abortRef.current = null
        break
    }
  }

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  return { messages, isStreaming, activeToolCall, sendMessage }
}
