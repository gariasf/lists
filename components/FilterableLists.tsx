'use client'

import { useState } from 'react'
import { ListItem, Category } from '@/lib/types'
import CategoryNav from './CategoryNav'
import ListGrid from './ListGrid'

interface FilterableListsProps {
  lists: ListItem[]
}

export default function FilterableLists({ lists }: FilterableListsProps) {
  const [activeCategory, setActiveCategory] = useState<Category>('all')

  const filteredLists =
    activeCategory === 'all'
      ? lists
      : lists.filter((list) => list.category === activeCategory)

  return (
    <>
      <CategoryNav
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />
      <ListGrid lists={filteredLists} />
    </>
  )
}
