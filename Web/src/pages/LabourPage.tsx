import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { productionApi } from '../api/client'
import { Screen, TitleHeader } from '../components/Chrome'
import { ChevronIcon } from '../components/Icons'
import type { LabourDetails, LabourPerson } from '../types'

type ListMode = 'present' | 'unassigned' | 'group'

export function LabourPage() {
  const { data, error, refreshing, refresh } = useLabour()

  useEffect(() => {
    document.title = 'Labour Details – IGI Production Supervisor'
  }, [])

  return (
    <Screen>
      <TitleHeader title="Labour Details" backTo="/menu" onRefresh={() => void refresh()} refreshing={refreshing} />
      <main className="page stack page-pad">
        {error ? <p className="error-text">{error}</p> : null}
        {!data && !error ? <p className="count-line">Loading labour…</p> : null}
        {data ? (
          <>
            <div className="stat-grid">
              <Link to="/labour/present" className="stat-card">
                <span className="stat-label">Head Count Present</span>
                <span className="stat-value">{data.presentCount}</span>
                <span className="stat-link">View list →</span>
              </Link>
              <Link to="/labour/unassigned" className="stat-card">
                <span className="stat-label">Unassigned Labourers</span>
                <span className="stat-value stat-value-amber">{data.unassignedCount}</span>
                <span className="stat-link">View list →</span>
              </Link>
            </div>
            <div className="section-head">
              <span>Assigned labour</span>
              <span>assigned / required</span>
            </div>
            {data.groups.length === 0 ? <p className="count-line">No machine groups assigned</p> : null}
            {data.groups.length > 0 ? (
              <div className="group-card">
                {data.groups.map((group) => {
                  const gap = staffingGap(group.assigned, group.required)
                  return (
                    <Link
                      key={group.name}
                      to={`/labour/group/${encodeURIComponent(group.name)}`}
                      className="group-row"
                    >
                      <span className="group-name">{group.name}</span>
                      <span className="group-score">
                        {gap ? <span className={`badge badge-${gap.kind}`}>{gap.label}</span> : null}
                        <span className="group-ratio">
                          <b>{group.assigned}</b>
                          {group.required != null ? <span>/{group.required}</span> : null}
                        </span>
                        <ChevronIcon />
                      </span>
                    </Link>
                  )
                })}
              </div>
            ) : null}
            <p className="count-line">Tap any count to see the labour list</p>
          </>
        ) : null}
      </main>
    </Screen>
  )
}

export function LabourListPage({ mode }: { mode: ListMode }) {
  const { groupName = '' } = useParams()
  const decodedGroup = groupName
  const { data, error, refreshing, refresh } = useLabour()
  const [query, setQuery] = useState('')

  const group = data?.groups.find((item) => item.name.toLowerCase() === decodedGroup.toLowerCase())
  const title = mode === 'present' ? 'Head Count Present' : mode === 'unassigned' ? 'Unassigned Labourers' : group?.name || decodedGroup || 'Labour'
  const people = mode === 'present' ? data?.present ?? [] : mode === 'unassigned' ? data?.unassigned ?? [] : group?.labour ?? []

  useEffect(() => {
    document.title = `${title} – IGI Production Supervisor`
  }, [title])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return people.filter((person) => !needle || matchesLabour(person, needle))
  }, [people, query])

  const missingGroup = mode === 'group' && data && !group

  return (
    <Screen>
      <TitleHeader
        title={title}
        backTo="/labour"
        onRefresh={mode === 'group' ? undefined : () => void refresh()}
        refreshing={refreshing}
      />
      {mode === 'group' && group ? (
        <div className="shiftbar">
          <div className="meta">
            <span className="meta-label">Current Shift</span>
            <span className="meta-value">—</span>
          </div>
          <div className="meta">
            <span className="meta-label">Assigned</span>
            <span className="meta-value">{group.assigned}</span>
          </div>
          <div className="meta">
            <span className="meta-label">Required</span>
            <span className="meta-value">{group.required ?? '—'}</span>
          </div>
        </div>
      ) : null}
      <main className="page stack page-pad">
        {error ? <p className="error-text">{error}</p> : null}
        {!data && !error ? <p className="count-line">Loading labour…</p> : null}
        {missingGroup ? <p className="count-line">Machine group was not found.</p> : null}
        {data && !missingGroup ? (
          <>
            <label className="sr-only" htmlFor="labour-search">
              Search name, machine, SSL, or portal user
            </label>
            <input
              id="labour-search"
              className="search"
              type="search"
              placeholder="Search name, machine, SSL, or portal user"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {visible.length === 0 ? (
              <p className="count-line">{query.trim() ? 'No labour matches your search' : 'No labour in this list'}</p>
            ) : (
              <LabourTable people={visible} showGroup />
            )}
          </>
        ) : null}
      </main>
    </Screen>
  )
}

function LabourTable({ people, showGroup }: { people: LabourPerson[]; showGroup: boolean }) {
  return (
    <div className="labour-table">
      <div className="labour-head">
        <span>{showGroup ? 'Labour name · Machine' : 'Labour name'}</span>
        <span>SSL level</span>
      </div>
      {people.map((person, index) => (
        <div key={`${person.employeeId}-${person.name}-${index}`} className="labour-row">
          <span className="labour-index">{index + 1}</span>
          <span className="labour-name">
            {person.name}
            {showGroup ? (
              <span className={person.unassigned ? 'labour-group is-unassigned' : 'labour-group'}>
                {person.group || 'Unassigned'}
                {person.portalUser ? <span className="labour-portal"> · {person.portalUser}</span> : null}
              </span>
            ) : null}
          </span>
          <span className="ssl-chip">{person.ssl || '—'}</span>
        </div>
      ))}
    </div>
  )
}

function matchesLabour(person: LabourPerson, needle: string) {
  const machine = person.unassigned ? 'unassigned' : person.group
  return [person.name, person.employeeId, person.ssl, machine, person.group, person.portalUser, person.status]
    .join(' ')
    .toLowerCase()
    .includes(needle)
}

function staffingGap(assigned: number, required: number | null) {
  if (required == null || required <= 0 || assigned === required) return null
  const diff = Math.abs(required - assigned)
  return assigned < required
    ? { kind: 'short' as const, label: `${diff} short` }
    : { kind: 'extra' as const, label: `${diff} extra` }
}

function useLabour() {
  const [data, setData] = useState<LabourDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    setError(null)
    try {
      setData(await productionApi.getLabour())
    } catch (err) {
      setData(null)
      setError(err instanceof Error ? err.message : 'Labour details could not be loaded.')
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

  return { data, error, refreshing, refresh }
}
