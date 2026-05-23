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
      if (el) el.style.viewTransitionName = morphName
    }

    document.startViewTransition(() => {
      router.push(target)
    })
  }

  return <Link {...rest} href={href} onClick={handle} />
}
