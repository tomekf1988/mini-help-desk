interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div style={{ height: '100%', background: '#F2F2F7', overflow: 'auto' }}>
      {children}
    </div>
  )
}