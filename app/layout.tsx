import type { Metadata } from "next";
import "./globals.css";

const BASE_URL = "https://lists.gariasf.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Lists - Real content for designers",
    template: "%s | Lists",
  },
  description:
    "Real content for your designs. Curated lists of names, places, companies, emails, and more. Copy-paste realistic data for mockups and prototypes.",
  keywords: [
    "design",
    "mockup",
    "placeholder content",
    "realistic data",
    "lists",
    "names",
    "dummy data",
    "UI design",
    "prototype",
    "figma",
    "sketch",
  ],
  authors: [{ name: "Lists" }],
  creator: "Lists",
  publisher: "Lists",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "Lists",
    title: "Lists - Real content for designers",
    description:
      "Real content for your designs. Curated lists of names, places, companies, and more for mockups.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lists - Real content for designers",
    description:
      "Real content for your designs. Curated lists of names, places, companies, and more.",
  },
  alternates: {
    canonical: BASE_URL,
  },
  category: "design tools",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Lists",
    description:
      "Real content for your designs. Curated lists of names, places, companies, and more.",
    url: BASE_URL,
    applicationCategory: "DesignApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <html lang="en">
      <head>
        <link rel="canonical" href={BASE_URL} />
        <meta name="theme-color" content="#2979ff" />
        <meta name="msapplication-TileColor" content="#2979ff" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
