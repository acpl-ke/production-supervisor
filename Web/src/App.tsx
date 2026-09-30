import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import { BatchPage } from './pages/BatchPage'
import { DrivePage } from './pages/DrivePage'
import { LoginPage } from './pages/LoginPage'
import { MenuPage } from './pages/MenuPage'

function RequireAuth({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  if (!session) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route
        path="/menu"
        element={
          <RequireAuth>
            <MenuPage />
          </RequireAuth>
        }
      />
      <Route
        path="/drive"
        element={
          <RequireAuth>
            <DrivePage />
          </RequireAuth>
        }
      />
      <Route
        path="/jobs/:srno/:itemSpecId/under-process"
        element={
          <RequireAuth>
            <BatchPage mode="under-process" />
          </RequireAuth>
        }
      />
      <Route
        path="/jobs/:srno/:itemSpecId/waiting"
        element={
          <RequireAuth>
            <BatchPage mode="waiting" />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
