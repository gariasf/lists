import { Category } from './types'

interface ListDefinition {
  file: string
  name: string
  category: Category
}

export const LIST_DEFINITIONS: ListDefinition[] = [
  // Identity
  { file: 'names.txt', name: 'Names', category: 'identity' },
  { file: 'names-en_US.txt', name: 'Names (US)', category: 'identity' },
  { file: 'names-en_GB.txt', name: 'Names (UK)', category: 'identity' },
  { file: 'names-de_DE.txt', name: 'Names (German)', category: 'identity' },
  { file: 'names-es_ES.txt', name: 'Names (Spanish)', category: 'identity' },
  { file: 'names-fr_FR.txt', name: 'Names (French)', category: 'identity' },
  { file: 'names-nl_NL.txt', name: 'Names (Dutch)', category: 'identity' },
  { file: 'names-pt_PT.txt', name: 'Names (Portuguese)', category: 'identity' },
  { file: 'nameslong.txt', name: 'Full Names', category: 'identity' },
  { file: 'namesinitial.txt', name: 'Names with Initial', category: 'identity' },
  { file: 'celebrities.txt', name: 'Celebrities', category: 'identity' },
  { file: 'leaders.txt', name: 'World Leaders', category: 'identity' },
  { file: 'jobs.txt', name: 'Job Titles', category: 'identity' },

  // Location
  { file: 'address-en_US.txt', name: 'Addresses (US)', category: 'location' },
  { file: 'address-en_GB.txt', name: 'Addresses (UK)', category: 'location' },
  { file: 'address-en_CA.txt', name: 'Addresses (Canada)', category: 'location' },
  { file: 'address-de_DE.txt', name: 'Addresses (German)', category: 'location' },
  { file: 'address-es_ES.txt', name: 'Addresses (Spanish)', category: 'location' },
  { file: 'address-fr_FR.txt', name: 'Addresses (French)', category: 'location' },
  { file: 'address-nl_NL.txt', name: 'Addresses (Dutch)', category: 'location' },
  { file: 'address-pt_BR.txt', name: 'Addresses (Brazil)', category: 'location' },
  { file: 'cities.txt', name: 'Cities', category: 'location' },
  { file: 'cities-nl_NL.txt', name: 'Cities (Dutch)', category: 'location' },
  { file: 'countries.txt', name: 'Countries', category: 'location' },
  { file: 'airports-en.txt', name: 'Airports', category: 'location' },
  { file: 'airports-en_US.txt', name: 'Airports (US)', category: 'location' },
  { file: 'gpscoordinates.txt', name: 'GPS Coordinates', category: 'location' },
  { file: 'hotels.txt', name: 'Hotels', category: 'location' },

  // Business
  { file: 'companies.txt', name: 'Companies', category: 'business' },
  { file: 'companiesfake.txt', name: 'Fake Companies', category: 'business' },
  { file: 'banks.txt', name: 'Banks', category: 'business' },
  { file: 'budgetbusiness-en.txt', name: 'Business Budget Items', category: 'business' },
  { file: 'budgetcategories-en.txt', name: 'Budget Categories', category: 'business' },
  { file: 'budgetspendings-en.txt', name: 'Budget Spendings', category: 'business' },
  { file: 'dunsnumber-en_US.txt', name: 'DUNS Numbers', category: 'business' },
  { file: 'ein-en_US.txt', name: 'EIN Numbers', category: 'business' },

  // Communication
  { file: 'emailaddresses.txt', name: 'Email Addresses', category: 'communication' },
  { file: 'emailsubjects-en.txt', name: 'Email Subjects', category: 'communication' },
  { file: 'phone-en_US.txt', name: 'Phone Numbers (US)', category: 'communication' },
  { file: 'phone-en_GB.txt', name: 'Phone Numbers (UK)', category: 'communication' },
  { file: 'languages.txt', name: 'Languages', category: 'communication' },

  // Finance
  { file: 'creditcardnumber.txt', name: 'Credit Card Numbers', category: 'finance' },
  { file: 'creditcardexpiration.txt', name: 'Card Expiration Dates', category: 'finance' },
  { file: 'creditcardtype.txt', name: 'Credit Card Types', category: 'finance' },
  { file: 'currencies.txt', name: 'Currencies', category: 'finance' },
  { file: 'iban.txt', name: 'IBAN Numbers', category: 'finance' },
  { file: 'bitcoinaddresses.txt', name: 'Bitcoin Addresses', category: 'finance' },

  // Shopping
  { file: 'prices0to99-dollar.txt', name: 'Prices $0-99', category: 'shopping' },
  { file: 'prices0to099-dollar.txt', name: 'Prices $0.00-0.99', category: 'shopping' },
  { file: 'prices100to999-dollar.txt', name: 'Prices $100-999', category: 'shopping' },
  { file: 'pricesthousand-dollar.txt', name: 'Prices $1000+', category: 'shopping' },
  { file: 'prices0to99-euro.txt', name: 'Prices €0-99', category: 'shopping' },
  { file: 'prices0to099-euro.txt', name: 'Prices €0.00-0.99', category: 'shopping' },
  { file: 'prices100to999-euro.txt', name: 'Prices €100-999', category: 'shopping' },
  { file: 'pricesthousand-euro.txt', name: 'Prices €1000+', category: 'shopping' },
  { file: 'prices0to99-pound.txt', name: 'Prices £0-99', category: 'shopping' },
  { file: 'prices0to099-pound.txt', name: 'Prices £0.00-0.99', category: 'shopping' },
  { file: 'prices100to999-pound.txt', name: 'Prices £100-999', category: 'shopping' },
  { file: 'pricesthousand-pound.txt', name: 'Prices £1000+', category: 'shopping' },
  { file: 'clothes-en.txt', name: 'Clothing Items', category: 'shopping' },
  { file: 'gifts-en.txt', name: 'Gift Ideas', category: 'shopping' },

  // Food
  { file: 'food-en.txt', name: 'Food Items', category: 'food' },
  { file: 'fruits-en.txt', name: 'Fruits', category: 'food' },

  // Entertainment
  { file: 'movies.txt', name: 'Movies', category: 'entertainment' },
  { file: 'musicartists.txt', name: 'Music Artists', category: 'entertainment' },
  { file: 'musicsongs.txt', name: 'Songs', category: 'entertainment' },
  { file: 'bookstitles-en.txt', name: 'Book Titles', category: 'entertainment' },
  { file: 'booksauthors.txt', name: 'Book Authors', category: 'entertainment' },
  { file: 'bookspublishers.txt', name: 'Book Publishers', category: 'entertainment' },
  { file: 'booksisbn.txt', name: 'ISBN Numbers', category: 'entertainment' },
  { file: 'events.txt', name: 'Events', category: 'entertainment' },

  // Sports
  { file: 'articlessports-en.txt', name: 'Sports Articles', category: 'sports' },
  { file: 'headlinessports-en.txt', name: 'Sports Headlines', category: 'sports' },
  { file: 'durationmarathon.txt', name: 'Marathon Times', category: 'sports' },

  // Tech
  { file: 'devicesphones.txt', name: 'Phone Models', category: 'tech' },
  { file: 'deviceslaptops.txt', name: 'Laptop Models', category: 'tech' },
  { file: 'devicestablets.txt', name: 'Tablet Models', category: 'tech' },
  { file: 'fileformats.txt', name: 'File Formats', category: 'tech' },
  { file: 'mimetype.txt', name: 'MIME Types', category: 'tech' },
  { file: 'ipv4.txt', name: 'IPv4 Addresses', category: 'tech' },
  { file: 'ipv6.txt', name: 'IPv6 Addresses', category: 'tech' },
  { file: 'hashmd5.txt', name: 'MD5 Hashes', category: 'tech' },
  { file: 'hashsha1.txt', name: 'SHA1 Hashes', category: 'tech' },
  { file: 'articlestech-en.txt', name: 'Tech Articles', category: 'tech' },
  { file: 'headlinestech-en.txt', name: 'Tech Headlines', category: 'tech' },

  // Design
  { file: 'colors-en.txt', name: 'Color Names', category: 'design' },
  { file: 'colorshex.txt', name: 'Hex Colors', category: 'design' },
  { file: 'colorsrgb.txt', name: 'RGB Colors', category: 'design' },

  // Numbers
  { file: 'numbers0to99.txt', name: 'Numbers 0-99', category: 'numbers' },
  { file: 'numbers0to099.txt', name: 'Numbers 0.00-0.99', category: 'numbers' },
  { file: 'numbers100to999.txt', name: 'Numbers 100-999', category: 'numbers' },
  { file: 'numbersthousand.txt', name: 'Numbers 1000+', category: 'numbers' },
  { file: 'numberpercentages.txt', name: 'Percentages', category: 'numbers' },

  // Time
  { file: 'calendar-en.txt', name: 'Calendar Dates', category: 'time' },
  { file: 'datesddmmy.txt', name: 'Dates (DD/MM/YY)', category: 'time' },
  { file: 'datesddmmyslash-en.txt', name: 'Dates (DD/MM/YYYY)', category: 'time' },
  { file: 'datesmmddydash.txt', name: 'Dates (MM-DD-YY)', category: 'time' },
  { file: 'datesmmddyslash.txt', name: 'Dates (MM/DD/YY)', category: 'time' },
  { file: 'datestimestamps-en.txt', name: 'Timestamps', category: 'time' },
  { file: 'durationsong.txt', name: 'Song Durations', category: 'time' },
  { file: 'durationmovie.txt', name: 'Movie Durations', category: 'time' },
  { file: 'durationshortfilm.txt', name: 'Short Film Durations', category: 'time' },
  { file: 'durationsleep.txt', name: 'Sleep Durations', category: 'time' },
  { file: 'frequency-en.txt', name: 'Frequency Terms', category: 'time' },

  // Text
  { file: 'adjectives-en.txt', name: 'Adjectives', category: 'text' },
  { file: 'objects-en.txt', name: 'Objects', category: 'text' },
  { file: 'animals-en.txt', name: 'Animals', category: 'text' },
  { file: 'dinosaurs-en.txt', name: 'Dinosaurs', category: 'text' },
  { file: 'excuses-en.txt', name: 'Excuses', category: 'text' },
  { file: 'phobias-en.txt', name: 'Phobias', category: 'text' },
  { file: 'navigation-en.txt', name: 'Navigation Labels', category: 'text' },
  { file: 'articlesscience-en.txt', name: 'Science Articles', category: 'text' },
  { file: 'articlesworld-en.txt', name: 'World News Articles', category: 'text' },
  { file: 'headlinesscience-en.txt', name: 'Science Headlines', category: 'text' },
  { file: 'headlinesworld-en.txt', name: 'World Headlines', category: 'text' },

  // Education
  { file: 'colleges-en_US.txt', name: 'US Colleges', category: 'education' },

  // Health
  { file: 'carbrands.txt', name: 'Car Brands', category: 'health' },
  { file: 'carmodels.txt', name: 'Car Models', category: 'health' },
]

export function getSlugFromFile(file: string): string {
  return file.replace('.txt', '').toLowerCase()
}
