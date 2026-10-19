export type LoginRequest = {
  userId: string
  password: string
}

export type Session = {
  userId: string
  userName: string
  labourId: string
}

export type JobCard = {
  srno: number
  itemSpecId: number
  jobNo: string
  date: string
  item: string
  quantity: number
  waitingCount: number
  underProcessCount: number
}

export type Batch = {
  batchNo: string
  item: string
  quantity: number
  stage: string
}

export type JobBatches = {
  srno: number
  itemSpecId: number
  jobNo: string
  date: string
  item: string
  jobQuantity: number
  underProcessCount: number
  waitingCount: number
  underProcess: Batch[]
  waiting: Batch[]
}

export type RememberedLogin = {
  userId: string
}

export type LabourPerson = {
  employeeId: string
  name: string
  ssl: string
  group: string
  portalUser: string
  unassigned: boolean
  status: string
}

export type LabourGroup = {
  name: string
  assigned: number
  required: number | null
  labour: LabourPerson[]
}

export type LabourDetails = {
  date: string
  presentCount: number
  unassignedCount: number
  present: LabourPerson[]
  unassigned: LabourPerson[]
  groups: LabourGroup[]
}
