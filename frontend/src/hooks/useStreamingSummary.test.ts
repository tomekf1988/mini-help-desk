import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import useStreamingSummary from './useStreamingSummary'

// Minimal EventSource mock
class MockEventSource {
  url: string
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  static instances: MockEventSource[] = []

  constructor(url: string) {
    this.url = url
    MockEventSource.instances.push(this)
  }

  close = vi.fn()

  // Helper to simulate receiving a message
  simulateMessage(data: string) {
    if (this.onmessage) {
      this.onmessage({ data } as MessageEvent)
    }
  }

  // Helper to simulate an error
  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'))
    }
  }
}

beforeEach(() => {
  MockEventSource.instances = []
  vi.stubGlobal('EventSource', MockEventSource)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useStreamingSummary', () => {
  it('creates EventSource at correct URL when start() is called', () => {
    const { result } = renderHook(() => useStreamingSummary(42))

    act(() => {
      result.current.start()
    })

    expect(MockEventSource.instances).toHaveLength(1)
    expect(MockEventSource.instances[0].url).toBe('/api/tickets/42/summary/stream')
  })

  it('sets isStreaming to true after start()', () => {
    const { result } = renderHook(() => useStreamingSummary(1))

    act(() => {
      result.current.start()
    })

    expect(result.current.isStreaming).toBe(true)
  })

  it('accumulates tokens from message events', async () => {
    const { result } = renderHook(() => useStreamingSummary(1))

    act(() => {
      result.current.start()
    })

    const es = MockEventSource.instances[0]

    act(() => {
      es.simulateMessage('Hello')
    })
    act(() => {
      es.simulateMessage(' world')
    })

    expect(result.current.summary).toBe('Hello world')
  })

  it('sets isStreaming to false when [DONE] is received', () => {
    const { result } = renderHook(() => useStreamingSummary(1))

    act(() => {
      result.current.start()
    })

    const es = MockEventSource.instances[0]

    act(() => {
      es.simulateMessage('Some token')
    })

    act(() => {
      es.simulateMessage('[DONE]')
    })

    expect(result.current.isStreaming).toBe(false)
    expect(es.close).toHaveBeenCalled()
  })

  it('does not append [DONE] to summary text', () => {
    const { result } = renderHook(() => useStreamingSummary(1))

    act(() => {
      result.current.start()
    })

    const es = MockEventSource.instances[0]

    act(() => {
      es.simulateMessage('Summary text')
    })
    act(() => {
      es.simulateMessage('[DONE]')
    })

    expect(result.current.summary).toBe('Summary text')
  })

  it('sets error state and stops streaming on error event', () => {
    const { result } = renderHook(() => useStreamingSummary(1))

    act(() => {
      result.current.start()
    })

    const es = MockEventSource.instances[0]

    act(() => {
      es.simulateError()
    })

    expect(result.current.error).not.toBeNull()
    expect(result.current.isStreaming).toBe(false)
    expect(es.close).toHaveBeenCalled()
  })

  it('does not open a second EventSource if already streaming', () => {
    const { result } = renderHook(() => useStreamingSummary(1))

    act(() => {
      result.current.start()
      result.current.start() // second call should be a no-op
    })

    expect(MockEventSource.instances).toHaveLength(1)
  })

  it('resets summary and error on new start()', () => {
    const { result } = renderHook(() => useStreamingSummary(1))

    // First stream
    act(() => {
      result.current.start()
    })
    const es1 = MockEventSource.instances[0]
    act(() => {
      es1.simulateMessage('old text')
      es1.simulateError()
    })

    expect(result.current.error).not.toBeNull()

    // Second stream after error
    act(() => {
      result.current.start()
    })

    expect(result.current.summary).toBe('')
    expect(result.current.error).toBeNull()
  })
})
