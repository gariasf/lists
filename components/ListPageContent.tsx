'use client'

import CopyableListItem from './CopyableListItem'

interface ListPageContentProps {
  items: string[]
  listName: string
  slug: string
}

export default function ListPageContent({ items, listName, slug }: ListPageContentProps) {
  const allItemsText = items.join('\n')
  const jsonData = JSON.stringify(items, null, 2)

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(allItemsText)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleDownloadJson = () => {
    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${slug}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleOpenJson = () => {
    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  return (
    <>
      <div className="list-page-actions">
        <button className="btn btn-primary" onClick={handleDownloadJson}>
          Download JSON
        </button>
        <button className="btn btn-secondary" onClick={handleOpenJson}>
          Open JSON
        </button>
      </div>

      <ul className="list-page-items">
        {items.map((item, index) => (
          <CopyableListItem key={index} text={item} />
        ))}
      </ul>
    </>
  )
}
