'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ComponentProps, MouseEvent } from 'react'

type LinkProps = ComponentProps<typeof Link>
type TLinkProps = LinkProps & {
  morphSelector?: string
  morphName?: string
}

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

function waitForPath(target: string, timeoutMs: number): Promise<void> {
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

export default function TLink({
  morphSelector,
  morphName,
  onClick,
  href,
  ...rest
}: TLinkProps) {
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

    if (morphSelector && morphName) {
      document
        .querySelectorAll<HTMLElement>(morphSelector)
        .forEach((el) => {
          el.style.viewTransitionName = ''
        })
      const el = e.currentTarget.querySelector<HTMLElement>(morphSelector)
      if (el) {
        el.style.viewTransitionName = morphName
        void el.offsetHeight
      }
    }

    document.startViewTransition(async () => {
      router.push(target)
      await waitForPath(target, 1500)
    })
  }

  return <Link {...rest} href={href} onClick={handle} />
}
