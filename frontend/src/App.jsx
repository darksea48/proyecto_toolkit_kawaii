import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import GeneradorQR from './pages/GeneradorQR'
import LimpiadorCSV from './pages/LimpiadorCSV'
import ImportadorVV from './pages/ImportadorVV'

function App() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <main className="flex-grow-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/qr" element={<GeneradorQR />} />
          <Route path="/csv" element={<LimpiadorCSV />} />
          <Route path="/vv" element={<ImportadorVV />} />
        </Routes>
      </main>
      <footer className="text-center py-3 mt-auto" style={{ backgroundColor: '#134E4A', color: '#ccfbf1' }}>
        <small>
          <i className="bi bi-tools me-1" aria-hidden="true"></i>
          Toolkit Kawaii &copy; {new Date().getFullYear()}
        </small>
      </footer>
    </div>
  )
}

export default App
