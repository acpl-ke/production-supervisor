import type { SVGProps } from 'react'

function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  )
}

export function BackIcon() {
  return (
    <Icon width="22" height="22" strokeWidth="2">
      <path d="M15 6l-6 6 6 6" />
    </Icon>
  )
}

export function ChevronIcon() {
  return (
    <Icon width="22" height="22" stroke="#1f4e79" strokeWidth="2">
      <path d="M9 6l6 6-6 6" />
    </Icon>
  )
}

export function DriveIcon() {
  return (
    <Icon width="28" height="28" stroke="#1f4e79" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1" />
    </Icon>
  )
}

export function LabourIcon() {
  return (
    <Icon width="28" height="28" stroke="#1f4e79" strokeWidth="1.8">
      <circle cx="9" cy="8" r="2.4" />
      <path d="M4.2 18.2c.7-2.6 2.6-3.8 4.8-3.8s4.1 1.2 4.8 3.8" />
      <circle cx="16.2" cy="9.2" r="2" />
      <path d="M14.2 18.2c.4-2 1.8-3 3.2-3 1.5 0 2.8 1 3.2 3" />
    </Icon>
  )
}

export function RefreshIcon() {
  return (
    <Icon width="20" height="20" strokeWidth="2">
      <path d="M20 11a8 8 0 1 0-2.3 5.7" />
      <path d="M20 4v7h-7" />
    </Icon>
  )
}
