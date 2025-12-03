'use client'

import { useEffect, useRef } from 'react'
import Typed from 'typed.js'

export default function Hero() {
  const typedRef = useRef<HTMLSpanElement>(null)
  const typedInstance = useRef<Typed | null>(null)

  useEffect(() => {
    if (typedRef.current) {
      typedInstance.current = new Typed(typedRef.current, {
        strings: [
          'Leonardo DiCaprio',
          'Brooklyn Nets',
          'San Francisco, CA',
          'jennifer@email.com',
          'Rainforest Cafe',
          '(555) 123-4567',
          'Acme Corporation',
          'Harvard University',
          'November 15, 2024',
          '$149.99',
        ],
        typeSpeed: 80,
        backSpeed: 50,
        backDelay: 1500,
        loop: true,
        showCursor: true,
        cursorChar: '|',
      })
    }

    return () => {
      if (typedInstance.current) {
        typedInstance.current.destroy()
      }
    }
  }, [])

  return (
    <section className="hero">
      <p className="hero-subtitle">Real content for all your designs.</p>
      <div className="hero-typed-container">
        <span className="hero-corner-bottom-left"></span>
        <span className="hero-corner-bottom-right"></span>
        <h1>
          <span ref={typedRef}></span>
        </h1>
      </div>
    </section>
  )
}
