import { Routes, Route } from 'react-router-dom'

function App() {
  return (
    <Routes>
      <Route path="/" element={<div style={{ padding: '2rem' }}>Mini Help Desk</div>} />
    </Routes>
  )
}

export default App
