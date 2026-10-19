import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { productionApi } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { readRemembered } from '../auth/session'
import { Screen } from '../components/Chrome'

export function LoginPage() {
  const { session, signIn } = useAuth()
  const navigate = useNavigate()
  const remembered = readRemembered()
  const [userId, setUserId] = useState(remembered?.userId ?? '')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(Boolean(remembered))
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    document.title = 'Login – IGI Production Supervisor Production'
  }, [])

  if (session) return <Navigate to="/menu" replace />

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setNotice(null)
    if (!userId.trim() || !password) {
      setError('Enter user ID and password.')
      return
    }

    setBusy(true)
    setError(null)
    try {
      const next = await productionApi.login({
        userId: userId.trim(),
        password,
      })
      signIn(next, remember, { userId: userId.trim() })
      navigate('/menu')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen>
      <div className="hero">
        <img className="logo logo-lg" src="/igi-logo.png" alt="IGI Production Supervisor" />
        <div className="hero-copy">
          <div className="hero-title">Production Supervisor</div>
          <div className="hero-text">Track job cards and batches on the shop floor.</div>
        </div>
      </div>
      <form className="page stack sign-form" onSubmit={onSubmit}>
        <h1 className="sign-title">Sign in</h1>
        <div className="field">
          <label className="field-label" htmlFor="uid">
            User ID
          </label>
          <input
            id="uid"
            className="input"
            type="text"
            placeholder="e.g. prodsup01"
            autoComplete="username"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="pwd">
            Password
          </label>
          <input
            id="pwd"
            className="input"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <label className="check">
          <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
          Remember me
        </label>
        {error ? <p className="error-text">{error}</p> : null}
        <button className="btn-primary" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Login'}
        </button>
        <button
          className="link-quiet"
          type="button"
          onClick={() => setNotice('Ask your administrator to reset the password.')}
        >
          Forgot password?
        </button>
        {notice ? <p className="form-note">{notice}</p> : null}
      </form>
      <div className="legal">ARC CompSoft · ACFA.Net ERP</div>
    </Screen>
  )
}
