export function formatQty(value: number) {
  return value.toLocaleString('en-US')
}

export function countLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`
}
