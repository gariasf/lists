#!/usr/bin/env python3
"""
Regenerate 4 address locales (es_es, nl_nl, pt_br, en_ca) from scratch.

Original upstream had hallucinated cities + nonsense postal codes (user
flagged Spanish "Lugo de las Torres", "0° E" floor designations, etc.).
This produces 500 plausible addresses per locale using real cities +
their correct postal-code ranges + locale-appropriate formats.

Output: data/lists/audit-overrides/<slug>.txt
"""
import random
from pathlib import Path

random.seed(42)
OVERRIDE_DIR = Path("/Users/guillem.arias/Documents/gariasf/lists/data/lists/audit-overrides")
N = 500

# ---------------------------------------------------------------- Spanish ---
ES_CITIES = [
    ("Madrid", "28"), ("Barcelona", "08"), ("Valencia", "46"), ("Sevilla", "41"),
    ("Bilbao", "48"), ("Zaragoza", "50"), ("Málaga", "29"), ("Murcia", "30"),
    ("Palma", "07"), ("Alicante", "03"), ("Córdoba", "14"), ("Valladolid", "47"),
    ("Vigo", "36"), ("Gijón", "33"), ("A Coruña", "15"), ("Granada", "18"),
    ("Vitoria", "01"), ("Oviedo", "33"), ("Santa Cruz de Tenerife", "38"),
    ("Pamplona", "31"), ("Burgos", "09"), ("Salamanca", "37"), ("Albacete", "02"),
    ("Castellón de la Plana", "12"), ("Logroño", "26"), ("Badajoz", "06"),
    ("Huelva", "21"), ("Tarragona", "43"), ("Lleida", "25"), ("Cádiz", "11"),
    ("Toledo", "45"), ("Almería", "04"), ("Donostia", "20"), ("Santander", "39"),
    ("Las Palmas de Gran Canaria", "35"), ("Elche", "03"), ("Marbella", "29"),
    ("Móstoles", "28"), ("Fuenlabrada", "28"), ("Sabadell", "08"),
    ("Mataró", "08"), ("Cáceres", "10"), ("León", "24"), ("Jaén", "23"),
    ("Lugo", "27"), ("Ourense", "32"), ("Reus", "43"), ("Tarrasa", "08"),
]
ES_STREET_TYPES = ["Calle", "Avenida", "Paseo", "Plaza", "Ronda", "Carrer", "Travesía"]
ES_STREET_NAMES = [
    "Mayor", "Real", "Sol", "Luna", "del Carmen", "de la Constitución",
    "de España", "de Gracia", "de la Princesa", "Serrano", "Velázquez",
    "Goya", "Bravo Murillo", "Alcalá", "Gran Vía", "del Prado", "Recoletos",
    "Colón", "Castellana", "Diagonal", "Balmes", "Aragó", "Provença",
    "Mallorca", "Pelayo", "Rambla", "del Pintor Sorolla", "del Mar",
    "del Río", "de la Reina", "de la Virgen", "San Vicente", "Santa María",
    "San Juan", "San Pedro", "San Pablo", "del Buen Suceso", "del Maestre",
    "Trafalgar", "Cervantes", "Quevedo", "Lope de Vega", "Galdós",
]
ES_DOORS = ["A", "B", "C", "D", "E", "F", "izq.", "dcha.", "cent."]


def gen_spanish():
    out = []
    for _ in range(N):
        city, prefix = random.choice(ES_CITIES)
        postal = f"{prefix}{random.randint(0, 999):03d}"
        st_type = random.choice(ES_STREET_TYPES)
        st_name = random.choice(ES_STREET_NAMES)
        num = random.randint(1, 250)
        if random.random() < 0.65:
            # Multi-storey: floor 1°-7°, door A-E
            floor = random.randint(1, 7)
            door = random.choice(ES_DOORS)
            line = f"{st_type} {st_name}, {num}, {floor}º {door}, {postal}, {city}"
        else:
            line = f"{st_type} {st_name}, {num}, {postal}, {city}"
        out.append(line)
    return out


