import React from 'react'
import useStreamingSummary from '../hooks/useStreamingSummary'

interface SummaryPanelProps {
  ticketId: number | string
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#6B778C',
  marginBottom: 8,
  display: 'block',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

export default function SummaryPanel({ ticketId }: SummaryPanelProps) {
  const { summary, isStreaming, error, start } = useStreamingSummary(ticketId)

  const showOutput = isStreaming || summary.length > 0

  return (
    <div style={{ borderTop: '1px solid #DFE1E6', paddingTop: 16 }}>
      <label style={labelStyle}>AI Summary</label>

      <button
        onClick={start}
        disabled={isStreaming}
        style={{
          background: isStreaming
            ? '#C1C7D0'
            : 'linear-gradient(180deg, #1a78e5 0%, #0052CC 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: 13,
          fontWeight: 600,
          fontFamily: 'inherit',
          cursor: isStreaming ? 'not-allowed' : 'pointer',
          width: '100%',
          marginBottom: showOutput || error ? 12 : 0,
        }}
      >
        {isStreaming ? 'Generating…' : 'Generate Summary'}
      </button>

      {showOutput && (
        <div
          style={{
            background: '#F4F5F7',
            borderRadius: 8,
            padding: '10px 12px',
            fontSize: 13,
            color: '#172B4D',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            minHeight: 36,
          }}
        >
          {summary}
          {isStreaming && (
            <span
              style={{
                display: 'inline-block',
                width: 2,
                height: '1em',
                background: '#0052CC',
                marginLeft: 1,
                verticalAlign: 'text-bottom',
                animation: 'blink 0.8s step-end infinite',
              }}
            />
          )}
        </div>
      )}

      {error && (
        <div
          style={{
            background: '#FFEBE6',
            color: '#DE350B',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}
    </div>
  )
}
