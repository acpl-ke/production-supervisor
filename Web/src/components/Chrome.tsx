import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { BackIcon, RefreshIcon } from './Icons'

export function Screen({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`screen ${className}`.trim()}>{children}</div>
}

export function BrandHeader() {
  const { signOut } = useAuth()
  return (
    <header className="topbar topbar-brand">
      <img className="logo" src="/igi-logo.png" alt="IGI Production Supervisor" />
      <Link to="/" className="btn-logout" onClick={signOut}>
        Logout
      </Link>
    </header>
  )
}

export function TitleHeader({
  title,
  backTo,
  onRefresh,
  refreshing = false,
}: {
  title: string
  backTo: string
  onRefresh?: () => void
  refreshing?: boolean
}) {
  return (
    <header className="topbar">
      <Link to={backTo} className="btn-icon" aria-label="Back">
        <BackIcon />
      </Link>
      <div className="topbar-title">{title}</div>
      {onRefresh ? (
        <button
          type="button"
          className={`btn-icon ${refreshing ? 'is-refreshing' : ''}`}
          aria-label="Refresh"
          onClick={onRefresh}
        >
          <RefreshIcon />
        </button>
      ) : null}
    </header>
  )
}

export function JobHeader({ jobNo }: { jobNo: string }) {
  return (
    <header className="topbar">
      <Link to="/drive" className="btn-icon" aria-label="Back to jobs">
        <BackIcon />
      </Link>
      <div className="topbar-job">{jobNo}</div>
    </header>
  )
}
