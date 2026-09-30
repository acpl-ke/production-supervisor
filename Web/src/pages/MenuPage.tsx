import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { productionApi } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { BrandHeader, Screen } from '../components/Chrome'
import { ChevronIcon, DriveIcon } from '../components/Icons'
import { countLabel } from '../format'

export function MenuPage() {
  const { session } = useAuth()
  const [jobCount, setJobCount] = useState<number | null>(null)

  useEffect(() => {
    document.title = 'Menu – IGI Cable Production'
    let active = true
    productionApi
      .getJobs()
      .then((jobs) => {
        if (active) setJobCount(jobs.length)
      })
      .catch(() => {
        if (active) setJobCount(null)
      })
    return () => {
      active = false
    }
  }, [])

  const who = session?.userName ?? ''
  const jobsLabel =
    jobCount === null ? 'Active jobs' : countLabel(jobCount, 'active job', 'active jobs')

  return (
    <Screen>
      <BrandHeader />
      <main className="page stack menu-main">
        <div className="stack intro">
          <div className="identity">{who}</div>
          <h1 className="page-title">Menu</h1>
        </div>
        <Link to="/drive" className="menu-card">
          <div className="menu-icon">
            <DriveIcon />
          </div>
          <div className="menu-copy">
            <div className="menu-title">Drive for Production</div>
            <div className="menu-sub">{jobsLabel}</div>
          </div>
          <ChevronIcon />
        </Link>
      </main>
    </Screen>
  )
}
