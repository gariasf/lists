import { Category } from './types'

export interface UpstreamSource {
  file: string
}

export interface LocalSource {
  file: string
  format: 'txt' | 'json'
  valueKey?: string
}

export interface ListDefinition {
  slug: string
  name: string
  category: Category
  upstream?: UpstreamSource
  local?: LocalSource
  layer?: 'append' | 'replace'
}

export const LIST_DEFINITIONS: ListDefinition[] = [
  // Identity
  { slug: 'names', name: 'Names', category: 'identity', upstream: { file: 'names.txt' } },
  { slug: 'names-en_us', name: 'Names (US)', category: 'identity', upstream: { file: 'names-en_US.txt' } },
  { slug: 'names-en_gb', name: 'Names (UK)', category: 'identity', upstream: { file: 'names-en_GB.txt' } },
  { slug: 'names-de_de', name: 'Names (German)', category: 'identity', upstream: { file: 'names-de_DE.txt' } },
  { slug: 'names-es_es', name: 'Names (Spanish)', category: 'identity', upstream: { file: 'names-es_ES.txt' } },
  { slug: 'names-fr_fr', name: 'Names (French)', category: 'identity', upstream: { file: 'names-fr_FR.txt' } },
  { slug: 'names-nl_nl', name: 'Names (Dutch)', category: 'identity', upstream: { file: 'names-nl_NL.txt' } },
  { slug: 'names-pt_pt', name: 'Names (Portuguese)', category: 'identity', upstream: { file: 'names-pt_PT.txt' } },
  { slug: 'nameslong', name: 'Full Names', category: 'identity', upstream: { file: 'nameslong.txt' } },
  { slug: 'namesinitial', name: 'Names with Initial', category: 'identity', upstream: { file: 'namesinitial.txt' } },
  { slug: 'celebrities', name: 'Celebrities', category: 'identity', upstream: { file: 'celebrities.txt' } },
  { slug: 'leaders', name: 'World Leaders', category: 'identity', upstream: { file: 'leaders.txt' } },
  { slug: 'jobs', name: 'Job Titles', category: 'identity', upstream: { file: 'jobs.txt' }, local: { file: 'jobs-modern.txt', format: 'txt' }, layer: 'append' },

  // Identity (local additions)
  { slug: 'pronouns', name: 'Pronouns', category: 'identity', local: { file: 'pronouns.txt', format: 'txt' } },
  { slug: 'usernames', name: 'Usernames', category: 'identity', local: { file: 'usernames.txt', format: 'txt' } },
  { slug: 'bios-short', name: 'Bios (short)', category: 'identity', local: { file: 'bios-short.txt', format: 'txt' } },
  { slug: 'avatars-dicebear', name: 'Avatar URLs', category: 'identity', local: { file: 'avatars-dicebear.json', format: 'json', valueKey: 'url' } },
  { slug: 'names-ja_jp', name: 'Names (Japanese, romanized)', category: 'identity', local: { file: 'names-ja_JP.txt', format: 'txt' } },
  { slug: 'names-ja_jp-native', name: 'Names (Japanese, native)', category: 'identity', local: { file: 'names-ja_JP-native.txt', format: 'txt' } },
  { slug: 'names-ko_kr', name: 'Names (Korean, romanized)', category: 'identity', local: { file: 'names-ko_KR.txt', format: 'txt' } },
  { slug: 'names-ko_kr-native', name: 'Names (Korean, native)', category: 'identity', local: { file: 'names-ko_KR-native.txt', format: 'txt' } },
  { slug: 'names-zh_cn', name: 'Names (Chinese, romanized)', category: 'identity', local: { file: 'names-zh_CN.txt', format: 'txt' } },
  { slug: 'names-zh_cn-native', name: 'Names (Chinese, native)', category: 'identity', local: { file: 'names-zh_CN-native.txt', format: 'txt' } },
  { slug: 'names-it_it', name: 'Names (Italian)', category: 'identity', local: { file: 'names-it_IT.txt', format: 'txt' } },
  { slug: 'names-ru_ru', name: 'Names (Russian, romanized)', category: 'identity', local: { file: 'names-ru_RU.txt', format: 'txt' } },
  { slug: 'names-pl_pl', name: 'Names (Polish)', category: 'identity', local: { file: 'names-pl_PL.txt', format: 'txt' } },
  { slug: 'names-sv_se', name: 'Names (Swedish)', category: 'identity', local: { file: 'names-sv_SE.txt', format: 'txt' } },
  { slug: 'names-ar', name: 'Names (Arabic, romanized)', category: 'identity', local: { file: 'names-ar.txt', format: 'txt' } },
  { slug: 'names-hi_in', name: 'Names (Indian, romanized)', category: 'identity', local: { file: 'names-hi_IN.txt', format: 'txt' } },
  { slug: 'names-tr_tr', name: 'Names (Turkish)', category: 'identity', local: { file: 'names-tr_TR.txt', format: 'txt' } },

  // Location
  { slug: 'address-en_us', name: 'Addresses (US)', category: 'location', upstream: { file: 'address-en_US.txt' } },
  { slug: 'address-en_gb', name: 'Addresses (UK)', category: 'location', upstream: { file: 'address-en_GB.txt' } },
  { slug: 'address-en_ca', name: 'Addresses (Canada)', category: 'location', upstream: { file: 'address-en_CA.txt' } },
  { slug: 'address-de_de', name: 'Addresses (German)', category: 'location', upstream: { file: 'address-de_DE.txt' } },
  { slug: 'address-es_es', name: 'Addresses (Spanish)', category: 'location', upstream: { file: 'address-es_ES.txt' } },
  { slug: 'address-fr_fr', name: 'Addresses (French)', category: 'location', upstream: { file: 'address-fr_FR.txt' } },
  { slug: 'address-nl_nl', name: 'Addresses (Dutch)', category: 'location', upstream: { file: 'address-nl_NL.txt' } },
  { slug: 'address-pt_br', name: 'Addresses (Brazil)', category: 'location', upstream: { file: 'address-pt_BR.txt' } },
  { slug: 'cities', name: 'Cities', category: 'location', upstream: { file: 'cities.txt' } },
  { slug: 'cities-nl_nl', name: 'Cities (Dutch)', category: 'location', upstream: { file: 'cities-nl_NL.txt' } },
  { slug: 'countries', name: 'Countries', category: 'location', upstream: { file: 'countries.txt' } },
  { slug: 'airports-en', name: 'Airports', category: 'location', upstream: { file: 'airports-en.txt' } },
  { slug: 'airports-en_us', name: 'Airports (US)', category: 'location', upstream: { file: 'airports-en_US.txt' } },
  { slug: 'gpscoordinates', name: 'GPS Coordinates', category: 'location', upstream: { file: 'gpscoordinates.txt' } },
  { slug: 'hotels', name: 'Hotels', category: 'location', upstream: { file: 'hotels.txt' } },

  // Location (local additions)
  { slug: 'country-codes', name: 'Country Codes', category: 'location', local: { file: 'country-codes.json', format: 'json', valueKey: 'name' } },
  { slug: 'timezones-iana', name: 'Timezones (IANA)', category: 'location', local: { file: 'timezones-iana.txt', format: 'txt' } },
  { slug: 'states-us', name: 'US States', category: 'location', local: { file: 'states-us.txt', format: 'txt' } },
  { slug: 'states-ca', name: 'Canadian Provinces', category: 'location', local: { file: 'states-ca.txt', format: 'txt' } },
  { slug: 'states-mx', name: 'Mexican States', category: 'location', local: { file: 'states-mx.txt', format: 'txt' } },
  { slug: 'states-au', name: 'Australian States', category: 'location', local: { file: 'states-au.txt', format: 'txt' } },
  { slug: 'states-br', name: 'Brazilian States', category: 'location', local: { file: 'states-br.txt', format: 'txt' } },
  { slug: 'states-in', name: 'Indian States', category: 'location', local: { file: 'states-in.txt', format: 'txt' } },
  { slug: 'postal-zip-us', name: 'ZIP Codes (US)', category: 'location', local: { file: 'postal-zip-us.txt', format: 'txt' } },
  { slug: 'postal-uk', name: 'Postcodes (UK)', category: 'location', local: { file: 'postal-uk.txt', format: 'txt' } },
  { slug: 'postal-de', name: 'Postal Codes (German)', category: 'location', local: { file: 'postal-de.txt', format: 'txt' } },
  { slug: 'postal-fr', name: 'Postal Codes (French)', category: 'location', local: { file: 'postal-fr.txt', format: 'txt' } },
  { slug: 'postal-jp', name: 'Postal Codes (Japanese)', category: 'location', local: { file: 'postal-jp.txt', format: 'txt' } },
  { slug: 'postal-br', name: 'Postal Codes (Brazil)', category: 'location', local: { file: 'postal-br.txt', format: 'txt' } },
  { slug: 'postal-in', name: 'Postal Codes (Indian PIN)', category: 'location', local: { file: 'postal-in.txt', format: 'txt' } },
  { slug: 'postal-ca', name: 'Postal Codes (Canada)', category: 'location', local: { file: 'postal-ca.txt', format: 'txt' } },
  { slug: 'postal-au', name: 'Postal Codes (Australia)', category: 'location', local: { file: 'postal-au.txt', format: 'txt' } },

  // Business
  { slug: 'companies', name: 'Companies', category: 'business', upstream: { file: 'companies.txt' } },
  { slug: 'companiesfake', name: 'Fake Companies', category: 'business', upstream: { file: 'companiesfake.txt' } },
  { slug: 'banks', name: 'Banks', category: 'business', upstream: { file: 'banks.txt' } },
  { slug: 'budgetbusiness-en', name: 'Business Budget Items', category: 'business', upstream: { file: 'budgetbusiness-en.txt' } },
  { slug: 'budgetcategories-en', name: 'Budget Categories', category: 'business', upstream: { file: 'budgetcategories-en.txt' } },
  { slug: 'budgetspendings-en', name: 'Budget Spendings', category: 'business', upstream: { file: 'budgetspendings-en.txt' } },
  { slug: 'dunsnumber-en_us', name: 'DUNS Numbers', category: 'business', upstream: { file: 'dunsnumber-en_US.txt' } },
  { slug: 'ein-en_us', name: 'EIN Numbers', category: 'business', upstream: { file: 'ein-en_US.txt' } },

  // Communication
  { slug: 'emailaddresses', name: 'Email Addresses', category: 'communication', upstream: { file: 'emailaddresses.txt' } },
  { slug: 'emailsubjects-en', name: 'Email Subjects', category: 'communication', upstream: { file: 'emailsubjects-en.txt' } },
  { slug: 'phone-en_us', name: 'Phone Numbers (US)', category: 'communication', upstream: { file: 'phone-en_US.txt' } },
  { slug: 'phone-en_gb', name: 'Phone Numbers (UK)', category: 'communication', upstream: { file: 'phone-en_GB.txt' } },
  { slug: 'languages', name: 'Languages', category: 'communication', upstream: { file: 'languages.txt' } },

  // Communication (local additions — more phone locales)
  { slug: 'phone-de_de', name: 'Phone Numbers (German)', category: 'communication', local: { file: 'phone-de_DE.txt', format: 'txt' } },
  { slug: 'phone-fr_fr', name: 'Phone Numbers (French)', category: 'communication', local: { file: 'phone-fr_FR.txt', format: 'txt' } },
  { slug: 'phone-jp_jp', name: 'Phone Numbers (Japanese)', category: 'communication', local: { file: 'phone-jp_JP.txt', format: 'txt' } },
  { slug: 'phone-in_in', name: 'Phone Numbers (Indian)', category: 'communication', local: { file: 'phone-in_IN.txt', format: 'txt' } },
  { slug: 'phone-au_au', name: 'Phone Numbers (Australian)', category: 'communication', local: { file: 'phone-au_AU.txt', format: 'txt' } },
  { slug: 'phone-br_br', name: 'Phone Numbers (Brazilian)', category: 'communication', local: { file: 'phone-br_BR.txt', format: 'txt' } },
  { slug: 'phone-mx_mx', name: 'Phone Numbers (Mexican)', category: 'communication', local: { file: 'phone-mx_MX.txt', format: 'txt' } },

  // Finance
  { slug: 'creditcardnumber', name: 'Credit Card Numbers', category: 'finance', upstream: { file: 'creditcardnumber.txt' } },
  { slug: 'creditcardexpiration', name: 'Card Expiration Dates', category: 'finance', upstream: { file: 'creditcardexpiration.txt' } },
  { slug: 'creditcardtype', name: 'Credit Card Types', category: 'finance', upstream: { file: 'creditcardtype.txt' } },
  { slug: 'currencies', name: 'Currencies', category: 'finance', upstream: { file: 'currencies.txt' } },
  { slug: 'iban', name: 'IBAN Numbers', category: 'finance', upstream: { file: 'iban.txt' } },
  { slug: 'bitcoinaddresses', name: 'Bitcoin Addresses', category: 'finance', upstream: { file: 'bitcoinaddresses.txt' } },

  // Shopping
  { slug: 'prices0to99-dollar', name: 'Prices $0-99', category: 'shopping', upstream: { file: 'prices0to99-dollar.txt' } },
  { slug: 'prices0to099-dollar', name: 'Prices $0.00-0.99', category: 'shopping', upstream: { file: 'prices0to099-dollar.txt' } },
  { slug: 'prices100to999-dollar', name: 'Prices $100-999', category: 'shopping', upstream: { file: 'prices100to999-dollar.txt' } },
  { slug: 'pricesthousand-dollar', name: 'Prices $1000+', category: 'shopping', upstream: { file: 'pricesthousand-dollar.txt' } },
  { slug: 'prices0to99-euro', name: 'Prices €0-99', category: 'shopping', upstream: { file: 'prices0to99-euro.txt' } },
  { slug: 'prices0to099-euro', name: 'Prices €0.00-0.99', category: 'shopping', upstream: { file: 'prices0to099-euro.txt' } },
  { slug: 'prices100to999-euro', name: 'Prices €100-999', category: 'shopping', upstream: { file: 'prices100to999-euro.txt' } },
  { slug: 'pricesthousand-euro', name: 'Prices €1000+', category: 'shopping', upstream: { file: 'pricesthousand-euro.txt' } },
  { slug: 'prices0to99-pound', name: 'Prices £0-99', category: 'shopping', upstream: { file: 'prices0to99-pound.txt' } },
  { slug: 'prices0to099-pound', name: 'Prices £0.00-0.99', category: 'shopping', upstream: { file: 'prices0to099-pound.txt' } },
  { slug: 'prices100to999-pound', name: 'Prices £100-999', category: 'shopping', upstream: { file: 'prices100to999-pound.txt' } },
  { slug: 'pricesthousand-pound', name: 'Prices £1000+', category: 'shopping', upstream: { file: 'pricesthousand-pound.txt' } },
  { slug: 'clothes-en', name: 'Clothing Items', category: 'shopping', upstream: { file: 'clothes-en.txt' } },
  { slug: 'gifts-en', name: 'Gift Ideas', category: 'shopping', upstream: { file: 'gifts-en.txt' } },

  // Food
  { slug: 'food-en', name: 'Food Items', category: 'food', upstream: { file: 'food-en.txt' } },
  { slug: 'fruits-en', name: 'Fruits', category: 'food', upstream: { file: 'fruits-en.txt' } },

  // Entertainment
  { slug: 'movies', name: 'Movies', category: 'entertainment', upstream: { file: 'movies.txt' } },
  { slug: 'musicartists', name: 'Music Artists', category: 'entertainment', upstream: { file: 'musicartists.txt' } },
  { slug: 'musicsongs', name: 'Songs', category: 'entertainment', upstream: { file: 'musicsongs.txt' } },
  { slug: 'bookstitles-en', name: 'Book Titles', category: 'entertainment', upstream: { file: 'bookstitles-en.txt' } },
  { slug: 'booksauthors', name: 'Book Authors', category: 'entertainment', upstream: { file: 'booksauthors.txt' } },
  { slug: 'bookspublishers', name: 'Book Publishers', category: 'entertainment', upstream: { file: 'bookspublishers.txt' } },
  { slug: 'booksisbn', name: 'ISBN Numbers', category: 'entertainment', upstream: { file: 'booksisbn.txt' } },
  { slug: 'events', name: 'Events', category: 'entertainment', upstream: { file: 'events.txt' } },

  // Sports
  { slug: 'articlessports-en', name: 'Sports Articles', category: 'sports', upstream: { file: 'articlessports-en.txt' } },
  { slug: 'headlinessports-en', name: 'Sports Headlines', category: 'sports', upstream: { file: 'headlinessports-en.txt' } },
  { slug: 'durationmarathon', name: 'Marathon Times', category: 'sports', upstream: { file: 'durationmarathon.txt' } },

  // Tech
  { slug: 'devicesphones', name: 'Phone Models', category: 'tech', upstream: { file: 'devicesphones.txt' } },
  { slug: 'deviceslaptops', name: 'Laptop Models', category: 'tech', upstream: { file: 'deviceslaptops.txt' } },
  { slug: 'devicestablets', name: 'Tablet Models', category: 'tech', upstream: { file: 'devicestablets.txt' } },
  { slug: 'fileformats', name: 'File Formats', category: 'tech', upstream: { file: 'fileformats.txt' } },
  { slug: 'mimetype', name: 'MIME Types', category: 'tech', upstream: { file: 'mimetype.txt' } },
  { slug: 'ipv4', name: 'IPv4 Addresses', category: 'tech', upstream: { file: 'ipv4.txt' } },
  { slug: 'ipv6', name: 'IPv6 Addresses', category: 'tech', upstream: { file: 'ipv6.txt' } },
  { slug: 'hashmd5', name: 'MD5 Hashes', category: 'tech', upstream: { file: 'hashmd5.txt' } },
  { slug: 'hashsha1', name: 'SHA1 Hashes', category: 'tech', upstream: { file: 'hashsha1.txt' } },
  { slug: 'articlestech-en', name: 'Tech Articles', category: 'tech', upstream: { file: 'articlestech-en.txt' } },
  { slug: 'headlinestech-en', name: 'Tech Headlines', category: 'tech', upstream: { file: 'headlinestech-en.txt' } },

  // Design
  { slug: 'colors-en', name: 'Color Names', category: 'design', upstream: { file: 'colors-en.txt' } },
  { slug: 'colorshex', name: 'Hex Colors', category: 'design', upstream: { file: 'colorshex.txt' } },
  { slug: 'colorsrgb', name: 'RGB Colors', category: 'design', upstream: { file: 'colorsrgb.txt' } },

  // Numbers
  { slug: 'numbers0to99', name: 'Numbers 0-99', category: 'numbers', upstream: { file: 'numbers0to99.txt' } },
  { slug: 'numbers0to099', name: 'Numbers 0.00-0.99', category: 'numbers', upstream: { file: 'numbers0to099.txt' } },
  { slug: 'numbers100to999', name: 'Numbers 100-999', category: 'numbers', upstream: { file: 'numbers100to999.txt' } },
  { slug: 'numbersthousand', name: 'Numbers 1000+', category: 'numbers', upstream: { file: 'numbersthousand.txt' } },
  { slug: 'numberpercentages', name: 'Percentages', category: 'numbers', upstream: { file: 'numberpercentages.txt' } },

  // Time
  { slug: 'calendar-en', name: 'Calendar Dates', category: 'time', upstream: { file: 'calendar-en.txt' } },
  { slug: 'datesddmmy', name: 'Dates (DD/MM/YY)', category: 'time', upstream: { file: 'datesddmmy.txt' } },
  { slug: 'datesddmmyslash-en', name: 'Dates (DD/MM/YYYY)', category: 'time', upstream: { file: 'datesddmmyslash-en.txt' } },
  { slug: 'datesmmddydash', name: 'Dates (MM-DD-YY)', category: 'time', upstream: { file: 'datesmmddydash.txt' } },
  { slug: 'datesmmddyslash', name: 'Dates (MM/DD/YY)', category: 'time', upstream: { file: 'datesmmddyslash.txt' } },
  { slug: 'datestimestamps-en', name: 'Timestamps', category: 'time', upstream: { file: 'datestimestamps-en.txt' } },
  { slug: 'durationsong', name: 'Song Durations', category: 'time', upstream: { file: 'durationsong.txt' } },
  { slug: 'durationmovie', name: 'Movie Durations', category: 'time', upstream: { file: 'durationmovie.txt' } },
  { slug: 'durationshortfilm', name: 'Short Film Durations', category: 'time', upstream: { file: 'durationshortfilm.txt' } },
  { slug: 'durationsleep', name: 'Sleep Durations', category: 'time', upstream: { file: 'durationsleep.txt' } },
  { slug: 'frequency-en', name: 'Frequency Terms', category: 'time', upstream: { file: 'frequency-en.txt' } },

  // Text
  { slug: 'adjectives-en', name: 'Adjectives', category: 'text', upstream: { file: 'adjectives-en.txt' } },
  { slug: 'objects-en', name: 'Objects', category: 'text', upstream: { file: 'objects-en.txt' } },
  { slug: 'animals-en', name: 'Animals', category: 'nature', upstream: { file: 'animals-en.txt' } },
  { slug: 'dinosaurs-en', name: 'Dinosaurs', category: 'nature', upstream: { file: 'dinosaurs-en.txt' } },
  { slug: 'excuses-en', name: 'Excuses', category: 'text', upstream: { file: 'excuses-en.txt' } },
  { slug: 'phobias-en', name: 'Phobias', category: 'text', upstream: { file: 'phobias-en.txt' } },
  { slug: 'navigation-en', name: 'Navigation Labels', category: 'text', upstream: { file: 'navigation-en.txt' } },
  { slug: 'articlesscience-en', name: 'Science Articles', category: 'text', upstream: { file: 'articlesscience-en.txt' } },
  { slug: 'articlesworld-en', name: 'World News Articles', category: 'text', upstream: { file: 'articlesworld-en.txt' } },
  { slug: 'headlinesscience-en', name: 'Science Headlines', category: 'text', upstream: { file: 'headlinesscience-en.txt' } },
  { slug: 'headlinesworld-en', name: 'World Headlines', category: 'text', upstream: { file: 'headlinesworld-en.txt' } },

  // Education
  { slug: 'colleges-en_us', name: 'US Colleges', category: 'education', upstream: { file: 'colleges-en_US.txt' } },

  // Transport (was Health bucket — car brands/models belong here)
  { slug: 'carbrands', name: 'Car Brands', category: 'transport', upstream: { file: 'carbrands.txt' } },
  { slug: 'carmodels', name: 'Car Models', category: 'transport', upstream: { file: 'carmodels.txt' } },
]
