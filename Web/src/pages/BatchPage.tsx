import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { productionApi } from '../api/client'
import { JobHeader, Screen } from '../components/Chrome'
import { countLabel, formatQty } from '../format'
import type { Batch, JobBatches } from '../types'

type BatchMode = 'under-process' | 'waiting'

export function BatchPage({ mode }: { mode: BatchMode }) {
  const { srno = '', itemSpecId = '' } = useParams()
  const jbcNoId = Number(srno)
  const specId = Number(itemSpecId)
  const [data, setData] = useState<JobBatches | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.title = `${mode === 'waiting' ? 'Waiting for Process' : 'Under Process'} – ${data?.jobNo ?? srno}`
  }, [data?.jobNo, mode, srno])

  useEffect(() => {
    let active = true
    setError(null)
    if (!Number.isInteger(jbcNoId) || !Number.isInteger(specId)) {
      setData(null)
      setError('Job card was not found.')
      return
    }

    productionApi
      .getBatches(jbcNoId, specId)
      .then((next) => {
        if (active) setData(next)
      })
      .catch((err: unknown) => {
        if (!active) return
        setData(null)
        setError(err instanceof Error ? err.message : 'Batches could not be loaded.')
      })
    return () => {
      active = false
    }
  }, [jbcNoId, specId])

  const rows = mode === 'waiting' ? data?.waiting ?? [] : data?.underProcess ?? []
  const total = rows.reduce((sum, batch) => sum + batch.quantity, 0)
  const underCount = data?.underProcessCount ?? data?.underProcess.length ?? 0
  const waitingCount = data?.waitingCount ?? data?.waiting.length ?? 0
  const base = `/jobs/${jbcNoId}/${specId}`

  return (
    <Screen>
      <JobHeader jobNo={data?.jobNo || 'Job'} />
      <div className="summary">
        <div className="meta">
          <span className="meta-label">Date</span>
          <span className="meta-value">{data?.date ?? '—'}</span>
        </div>
        <div className="meta">
          <span className="meta-label">Item</span>
          <span className="meta-value">{data?.item ?? '—'}</span>
        </div>
        <div className="meta">
          <span className="meta-label">Job Qty</span>
          <span className="meta-value">{data ? formatQty(data.jobQuantity) : '—'}</span>
        </div>
      </div>
      <main className="page stack batch-main">
        <nav className="tabs" aria-label="Batch status">
          <Link
            to={`${base}/under-process`}
            className={mode === 'under-process' ? 'tab tab-on' : 'tab'}
            aria-current={mode === 'under-process' ? 'page' : undefined}
          >
            Under Process <span className={mode === 'under-process' ? 'pill pill-on' : 'pill pill-off'}>{underCount}</span>
          </Link>
          <Link
            to={`${base}/waiting`}
            className={mode === 'waiting' ? 'tab tab-on-wait' : 'tab'}
            aria-current={mode === 'waiting' ? 'page' : undefined}
          >
            Waiting <span className={mode === 'waiting' ? 'pill pill-on-wait' : 'pill pill-off'}>{waitingCount}</span>
          </Link>
        </nav>
        {error ? <p className="error-text">{error}</p> : null}
        {!data && !error ? <p className="count-line">Loading batches…</p> : null}
        {data && rows.length === 0 ? (
          <p className="count-line">{mode === 'waiting' ? 'No batches waiting' : 'No batches under process'}</p>
        ) : null}
        {rows.map((batch) => (
          <BatchCard key={batch.batchNo} batch={batch} mode={mode} />
        ))}
      </main>
      <div className="totalbar">
        <span>
          {mode === 'waiting'
            ? countLabel(rows.length, 'batch waiting', 'batches waiting')
            : countLabel(rows.length, 'batch under process', 'batches under process')}
        </span>
        <span>{formatQty(total)}</span>
      </div>
    </Screen>
  )
}

function BatchCard({ batch, mode }: { batch: Batch; mode: BatchMode }) {
  const waiting = mode === 'waiting'
  return (
    <article className="batch">
      <div className="batch-copy">
        <div className="mono batch-no">{batch.batchNo}</div>
        <div className="batch-meta">
          {batch.item} · <b>{formatQty(batch.quantity)}</b>
        </div>
      </div>
      <div className="stage">
        <span className="stage-label">{waiting ? 'Waiting for' : 'Current stage'}</span>
        <span className={waiting ? 'chip chip-amber' : 'chip chip-blue'}>{batch.stage}</span>
      </div>
    </article>
  )
}
