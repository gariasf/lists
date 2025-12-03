'use client'

import { useState } from 'react'

interface CopyableListItemProps {
  text: string
}

export default function CopyableListItem({ text }: CopyableListItemProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <li className="list-item" onClick={handleCopy}>
      <span className="list-item-text">{text}</span>
      <span className={`list-item-copy ${copied ? 'copied' : ''}`}>
        {copied ? 'Copied!' : 'Click to copy'}
      </span>
    </li>
  )
}
