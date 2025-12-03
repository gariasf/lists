import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="list-page" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>List Not Found</h1>
        <p style={{ color: '#666', marginBottom: '2rem' }}>
          The list you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/" className="btn btn-primary">
          Back to Home
        </Link>
      </main>
      <Footer />
    </>
  )
}
