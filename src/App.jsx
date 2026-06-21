import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import { Admin } from './pages/Admin'
import { Dashboard } from './pages/Dashboard'
import { Login } from './pages/Login'

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

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App