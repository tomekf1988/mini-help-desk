import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import TicketDetailPage from './pages/TicketDetailPage'
import TicketListPage from './pages/TicketListPage'
import TicketCreatePage from './pages/TicketCreatePage'

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center', color: '#DE350B' }}>
          Something went wrong. Please refresh the page.
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <Layout>
        <Routes>
          <Route path="/" element={<TicketListPage />} />
          <Route path="/tickets/new" element={<TicketCreatePage />} />
          <Route path="/tickets/:id" element={<TicketDetailPage />} />
        </Routes>
      </Layout>
    </ErrorBoundary>
  )
}