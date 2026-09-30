import type { JobBatches, JobCard, LoginRequest, Session } from '../types'

type AppConfig = {
  apiUrl: string
  webUrl: string
}

let apiBase = ''

export async function loadAppConfig() {
  const response = await fetch('/config.json', { cache: 'no-store' })
  if (!response.ok) {
    throw new Error('config.json could not be loaded.')
  }

  const config = (await response.json()) as AppConfig
  apiBase = (config.apiUrl ?? '').replace(/\/$/, '')
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })

  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const body = (await response.json()) as { message?: string }
      if (body.message) message = body.message
    } catch {
      /* response had no JSON body */
    }
    throw new Error(message)
  }

  return (await response.json()) as T
}

export const productionApi = {
  login(body: LoginRequest): Promise<Session> {
    return request<Session>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  getJobs(): Promise<JobCard[]> {
    return request<JobCard[]>('/api/jobs')
  },

  getBatches(srno: number, itemSpecId: number): Promise<JobBatches> {
    return request<JobBatches>(`/api/jobs/${srno}/${itemSpecId}/batches`)
  },
}
