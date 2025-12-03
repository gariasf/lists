export interface ListItem {
  slug: string
  name: string
  category: Category
  locale?: string
  items: string[]
}

export type Category =
  | 'all'
  | 'business'
  | 'communication'
  | 'design'
  | 'education'
  | 'entertainment'
  | 'finance'
  | 'food'
  | 'health'
  | 'identity'
  | 'location'
  | 'numbers'
  | 'shopping'
  | 'sports'
  | 'tech'
  | 'text'
  | 'time'

export const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: 'all', label: 'All Lists', icon: 'grid' },
  { id: 'business', label: 'Business', icon: 'briefcase' },
  { id: 'communication', label: 'Communication', icon: 'message' },
  { id: 'design', label: 'Design', icon: 'palette' },
  { id: 'education', label: 'Education', icon: 'graduation' },
  { id: 'entertainment', label: 'Entertainment', icon: 'film' },
  { id: 'finance', label: 'Finance', icon: 'dollar' },
  { id: 'food', label: 'Food', icon: 'utensils' },
  { id: 'health', label: 'Health', icon: 'heart' },
  { id: 'identity', label: 'Identity', icon: 'user' },
  { id: 'location', label: 'Location', icon: 'map' },
  { id: 'numbers', label: 'Numbers', icon: 'hash' },
  { id: 'shopping', label: 'Shopping', icon: 'cart' },
  { id: 'sports', label: 'Sports', icon: 'trophy' },
  { id: 'tech', label: 'Tech', icon: 'cpu' },
  { id: 'text', label: 'Text', icon: 'type' },
  { id: 'time', label: 'Time', icon: 'clock' },
]
