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

/**
 * Link wrapper that runs the navigation inside document.startViewTransition()
 * when the browser supports it. Otherwise falls back to Next's regular
 * client-side navigation — no perceived difference for the user.
 *
 * - Modifier-clicks (cmd/ctrl/shift/alt) and middle-clicks bypass the
 *   transition so "open in new tab" still works.
 * - prefers-reduced-motion users get a vanilla cut.
 */
export default function TLink(props: LinkProps) {
  const router = useRouter()
  const { onClick, href, ...rest } = props

  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e)
    if (shouldBypass(e)) return

    if (typeof document.startViewTransition !== 'function') return
    if (prefersReducedMotion()) return

    e.preventDefault()
    const target =
      typeof href === 'string' ? href : (href as { pathname?: string }).pathname ?? '/'
    document.startViewTransition(() => {
      router.push(target)
    })
  }

  return <Link {...rest} href={href} onClick={handle} />
}
