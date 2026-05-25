'use client'

import { Toaster } from 'sonner'
import { useTheme } from '@/lib/use-theme'

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      width={12}
      height={12}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3.5 8.5 7 12l5.5-7" />
    </svg>
  )
}

function CrossIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      width={12}
      height={12}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 4 4 12M4 4l8 8" />
    </svg>
  )
}

export default function ToasterClient() {
  const { mode } = useTheme()
  return (
    <Toaster
      theme={mode}
      position="bottom-center"
      duration={1800}
      visibleToasts={3}
      gap={8}
      offset={24}
      icons={{
        success: <CheckIcon />,
        error: <CrossIcon />,
      }}
      toastOptions={{
        classNames: {
          toast: 'app-toast',
        },
      }}
    />
  )
}
