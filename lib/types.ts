export interface ListItem {
  slug: string
  name: string
  category: Category
  locale?: string
  items: string[]
  structured?: Record<string, unknown>[]
  format: 'txt' | 'json'
}

export type Category =
  | 'all'
  | 'business'
  | 'communication'
  | 'culture'
  | 'design'
  | 'education'
  | 'entertainment'
  | 'finance'
  | 'food'
  | 'health'
  | 'identity'
  | 'location'
  | 'nature'
  | 'numbers'
  | 'shopping'
  | 'sports'
  | 'tech'
  | 'text'
  | 'time'
  | 'transport'

export const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: 'all', label: 'All Lists', icon: 'grid' },
  { id: 'identity', label: 'Identity', icon: 'user' },
  { id: 'location', label: 'Location', icon: 'map' },
  { id: 'business', label: 'Business', icon: 'briefcase' },
  { id: 'communication', label: 'Communication', icon: 'message' },
  { id: 'finance', label: 'Finance', icon: 'dollar' },
  { id: 'shopping', label: 'Shopping', icon: 'cart' },
  { id: 'food', label: 'Food', icon: 'utensils' },
  { id: 'entertainment', label: 'Entertainment', icon: 'film' },
  { id: 'sports', label: 'Sports', icon: 'trophy' },
  { id: 'tech', label: 'Tech', icon: 'cpu' },
  { id: 'design', label: 'Design', icon: 'palette' },
  { id: 'numbers', label: 'Numbers', icon: 'hash' },
  { id: 'time', label: 'Time', icon: 'clock' },
  { id: 'text', label: 'Text', icon: 'type' },
  { id: 'education', label: 'Education', icon: 'graduation' },
  { id: 'transport', label: 'Transport', icon: 'car' },
  { id: 'health', label: 'Health', icon: 'heart' },
  { id: 'nature', label: 'Nature', icon: 'leaf' },
  { id: 'culture', label: 'Culture', icon: 'sparkles' },
]
