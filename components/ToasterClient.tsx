'use client'

import { Toaster } from 'sonner'
import { useTheme } from '@/lib/use-theme'

function CheckIcon() {
  // Disc + check in one SVG so proportions are locked. Disc fills the
  // full 18×18 box; check sits centered inside with tuned stroke.
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 18 18"
      width={18}
      height={18}
      aria-hidden="true"
    >
      <circle cx="9" cy="9" r="9" fill="#ffffff" />
      <path
        d="M5 9.4 7.8 12.2 13 6.6"
        fill="none"
        stroke="#0b0b0b"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CrossIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 18 18"
      width={18}
      height={18}
      aria-hidden="true"
    >
      <circle cx="9" cy="9" r="9" fill="#ffffff" />
      <path
        d="M12.2 5.8 5.8 12.2M5.8 5.8l6.4 6.4"
        fill="none"
        stroke="#b13a2a"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LoadingIcon() {
  // Spinner arc rendered with pure-SVG animateTransform so it spins
  // regardless of CSS state. White disc matches the success/error
  // glyphs so all toast states share the same chip silhouette.
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 18 18"
      width={18}
      height={18}
      aria-hidden="true"
    >
      <circle cx="9" cy="9" r="9" fill="#ffffff" />
      <circle
        cx="9"
        cy="9"
        r="5.5"
        fill="none"
        stroke="rgba(11, 11, 11, 0.15)"
        strokeWidth={1.6}
      />
      <path
        d="M9 3.5 A 5.5 5.5 0 0 1 14.5 9"
        fill="none"
        stroke="#0b0b0b"
        strokeWidth={1.6}
        strokeLinecap="round"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 9 9"
          to="360 9 9"
          dur="0.75s"
          repeatCount="indefinite"
        />
      </path>
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
        loading: <LoadingIcon />,
      }}
      toastOptions={{
        classNames: {
          toast: 'app-toast',
        },
      }}
    />
  )
}
