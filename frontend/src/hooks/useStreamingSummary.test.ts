import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import useStreamingSummary from './useStreamingSummary'

function sseBody(tokens: string[]): string {
  return tokens.map(t => `data: ${t}\n\n`).join('')
}

function mockFetch(tokens: string[], status = 200): void {
  vi.spyOn(global, 'fetch').mockResolvedValue(
    new Response(sseBody(tokens), {
      status,
      headers: { 'Content-Type': 'text/event-stream' },
    })
  )
}

// Advance fake timers until the drain queue is empty (summary stops changing)
async function drainQueue(): Promise<void> {
  for (let i = 0; i < 500; i++) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(20)
    })
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  mockFetch(['[DONE]'])
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('useStreamingSummary', () => {
  it('fetches the correct URL when start() is called', async () => {
    const { result } = renderHook(() => useStreamingSummary(42))

    await act(async () => { result.current.start() })
    await drainQueue()

    expect(fetch).toHaveBeenCalledWith(
      '/api/tickets/42/summary/stream',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    )
  })

  it('sets isStreaming to true immediately after start()', () => {
    const { result } = renderHook(() => useStreamingSummary(1))

    act(() => { result.current.start() })

    expect(result.current.isStreaming).toBe(true)
  })

  it('accumulates tokens and reveals them via the drain queue', async () => {
    mockFetch(['Hello', ' world', '[DONE]'])
    const { result } = renderHook(() => useStreamingSummary(1))

    await act(async () => { result.current.start() })
    await drainQueue()

    expect(result.current.summary).toBe('Hello world')
    expect(result.current.isStreaming).toBe(false)
  })

  it('does not append [DONE] to summary text', async () => {
    mockFetch(['Summary text', '[DONE]'])
    const { result } = renderHook(() => useStreamingSummary(1))

    await act(async () => { result.current.start() })
    await drainQueue()

    expect(result.current.summary).toBe('Summary text')
  })

  it('sets isStreaming to false only after the queue is fully drained', async () => {
    mockFetch(['Hi', '[DONE]'])
    const { result } = renderHook(() => useStreamingSummary(1))

    await act(async () => { result.current.start() })

    // After fetch resolves, isStreaming is still true (queue not empty)
    expect(result.current.isStreaming).toBe(true)

    // Drain two characters ("Hi")
    await act(async () => { await vi.advanceTimersByTimeAsync(20) }) // 'H'
    await act(async () => { await vi.advanceTimersByTimeAsync(20) }) // 'i'
    // One more tick to see the empty queue + fetchDone → stops
    await act(async () => { await vi.advanceTimersByTimeAsync(20) })

    expect(result.current.summary).toBe('Hi')
    expect(result.current.isStreaming).toBe(false)
  })

  it('sets error state when [ERROR] sentinel is received', async () => {
    mockFetch(['[ERROR]'])
    const { result } = renderHook(() => useStreamingSummary(1))

    await act(async () => { result.current.start() })
    await drainQueue()

    expect(result.current.error).not.toBeNull()
    expect(result.current.isStreaming).toBe(false)
  })

  it('sets error state on non-ok response', async () => {
    mockFetch([], 404)
    const { result } = renderHook(() => useStreamingSummary(1))

    await act(async () => { result.current.start() })
    await drainQueue()

    expect(result.current.error).not.toBeNull()
    expect(result.current.isStreaming).toBe(false)
  })

  it('does not open a second stream if already streaming', async () => {
    const { result } = renderHook(() => useStreamingSummary(1))

    act(() => {
      result.current.start()
      result.current.start() // no-op
    })

    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('resets summary and error on new start() after previous error', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(new Response('', { status: 500 }))
    const { result } = renderHook(() => useStreamingSummary(1))

    await act(async () => { result.current.start() })
    await drainQueue()

    expect(result.current.error).not.toBeNull()

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(sseBody(['[DONE]']), { status: 200 })
    )
    act(() => { result.current.start() })

    expect(result.current.summary).toBe('')
    expect(result.current.error).toBeNull()
  })
})
