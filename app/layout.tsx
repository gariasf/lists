import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lists - Real content for designers',
  description: 'Real content for your app. Usable data for your mockup. Curated lists of names, places, companies, and more for designers.',
  keywords: ['design', 'mockup', 'placeholder', 'content', 'lists', 'data'],
  openGraph: {
    title: 'Lists - Real content for designers',
    description: 'Real content for your app. Usable data for your mockup.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
