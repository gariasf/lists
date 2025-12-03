import Link from 'next/link'
import { ListItem } from '@/lib/types'
import { getPreviewItems } from '@/lib/lists'

interface ListCardProps {
  list: ListItem
}

export default function ListCard({ list }: ListCardProps) {
  const previewItems = getPreviewItems(list.items, 8)

  return (
    <Link href={`/list/${list.slug}/`} className="list-card">
      <div className="list-card-header">
        <h2 className="list-card-title">{list.name}</h2>
      </div>
      <ul className="list-card-items">
        {previewItems.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
      <div className="list-card-footer">
        <span className="list-card-button">Open {list.name}</span>
      </div>
    </Link>
  )
}
