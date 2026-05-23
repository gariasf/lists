'use client'

import { useCallback, useEffect, useState } from 'react'

export type ThemeMode = 'system' | 'light' | 'dark'
export type ThemeEffective = 'light' | 'dark'

const STORAGE_KEY = 'lists.theme'

function readStoredMode(): ThemeMode {
  if (typeof window === 'undefined') return 'system'
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (raw === 'light' || raw === 'dark' || raw === 'system') return raw
  return 'system'
}

function prefersDark(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function computeEffective(mode: ThemeMode): ThemeEffective {
  if (mode === 'system') return prefersDark() ? 'dark' : 'light'
  return mode
}

function applyTheme(effective: ThemeEffective) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (effective === 'dark') root.setAttribute('data-theme', 'dark')
  else root.removeAttribute('data-theme')
}

/**
 * Theme state with a third "system" mode that follows OS preference.
 * Reacts to OS changes while in system mode.
 */
export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>('system')
  const [effective, setEffective] = useState<ThemeEffective>('light')

  // Init from storage + media query
  useEffect(() => {
    const initial = readStoredMode()
    setModeState(initial)
    const eff = computeEffective(initial)
    setEffective(eff)
    applyTheme(eff)
  }, [])

  // Listen for OS changes while in system mode
  useEffect(() => {
    if (mode !== 'system' || typeof window === 'undefined') return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => {
      const eff: ThemeEffective = e.matches ? 'dark' : 'light'
      setEffective(eff)
      applyTheme(eff)
    }
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [mode])

  // Listen for cross-tab updates
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return
      const next = readStoredMode()
      setModeState(next)
      const eff = computeEffective(next)
      setEffective(eff)
      applyTheme(eff)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next)
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, next)
      } catch {
        /* storage disabled — ignore */
      }
    }
    const eff = computeEffective(next)
    setEffective(eff)
    applyTheme(eff)
  }, [])

  const cycleMode = useCallback(() => {
    setMode(mode === 'system' ? 'light' : mode === 'light' ? 'dark' : 'system')
  }, [mode, setMode])

  return { mode, effective, setMode, cycleMode }
}
