import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { productionApi } from '../api/client'
import { Screen, TitleHeader } from '../components/Chrome'
import { countLabel, formatQty } from '../format'
import type { JobCard } from '../types'

export function DrivePage() {
  const [jobs, setJobs] = useState<JobCard[] | null>(null)
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    document.title = 'Drive for Production – IGI Cable'
  }, [])

  async function load() {
    setError(null)
    try {
      const next = await productionApi.getJobs()
      setJobs(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Jobs could not be loaded.')
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function refresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return (jobs ?? []).filter(
      (job) =>
        !needle ||
        job.jobNo.toLowerCase().includes(needle) ||
        job.item.toLowerCase().includes(needle),
    )
  }, [jobs, query])

  return (
    <Screen>
      <TitleHeader title="Drive for Production" backTo="/menu" onRefresh={() => void refresh()} refreshing={refreshing} />
      <main className="page stack page-pad">
        <div className="hint">
          Jobs marked <b>Enable Drive for Production</b>
        </div>
        <label className="sr-only" htmlFor="q">
          Search jobs
        </label>
        <input
          id="q"
          className="search"
          type="search"
          placeholder="Search job card no. or item"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {error ? <p className="error-text">{error}</p> : null}
        {jobs === null && !error ? <p className="count-line">Loading jobs…</p> : null}
        {visible.map((job) => (
          <article key={`${job.srno}-${job.itemSpecId}`} className="job-card">
            <div className="job-head">
              <div className="mono job-no">{job.jobNo}</div>
              <div className="job-date">{job.date}</div>
            </div>
            <div className="meta-grid">
              <div className="meta">
                <span className="meta-label">Item</span>
                <span className="meta-value">{job.item}</span>
              </div>
              <div className="meta">
                <span className="meta-label">Quantity</span>
                <span className="meta-value">{formatQty(job.quantity)}</span>
              </div>
            </div>
            <div className="job-actions">
              <Link className="btn-wait" to={`/jobs/${job.srno}/${job.itemSpecId}/waiting`}>
                Waiting for Process
              </Link>
              <Link className="btn-go" to={`/jobs/${job.srno}/${job.itemSpecId}/under-process`}>
                Under Process
              </Link>
            </div>
          </article>
        ))}
        {jobs && visible.length === 0 ? <p className="count-line">No jobs match your search</p> : null}
        {jobs && visible.length > 0 ? (
          <div className="count-line">Showing {countLabel(visible.length, 'job', 'jobs')}</div>
        ) : null}
      </main>
    </Screen>
  )
}