# ----------------------------------------------------------------- Dutch ---
NL_CITIES = [
    ("Amsterdam", "10"), ("Amsterdam", "11"), ("Rotterdam", "30"),
    ("Den Haag", "25"), ("Utrecht", "35"), ("Eindhoven", "56"),
    ("Groningen", "97"), ("Tilburg", "50"), ("Almere", "13"),
    ("Breda", "48"), ("Nijmegen", "65"), ("Apeldoorn", "73"),
    ("Haarlem", "20"), ("Arnhem", "68"), ("Enschede", "75"),
    ("Amersfoort", "38"), ("Zaanstad", "15"), ("Zoetermeer", "27"),
    ("Maastricht", "62"), ("Leiden", "23"), ("Dordrecht", "33"),
    ("Zwolle", "80"), ("Leeuwarden", "89"), ("Alphen aan den Rijn", "24"),
    ("Alkmaar", "18"), ("Delft", "26"), ("Hilversum", "12"),
    ("Heerlen", "64"), ("Venlo", "59"), ("Roosendaal", "47"),
    ("Hoogeveen", "79"), ("Helmond", "57"), ("Sittard", "61"),
    ("Almelo", "76"), ("Vlaardingen", "31"), ("Spijkenisse", "32"),
    ("Gouda", "28"), ("Lelystad", "82"), ("Purmerend", "14"),
    ("Hengelo", "75"), ("Ede", "67"),
]
NL_STREET_TYPES = [
    "straat", "laan", "weg", "plein", "kade", "singel", "boulevard",
    "park", "hof", "gracht",
]
NL_STREET_BASES = [
    "Nieuwe", "Oude", "Lange", "Korte", "Hoge", "Lage", "Groene", "Rode",
    "Witte", "Stille", "Brede", "Smalle", "Voor", "Achter", "Boven", "Onder",
    "Bree", "Heren", "Konings", "Prinsen", "Wilhelmina", "Beatrix",
    "Juliana", "Emma", "Oranje", "Stationss", "Markt", "Kerk", "School",
    "Molen", "Linden", "Eiken", "Beuken", "Berken", "Iep", "Wilg",
]


def gen_dutch():
    out = []
    for _ in range(N):
        city, prefix = random.choice(NL_CITIES)
        postal_num = f"{prefix}{random.randint(0, 99):02d}"
        postal_letters = "".join(random.choice("ABCDEFGHJKLMNPRSTUVWXYZ") for _ in range(2))
        base = random.choice(NL_STREET_BASES)
        st_type = random.choice(NL_STREET_TYPES)
        num = random.randint(1, 300)
        suffix = ""
        if random.random() < 0.15:
            suffix = random.choice(["a", "b", "c"])
        line = f"{base}{st_type} {num}{suffix} {postal_num} {postal_letters} {city}"
        out.append(line)
    return out


# ------------------------------------------------------------- Brazilian ---
BR_CITIES = [
    ("São Paulo", "SP", "01"), ("Rio de Janeiro", "RJ", "20"),
    ("Salvador", "BA", "40"), ("Brasília", "DF", "70"),
    ("Fortaleza", "CE", "60"), ("Belo Horizonte", "MG", "30"),
    ("Manaus", "AM", "69"), ("Curitiba", "PR", "80"),
    ("Recife", "PE", "50"), ("Porto Alegre", "RS", "90"),
    ("Belém", "PA", "66"), ("Goiânia", "GO", "74"),
    ("Guarulhos", "SP", "07"), ("Campinas", "SP", "13"),
    ("São Luís", "MA", "65"), ("Maceió", "AL", "57"),
    ("Duque de Caxias", "RJ", "25"), ("Natal", "RN", "59"),
    ("Teresina", "PI", "64"), ("São Bernardo do Campo", "SP", "09"),
    ("Nova Iguaçu", "RJ", "26"), ("João Pessoa", "PB", "58"),
    ("Santo André", "SP", "09"), ("Osasco", "SP", "06"),
    ("Jaboatão dos Guararapes", "PE", "54"), ("São José dos Campos", "SP", "12"),
    ("Ribeirão Preto", "SP", "14"), ("Uberlândia", "MG", "38"),
    ("Sorocaba", "SP", "18"), ("Cuiabá", "MT", "78"),
    ("Aracaju", "SE", "49"), ("Feira de Santana", "BA", "44"),
    ("Joinville", "SC", "89"), ("Juiz de Fora", "MG", "36"),
    ("Londrina", "PR", "86"), ("Aparecida de Goiânia", "GO", "74"),
    ("Niterói", "RJ", "24"), ("Florianópolis", "SC", "88"),
    ("Vila Velha", "ES", "29"), ("Vitória", "ES", "29"),
]
BR_STREET_TYPES = [
    "Rua", "Avenida", "Travessa", "Alameda", "Praça", "Largo",
]
BR_STREET_NAMES = [
    "das Flores", "do Comércio", "Augusta", "Paulista", "Atlântica",
    "Brigadeiro Faria Lima", "das Palmeiras", "São João", "São Bento",
    "Santa Cruz", "Sete de Setembro", "Quinze de Novembro", "Vinte e Cinco",
    "do Sol", "Marechal Deodoro", "Domingos de Morais", "Rebouças",
    "Ipiranga", "Tutoia", "Estados Unidos", "Brasil", "do Imperador",
    "do Príncipe", "Princesa Isabel", "Doutor Arnaldo", "Pamplona",
    "Bela Cintra", "Consolação", "Haddock Lobo", "Oscar Freire",
]


