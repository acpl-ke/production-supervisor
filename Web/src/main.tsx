import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { loadAppConfig } from './api/client'
import App from './App'
import { AuthProvider } from './auth/AuthContext'
import './index.css'

loadAppConfig()
  .then(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </StrictMode>,
    )
  })
  .catch((error: unknown) => {
    document.body.textContent = error instanceof Error ? error.message : 'Configuration could not be loaded.'
  })
