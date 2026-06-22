import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import { Admin } from './pages/Admin'
import { Dashboard } from './pages/Dashboard'
import { Login } from './pages/Login'
import { Jobs } from './pages/Jobs'
import { Candidates } from './pages/Candidates'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <main className="loading-page">Loading...</main>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route path="/admin" element={
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        }
      />

      <Route path="/jobs" element={
        <ProtectedRoute>
          <Jobs />
        </ProtectedRoute>
        }
      />

      <Route path="/candidates" element={
        <ProtectedRoute>
          <Candidates />
        </ProtectedRoute>
        }
      />

    </Routes>
  )
}

export default App
