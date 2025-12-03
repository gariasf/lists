import { ListItem } from '@/lib/types'
import ListCard from './ListCard'

interface ListGridProps {
  lists: ListItem[]
}

export default function ListGrid({ lists }: ListGridProps) {
  if (lists.length === 0) {
    return (
      <div className="list-grid">
        <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#666' }}>
          No lists found in this category.
        </p>
      </div>
    )
  }

  return (
    <div className="list-grid">
      {lists.map((list) => (
        <ListCard key={list.slug} list={list} />
      ))}
    </div>
  )
}
