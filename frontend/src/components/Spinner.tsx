export default function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: '3px solid #DFE1E6',
          borderTopColor: '#0052CC',
          animation: 'spin 0.7s linear infinite',
        }}
      />
    </div>
  )
}