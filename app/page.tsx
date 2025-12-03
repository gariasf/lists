import Header from '@/components/Header'
import Hero from '@/components/Hero'
import FilterableLists from '@/components/FilterableLists'
import Footer from '@/components/Footer'
import { getAllLists } from '@/lib/lists'

export default async function Home() {
  const lists = await getAllLists()

  return (
    <>
      <Header />
      <main>
        <Hero />
        <FilterableLists lists={lists} />
      </main>
      <Footer />
    </>
  )
}
