import type { SVGProps, ReactNode } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function makeIcon(paths: ReactNode) {
  const Icon = (props: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={14}
      height={14}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths}
    </svg>
  )
  return Icon
}

export const Search = makeIcon(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </>
)

export const Layers = makeIcon(
  <>
    <path d="M12 2 2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </>
)

export const Briefcase = makeIcon(
  <>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    <path d="M3 13h18" />
  </>
)

export const Message = makeIcon(
  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
)

export const Palette = makeIcon(
  <>
    <circle cx="13.5" cy="6.5" r=".5" />
    <circle cx="17.5" cy="10.5" r=".5" />
    <circle cx="8.5" cy="7.5" r=".5" />
    <circle cx="6.5" cy="12.5" r=".5" />
    <path d="M12 2a10 10 0 1 0 0 20 4 4 0 0 0 0-8 2 2 0 0 1 0-4h2a6 6 0 0 0 0-12 9.96 9.96 0 0 0-2 0z" />
  </>
)

export const Cap = makeIcon(
  <>
    <path d="M22 10v6" />
    <path d="M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c0 1 2 3 6 3s6-2 6-3v-5" />
  </>
)

export const Film = makeIcon(
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M7 3v18M17 3v18M3 7.5h4M3 12h4M3 16.5h4M17 7.5h4M17 12h4M17 16.5h4" />
  </>
)

export const Dollar = makeIcon(
  <>
    <path d="M12 2v20" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </>
)

export const Utensils = makeIcon(
  <>
    <path d="M3 2v7c0 1.1.9 2 2 2h2v11" />
    <path d="M5 2v6.5" />
    <path d="M19 2c-1.5 0-3 1-3 4v6c0 1.1.9 2 2 2h1v8" />
  </>
)

export const Heart = makeIcon(
  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
)

export const User = makeIcon(
  <>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </>
)

export const Map = makeIcon(
  <>
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
    <path d="M9 3v15M15 6v15" />
  </>
)

export const Hash = makeIcon(
  <path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18" />
)

export const Cart = makeIcon(
  <>
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
  </>
)

export const Trophy = makeIcon(
  <>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </>
)

export const Cpu = makeIcon(
  <>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="9" y="9" width="6" height="6" />
    <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />
  </>
)

export const Type = makeIcon(
  <>
    <path d="M4 7V4h16v3" />
    <path d="M9 20h6M12 4v16" />
  </>
)

export const Clock = makeIcon(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </>
)

export const Copy = makeIcon(
  <>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </>
)

export const Check = makeIcon(<path d="M20 6 9 17l-5-5" />)

export const Download = makeIcon(
  <>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M7 10l5 5 5-5" />
    <path d="M12 15V3" />
  </>
)

export const External = makeIcon(
  <>
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </>
)

export const ChevronR = makeIcon(<path d="m9 18 6-6-6-6" />)
export const ChevronL = makeIcon(<path d="m15 18-6-6 6-6" />)
export const ArrowUpRight = makeIcon(
  <>
    <path d="M7 17 17 7" />
    <path d="M7 7h10v10" />
  </>
)

export const Github = makeIcon(
  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
)

export const Moon = makeIcon(
  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
)

export const Sun = makeIcon(
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M5 5l1.5 1.5M17.5 17.5 19 19M2 12h2M20 12h2M5 19l1.5-1.5M17.5 6.5 19 5" />
  </>
)

export const Monitor = makeIcon(
  <>
    <rect x="3" y="4" width="18" height="12" rx="2" />
    <path d="M8 20h8M12 16v4" />
  </>
)

export const Sparkles = makeIcon(
  <>
    <path d="M12 3 13.9 8.1 19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
    <path d="M19 14.5 19.8 16.5 22 17.5 19.8 18.5 19 20.5 18.2 18.5 16 17.5 18.2 16.5 19 14.5z" />
  </>
)

export const Plus = makeIcon(<path d="M12 5v14M5 12h14" />)
export const X = makeIcon(<path d="M18 6 6 18M6 6l12 12" />)

export const Filter = makeIcon(
  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
)

export const More = makeIcon(
  <>
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </>
)

export const Eye = makeIcon(
  <>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </>
)

export const Logo = makeIcon(<path d="M5 7h14M5 12h14M5 17h9" />)

export const Star = makeIcon(
  <path d="M12 2 15.09 8.26 22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
)

export const StarFilled = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={14}
    height={14}
    fill="currentColor"
    aria-hidden="true"
    {...props}
  >
    <path d="M12 2 15.09 8.26 22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
)

export const ArrowRight = makeIcon(<path d="M5 12h14M13 5l7 7-7 7" />)

export const Car = makeIcon(
  <>
    <path d="M5 17h14" />
    <path d="M5 17v-5l2-5h10l2 5v5" />
    <circle cx="7.5" cy="17.5" r="1.5" />
    <circle cx="16.5" cy="17.5" r="1.5" />
    <path d="M7 12h10" />
  </>
)

export const Leaf = makeIcon(
  <>
    <path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 9-10 2 6 2 12 0 17z" />
    <path d="M2 21c2-3 6-7 10-9" />
  </>
)

import type { ComponentType } from 'react'

export const CATEGORY_ICONS: Record<string, ComponentType<IconProps>> = {
  all: Layers,
  business: Briefcase,
  communication: Message,
  culture: Sparkles,
  design: Palette,
  education: Cap,
  entertainment: Film,
  finance: Dollar,
  food: Utensils,
  health: Heart,
  identity: User,
  location: Map,
  nature: Leaf,
  numbers: Hash,
  shopping: Cart,
  sports: Trophy,
  tech: Cpu,
  text: Type,
  time: Clock,
  transport: Car,
}
