import { useNavigate } from 'react-router-dom'
import TicketForm from '../components/TicketForm'

export default function TicketCreatePage() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Sticky breadcrumb */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          height: 56,
          gap: 8,
        }}
      >
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: 'none',
            color: '#0052CC',
            fontSize: 14,
            cursor: 'pointer',
            fontFamily: 'inherit',
            padding: 0,
          }}
        >
          Backlog
        </button>
        <span style={{ color: '#6B778C', fontSize: 14 }}>/</span>
        <span style={{ fontSize: 14, color: '#172B4D', fontWeight: 500 }}>New Ticket</span>
      </div>

      <div
        style={{
          flex: 1,
          padding: '24px',
          maxWidth: 600,
          margin: '0 auto',
          width: '100%',
        }}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.05)',
            padding: 24,
          }}
        >
          <h1 style={{ margin: '0 0 20px 0', fontSize: 18, fontWeight: 600, color: '#172B4D' }}>
            Create Ticket
          </h1>
          <TicketForm onCreated={() => navigate('/')} />
        </div>
      </div>
    </div>
  )
}