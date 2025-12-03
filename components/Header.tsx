import Link from 'next/link'

export default function Header() {
  return (
    <header className="header">
      <Link href="/" className="header-logo">
        Lists
      </Link>
      <nav className="header-nav">
        <a
          href="https://github.com/sponsors/gariasf"
          target="_blank"
          rel="noopener noreferrer"
          className="donate-btn"
        >
          Donate
        </a>
      </nav>
    </header>
  )
}
