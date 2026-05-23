import { Suspense } from 'react'
import BrowseShell from '@/components/BrowseShell'
import { getAllLists } from '@/lib/lists'

export default async function Home() {
  const lists = await getAllLists()

  return (
    <Suspense fallback={null}>
      <BrowseShell lists={lists} />
    </Suspense>
  )
}
