import { useEffect, useRef, useState } from 'react'
import { useChat } from '../hooks/useChat'
import StatusBadge from './StatusBadge'
import PriorityBadge from './PriorityBadge'

interface ChatPanelProps {
  onTicketsUpdated: () => void
}

export default function ChatPanel({ onTicketsUpdated }: ChatPanelProps) {
  const { messages, isStreaming, activeToolCall, sendMessage } = useChat(onTicketsUpdated)
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, activeToolCall])

  function handleSend() {
    const text = inputValue.trim()
    if (!text || isStreaming) return
    setInputValue('')
    sendMessage(text)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const lastMessage = messages[messages.length - 1]
  const isThinking =
    isStreaming &&
    lastMessage?.role === 'assistant' &&
    lastMessage.content === '' &&
    !lastMessage.ticket &&
    !lastMessage.searchResults

  return (
    <div
      style={{
        width: 360,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#fff',
        borderLeft: '1px solid #E5E7EB',
        boxShadow: '-2px 0 8px rgba(0,0,0,0.06)',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: 16,
          borderBottom: '1px solid #E5E7EB',
          fontWeight: 600,
          fontSize: 15,
          color: '#172B4D',
        }}
      >
        Assistant
      </div>

      {/* Message list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6B778C',
              fontSize: 14,
              textAlign: 'center',
            }}
          >
            Ask me to create or search tickets.
          </div>
        )}

        {messages.map((msg, index) => {
          const isUser = msg.role === 'user'
          const isLastAssistant =
            !isUser && index === messages.length - 1 && isThinking

          if (isLastAssistant) {
            return (
              <div
                key={String(index)}
                style={{
                  alignSelf: 'flex-start',
                  background: '#F2F2F7',
                  color: '#6B778C',
                  borderRadius: 12,
                  padding: '8px 12px',
                  fontSize: 14,
                  maxWidth: '80%',
                  fontStyle: 'italic',
                }}
              >
                Thinking...
              </div>
            )
          }

          return (
            <div
              key={String(index)}
              style={
                isUser
                  ? {
                      alignSelf: 'flex-end',
                      background: '#007AFF',
                      color: '#fff',
                      borderRadius: 12,
                      padding: '8px 12px',
                      fontSize: 14,
                      maxWidth: '80%',
                    }
                  : {
                      alignSelf: 'flex-start',
                      background: '#F2F2F7',
                      color: '#1C1C1E',
                      borderRadius: 12,
                      padding: '8px 12px',
                      fontSize: 14,
                      maxWidth: '80%',
                      whiteSpace: 'pre-wrap',
                    }
              }
            >
              {msg.content}
              {msg.ticket && (
                <div
                  style={{
                    marginTop: msg.content ? 8 : 0,
                    background: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: 8,
                    padding: '10px 12px',
                    minWidth: 220,
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#172B4D', marginBottom: 4 }}>
                    {msg.ticket.title}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <StatusBadge status={msg.ticket.status} />
                    <PriorityBadge priority={msg.ticket.priority} />
                    {msg.ticket.due_date && (
                      <span style={{ fontSize: 12, color: '#6B778C' }}>Due: {msg.ticket.due_date}</span>
                    )}
                  </div>
                  {msg.ticket.description && (
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 13,
                        color: '#374151',
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                        maxHeight: 120,
                        overflowY: 'auto',
                      }}
                    >
                      {msg.ticket.description}
                    </div>
                  )}
                </div>
              )}
              {msg.searchResults && msg.searchResults.length > 0 && (
                <div
                  style={{
                    marginTop: msg.content ? 8 : 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    maxHeight: 300,
                    overflowY: 'auto',
                  }}
                >
                  {msg.searchResults.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: 8,
                        padding: '8px 12px',
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#172B4D', marginBottom: 4 }}>
                        {t.title}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        <StatusBadge status={t.status} />
                        <PriorityBadge priority={t.priority} />
                        {t.due_date && (
                          <span style={{ fontSize: 11, color: '#6B778C' }}>Due: {t.due_date}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Tool call indicator */}
      {activeToolCall && (
        <div
          style={{
            background: '#EFF6FF',
            color: '#1D4ED8',
            borderRadius: 999,
            padding: '4px 10px',
            fontSize: 12,
            margin: '0 16px 8px',
            alignSelf: 'flex-start',
          }}
        >
          Calling {activeToolCall}...
        </div>
      )}

      {/* Input row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          padding: '12px 16px',
          gap: 8,
          borderTop: '1px solid #E5E7EB',
        }}
      >
        <textarea
          rows={3}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isStreaming}
          placeholder="Type a message… (Shift+Enter for new line)"
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #D1D5DB',
            fontSize: 14,
            outline: 'none',
            resize: 'none',
            lineHeight: 1.5,
            fontFamily: 'inherit',
          }}
        />
        <button
          onClick={handleSend}
          disabled={isStreaming}
          style={{
            padding: '8px 14px',
            background: '#007AFF',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            cursor: isStreaming ? 'not-allowed' : 'pointer',
            opacity: isStreaming ? 0.6 : 1,
          }}
        >
          Send
        </button>
      </div>
    </div>
  )
}
