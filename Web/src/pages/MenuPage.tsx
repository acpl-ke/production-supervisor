import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { productionApi } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { BrandHeader, Screen } from '../components/Chrome'
import { ChevronIcon, DriveIcon, LabourIcon } from '../components/Icons'
import { countLabel } from '../format'
import type { LabourDetails } from '../types'

export function MenuPage() {
  const { session } = useAuth()
  const [jobCount, setJobCount] = useState<number | null>(null)
  const [labour, setLabour] = useState<LabourDetails | null>(null)

  useEffect(() => {
    document.title = 'Menu – IGI Production Supervisor Production'
    let active = true
    productionApi
      .getJobs()
      .then((jobs) => {
        if (active) setJobCount(jobs.length)
      })
      .catch(() => {
        if (active) setJobCount(null)
      })
    productionApi
      .getLabour()
      .then((details) => {
        if (active) setLabour(details)
      })
      .catch(() => {
        if (active) setLabour(null)
      })
    return () => {
      active = false
    }
  }, [])

  const who = session?.userName ?? ''
  const jobsLabel =
    jobCount === null ? 'Active jobs' : countLabel(jobCount, 'active job', 'active jobs')
  const labourLabel = labour
    ? `${labour.presentCount} present · ${labour.unassignedCount} unassigned`
    : 'Present and unassigned'

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
        <Link to="/labour" className="menu-card">
          <div className="menu-icon">
            <LabourIcon />
          </div>
          <div className="menu-copy">
            <div className="menu-title">Labour Details</div>
            <div className="menu-sub">{labourLabel}</div>
          </div>
          <ChevronIcon />
        </Link>
      </main>
    </Screen>
  )
}
