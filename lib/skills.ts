export type SkillKnobType = 'number' | 'text' | 'select'

export interface SkillKnob {
  name: string
  label: string
  type: SkillKnobType
  default: number | string
  min?: number
  max?: number
  options?: { value: string; label: string }[]
  placeholder?: string
  description?: string
}

export interface SkillDef {
  slug: string
  name: string
  tagline: string
  description: string
  icon: string
  /** Field names to surface as primary columns in the result preview. Others render as JSON. */
  primaryFields?: string[]
  knobs: SkillKnob[]
  example?: string
}

const LOCALE_OPTIONS = [
  { value: 'en_US', label: 'English (United States)' },
  { value: 'en_GB', label: 'English (United Kingdom)' },
  { value: 'ja_JP', label: 'Japanese' },
  { value: 'ko_KR', label: 'Korean' },
  { value: 'zh_CN', label: 'Chinese (Simplified)' },
  { value: 'es_ES', label: 'Spanish' },
  { value: 'fr_FR', label: 'French' },
  { value: 'de_DE', label: 'German' },
  { value: 'it_IT', label: 'Italian' },
  { value: 'pt_BR', label: 'Portuguese (Brazil)' },
  { value: 'hi_IN', label: 'Hindi (India)' },
]

const COUNTRY_OPTIONS = [
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'IT', label: 'Italy' },
  { value: 'ES', label: 'Spain' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'JP', label: 'Japan' },
  { value: 'KR', label: 'South Korea' },
  { value: 'CN', label: 'China' },
  { value: 'IN', label: 'India' },
  { value: 'BR', label: 'Brazil' },
  { value: 'MX', label: 'Mexico' },
  { value: 'AU', label: 'Australia' },
  { value: 'CA', label: 'Canada' },
]

export const SKILLS: SkillDef[] = [
  {
    slug: 'realistic-user',
    name: 'Realistic User',
    tagline: 'Locale-coherent profile cards',
    description:
      'Generate user profiles where the name, company, city, email, and bio all belong to the same locale. Includes a working avatar URL.',
    icon: 'user',
    primaryFields: ['name', 'role', 'email', 'company', 'city'],
    knobs: [
      { name: 'count', label: 'Count', type: 'number', default: 5, min: 1, max: 20 },
      {
        name: 'locale',
        label: 'Locale',
        type: 'select',
        default: 'en_US',
        options: LOCALE_OPTIONS,
      },
    ],
    example: 'name · role · email · company · city · bio · avatar URL',
  },
  {
    slug: 'pricing-page',
    name: 'Pricing Page',
    tagline: 'Tiered SaaS pricing structure',
    description:
      'Generate a pricing page with 3-5 tiers, prices that grow geometrically, a free entry, an enterprise "Contact us" tier, and 4-6 features each.',
    icon: 'dollar',
    primaryFields: ['name', 'price', 'billing', 'cta'],
    knobs: [
      {
        name: 'productType',
        label: 'Product',
        type: 'text',
        default: 'a B2B project management tool',
        placeholder: 'a B2B project management tool',
      },
      {
        name: 'tierCount',
        label: 'Tiers',
        type: 'number',
        default: 4,
        min: 3,
        max: 5,
      },
    ],
    example: 'tiers: name + tagline + price + cta + features[] + highlight',
  },
  {
    slug: 'order-receipt',
    name: 'Order Receipt',
    tagline: 'Complete e-commerce receipt',
    description:
      'Generate a self-consistent order receipt: line items, totals that actually add up, a realistic carrier + tracking number, and a sensible ETA.',
    icon: 'cart',
    primaryFields: ['order_number', 'customer_name', 'total', 'tracking_number'],
    knobs: [
      {
        name: 'category',
        label: 'Product category',
        type: 'text',
        default: 'consumer electronics',
        placeholder: 'consumer electronics',
      },
      {
        name: 'itemCount',
        label: 'Line items',
        type: 'number',
        default: 3,
        min: 1,
        max: 10,
      },
    ],
    example: 'order# · customer · items[] · subtotal · tax · total · tracking',
  },
  {
    slug: 'customer-card',
    name: 'Customer Card',
    tagline: 'Testimonial blocks with avatars',
    description:
      'Generate testimonial cards: a short quote, the reviewer\'s name, role, company, and an avatar URL. Useful for marketing pages and case-study layouts.',
    icon: 'message',
    primaryFields: ['name', 'role', 'company', 'quote'],
    knobs: [
      { name: 'count', label: 'Count', type: 'number', default: 4, min: 1, max: 10 },
      {
        name: 'tone',
        label: 'Tone',
        type: 'select',
        default: 'warm',
        options: [
          { value: 'warm', label: 'Warm + enthusiastic' },
          { value: 'professional', label: 'Professional + measured' },
          { value: 'casual', label: 'Casual + conversational' },
        ],
      },
    ],
    example: 'quote · name · role · company · avatar URL',
  },
  {
    slug: 'address-block',
    name: 'Address Block',
    tagline: 'Country-aware postal addresses',
    description:
      'Generate postal addresses with correct per-country format and field ordering. Street + city + region + postal code all match the country\'s real conventions.',
    icon: 'map',
    primaryFields: ['name', 'street1', 'city', 'postal_code', 'country'],
    knobs: [
      {
        name: 'country',
        label: 'Country',
        type: 'select',
        default: 'US',
        options: COUNTRY_OPTIONS,
      },
      { name: 'count', label: 'Count', type: 'number', default: 3, min: 1, max: 15 },
    ],
    example: 'recipient · street · city · region · postal code · country',
  },
]

export function getSkill(slug: string): SkillDef | undefined {
  return SKILLS.find((s) => s.slug === slug)
}
