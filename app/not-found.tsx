import Link from 'next/link'

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 32,
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.012em' }}>
        List not found
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
        The list you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link href="/" className="btn btn-primary">
        Back to all lists
      </Link>
    </main>
  )
}
