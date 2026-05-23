'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ComponentProps, MouseEvent } from 'react'

type LinkProps = ComponentProps<typeof Link>

function shouldBypass(e: MouseEvent<HTMLAnchorElement>): boolean {
  if (e.defaultPrevented) return true
  if (e.button !== 0) return true
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return true
  return false
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function normalizePath(p: string): string {
  const noQuery = p.split('?')[0].split('#')[0]
  return noQuery.endsWith('/') ? noQuery : noQuery + '/'
}

export function waitForPath(target: string, timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    const goal = normalizePath(target)
    const start = performance.now()
    let done = false
    const finish = () => {
      if (done) return
      done = true
      resolve()
    }
    const tick = () => {
      if (done) return
      if (normalizePath(window.location.pathname) === goal) {
        setTimeout(finish, 32)
        return
      }
      if (performance.now() - start > timeoutMs) {
        finish()
        return
      }
      setTimeout(tick, 16)
    }
    tick()
  })
}

export default function TLink({ onClick, href, ...rest }: LinkProps) {
  const router = useRouter()

  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e)
    if (shouldBypass(e)) return

    if (typeof document.startViewTransition !== 'function') return
    if (prefersReducedMotion()) return

    e.preventDefault()
    const target =
      typeof href === 'string'
        ? href
        : (href as { pathname?: string }).pathname ?? '/'

    document.startViewTransition(async () => {
      router.push(target)
      await waitForPath(target, 1500)
    })
  }

  return <Link {...rest} href={href} onClick={handle} />
}
