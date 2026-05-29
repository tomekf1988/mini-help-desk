import { render, screen, fireEvent } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ChatPanel from '../components/ChatPanel'
import type { ChatMessage } from '../types'

// Mock useChat hook
vi.mock('../hooks/useChat', () => ({
  useChat: vi.fn(),
}))

import { useChat } from '../hooks/useChat'

const mockUseChat = useChat as ReturnType<typeof vi.fn>

function defaultChatReturn(overrides: {
  messages?: ChatMessage[]
  isStreaming?: boolean
  activeToolCall?: string | null
  sendMessage?: ReturnType<typeof vi.fn>
} = {}) {
  return {
    messages: overrides.messages ?? [],
    isStreaming: overrides.isStreaming ?? false,
    activeToolCall: overrides.activeToolCall ?? null,
    sendMessage: overrides.sendMessage ?? vi.fn(),
  }
}

describe('ChatPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders empty state message when no messages', () => {
    mockUseChat.mockReturnValue(defaultChatReturn())
    render(<ChatPanel onTicketsUpdated={vi.fn()} />)
    expect(screen.getByText('Ask me to create or search tickets.')).toBeInTheDocument()
  })

  it('disables input and Send button when isStreaming is true', () => {
    mockUseChat.mockReturnValue(defaultChatReturn({ isStreaming: true }))
    render(<ChatPanel onTicketsUpdated={vi.fn()} />)

    const input = screen.getByPlaceholderText('Type a message… (Shift+Enter for new line)')
    const button = screen.getByRole('button', { name: /send/i })

    expect(input).toBeDisabled()
    expect(button).toBeDisabled()
  })

  it('displays user message in the message list', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'Create a ticket for login bug' },
    ]
    mockUseChat.mockReturnValue(defaultChatReturn({ messages }))
    render(<ChatPanel onTicketsUpdated={vi.fn()} />)
    expect(screen.getByText('Create a ticket for login bug')).toBeInTheDocument()
  })

  it('calls sendMessage when Send button is clicked', () => {
    const sendMessage = vi.fn()
    mockUseChat.mockReturnValue(defaultChatReturn({ sendMessage }))
    render(<ChatPanel onTicketsUpdated={vi.fn()} />)

    const input = screen.getByPlaceholderText('Type a message… (Shift+Enter for new line)')
    fireEvent.change(input, { target: { value: 'Hello' } })
    fireEvent.click(screen.getByRole('button', { name: /send/i }))

    expect(sendMessage).toHaveBeenCalledWith('Hello')
  })

  it('shows tool call indicator when activeToolCall is set', () => {
    mockUseChat.mockReturnValue(
      defaultChatReturn({ activeToolCall: 'create_ticket_tool' })
    )
    render(<ChatPanel onTicketsUpdated={vi.fn()} />)
    expect(screen.getByText(/Calling create_ticket_tool/)).toBeInTheDocument()
  })

  it('renders ticket card in assistant bubble when message has ticket data', () => {
    const mockMessages: ChatMessage[] = [
      { role: 'assistant', content: '', ticket: { id: 'abc', title: 'Italian pizza recipe', description: 'Recipe content...', status: 'open', priority: 'high', due_date: '2026-05-30' } },
    ]
    mockUseChat.mockReturnValue(defaultChatReturn({ messages: mockMessages }))

    render(<ChatPanel onTicketsUpdated={vi.fn()} />)
    expect(screen.getByText('Italian pizza recipe')).toBeInTheDocument()
    expect(screen.getByText('Recipe content...')).toBeInTheDocument()
  })

  it('renders search result cards when message has searchResults', () => {
    vi.mocked(useChat).mockReturnValue({
      messages: [
        {
          role: 'assistant' as const,
          content: '',
          searchResults: [
            { id: 'x1', title: 'Buy milk', description: null, status: 'open', priority: 'high', due_date: null, estimated_minutes: null, created_at: '2026-01-01T00:00:00', updated_at: '2026-01-01T00:00:00' },
            { id: 'x2', title: 'Fix bug', description: null, status: 'in_progress', priority: 'medium', due_date: '2026-06-01', estimated_minutes: null, created_at: '2026-01-01T00:00:00', updated_at: '2026-01-01T00:00:00' },
          ],
        },
      ],
      isStreaming: false,
      activeToolCall: null,
      sendMessage: vi.fn(),
    })

    render(<ChatPanel onTicketsUpdated={vi.fn()} />)
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
    expect(screen.getByText('Fix bug')).toBeInTheDocument()
  })
})
