import type { Metadata } from "next";
import "./globals.css";
import { PaletteProvider } from "@/lib/palette-context";
import CommandPalette from "@/components/CommandPalette";
import ToasterClient from "@/components/ToasterClient";
import { getAllLists } from "@/lib/lists";

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lists = await getAllLists();
  const catalog = lists.map((l) => ({
    slug: l.slug,
    name: l.name,
    category: l.category,
  }));

  const webAppLd = {
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

  const webSiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Lists",
    url: BASE_URL,
    description:
      "365 curated lists of realistic mock data for designers and developers.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  // Speculation Rules: tells Chromium browsers to prerender list / skill
  // detail pages on hover (~200ms hold). Click → instant nav, no flash.
  // Safari + Firefox ignore the script and fall back to Next's in-viewport
  // prefetch (~50-100ms click → display). Browsers cap concurrent prerenders
  // and skip when Save-Data is on, so we don't need a manual budget.
  const speculationRules = {
    prerender: [
      {
        source: 'document',
        where: {
          and: [
            {
              href_matches: [
                '/list/*',
                '/skills/*',
              ],
            },
          ],
        },
        eagerness: 'moderate',
      },
    ],
  }

  return (
    <html lang="en">
      <head>
        <link rel="canonical" href={BASE_URL} />
        <meta name="theme-color" content="#0B0B0B" />
        <meta name="msapplication-TileColor" content="#0B0B0B" />

        {/* Avatar service used by skill detail pages — warm the connection
            during initial load so the first avatar fetch skips DNS + TLS. */}
        <link rel="dns-prefetch" href="https://api.dicebear.com" />
        <link rel="preconnect" href="https://api.dicebear.com" crossOrigin="anonymous" />

        {/* Critical font weights. Regular + Medium cover ~95% of glyphs on
            every page. Preloading saves the first-paint blocking fetch. */}
        <link
          rel="preload"
          href="/fonts/geist/Geist-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/geist/Geist-Medium.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />

        {/* The palette's search index is ~670 KB. Browser fetches it during
            idle so the first ⌘K open is instant instead of waiting for a
            cold request. */}
        <link rel="prefetch" href="/search-index.json" as="fetch" crossOrigin="anonymous" />

        <script
          // Pre-paint theme resolver. Runs before React hydration to avoid
          // a flash of light theme when the user prefers dark.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=localStorage.getItem('lists.theme');var eff;if(m==='dark'||m==='light'){eff=m;}else{eff=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(eff==='dark'){document.documentElement.setAttribute('data-theme','dark');}}catch(e){}})();`,
          }}
        />
        <script
          type="speculationrules"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(speculationRules) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteLd) }}
        />
      </head>
      <body>
        <PaletteProvider catalog={catalog}>
          {children}
          <CommandPalette />
        </PaletteProvider>
        <ToasterClient />
      </body>
    </html>
  );
}
