'use client'

import { Toaster } from 'sonner'
import { useTheme } from '@/lib/use-theme'

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
      toastOptions={{
        classNames: {
          toast: 'app-toast',
        },
      }}
    />
  )
}