def gen_brazilian():
    out = []
    for _ in range(N):
        city, state, prefix = random.choice(BR_CITIES)
        cep_main = f"{prefix}{random.randint(0, 999):03d}"
        cep_suffix = f"{random.randint(0, 999):03d}"
        st_type = random.choice(BR_STREET_TYPES)
        st_name = random.choice(BR_STREET_NAMES)
        num = random.randint(10, 9000)
        # 30% chance of unit number
        unit = ""
        if random.random() < 0.3:
            unit = f", Apto. {random.randint(11, 1502)}"
        line = f"{cep_main}-{cep_suffix}, {st_type} {st_name}, {num}{unit} {city} - {state}"
        out.append(line)
    return out


# -------------------------------------------------------------- Canadian ---
CA_PROVINCES = [
    ("AB", "T"),  # Alberta
    ("BC", "V"),  # British Columbia
    ("MB", "R"),  # Manitoba
    ("NB", "E"),  # New Brunswick
    ("NL", "A"),  # Newfoundland and Labrador
    ("NS", "B"),  # Nova Scotia
    ("NT", "X"),  # Northwest Territories / Nunavut
    ("ON", "K"),  # Ontario (K/L/M/N/P)
    ("ON", "L"),
    ("ON", "M"),
    ("ON", "N"),
    ("ON", "P"),
    ("PE", "C"),  # Prince Edward Island
    ("QC", "G"),  # Quebec (G/H/J)
    ("QC", "H"),
    ("QC", "J"),
    ("SK", "S"),  # Saskatchewan
    ("YT", "Y"),  # Yukon
]
CA_CITIES_BY_PROVINCE = {
    "AB": ["Calgary", "Edmonton", "Red Deer", "Lethbridge", "Sherwood Park"],
    "BC": ["Vancouver", "Victoria", "Surrey", "Burnaby", "Richmond", "Kelowna"],
    "MB": ["Winnipeg", "Brandon", "Steinbach", "Thompson"],
    "NB": ["Moncton", "Saint John", "Fredericton", "Dieppe"],
    "NL": ["St. John's", "Mount Pearl", "Corner Brook", "Conception Bay South"],
    "NS": ["Halifax", "Sydney", "Dartmouth", "Truro"],
    "NT": ["Yellowknife", "Iqaluit", "Whitehorse"],
    "ON": ["Toronto", "Ottawa", "Mississauga", "Brampton", "Hamilton",
           "London", "Markham", "Vaughan", "Kitchener", "Windsor",
           "Burlington", "Oshawa", "Barrie", "Sudbury"],
    "PE": ["Charlottetown", "Summerside", "Stratford"],
    "QC": ["Montréal", "Québec", "Laval", "Gatineau", "Longueuil",
           "Sherbrooke", "Saguenay", "Lévis", "Trois-Rivières"],
    "SK": ["Saskatoon", "Regina", "Prince Albert", "Moose Jaw"],
    "YT": ["Whitehorse", "Dawson City"],
}
CA_STREET_TYPES = [
    "Street", "Avenue", "Road", "Drive", "Lane", "Boulevard", "Court",
    "Place", "Way", "Crescent", "Terrace",
]
CA_STREET_NAMES = [
    "Maple", "Oak", "Cedar", "Pine", "Birch", "Willow", "Spruce",
    "King", "Queen", "Prince", "Princess", "Elm", "Park", "Lake",
    "Hill", "Forest", "River", "Meadow", "Crescent", "Sunset",
    "Sunrise", "Mountain", "Valley", "Bridge", "Mill", "Main",
    "Church", "Station", "Bay", "Harbour", "Beach", "Heritage",
    "Yonge", "Bloor", "Robson", "Granville", "Sparks", "Bank",
    "Wellington", "Albert", "Victoria", "Bay", "Front",
]


def gen_canadian():
    out = []
    for _ in range(N):
        prov, first_letter = random.choice(CA_PROVINCES)
        city = random.choice(CA_CITIES_BY_PROVINCE[prov])
        # FSA: Letter Digit Letter ; LDU: Digit Letter Digit
        # Use real province first letter
        fsa = f"{first_letter}{random.randint(0, 9)}{random.choice('BCEGHJKLMNPRSTVWXYZ')}"
        ldu = f"{random.randint(0, 9)}{random.choice('BCEGHJKLMNPRSTVWXYZ')}{random.randint(0, 9)}"
        postal = f"{fsa} {ldu}"
        num = random.randint(100, 9999)
        st_name = random.choice(CA_STREET_NAMES)
        st_type = random.choice(CA_STREET_TYPES)
        line = f"{num} {st_name} {st_type}, {city}, {prov} {postal}"
        out.append(line)
    return out


def main():
    OVERRIDE_DIR.mkdir(parents=True, exist_ok=True)
    bundles = {
        "address-es_es": gen_spanish(),
        "address-nl_nl": gen_dutch(),
        "address-pt_br": gen_brazilian(),
        "address-en_ca": gen_canadian(),
    }
    for slug, items in bundles.items():
        path = OVERRIDE_DIR / f"{slug}.txt"
        path.write_text("\n".join(items) + "\n")
        print(f"{slug}: {len(items)} items → {path.relative_to(OVERRIDE_DIR.parent.parent.parent)}")


if __name__ == "__main__":
    main()
