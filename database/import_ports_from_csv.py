"""
Import ports from 'Country and Port.csv' into the port table.
- Parses both SEA and AIR sections
- Skips duplicates (port_code is UNIQUE)
- Matches country to country_id via country_name_en
"""

import pymysql
import re

CSV_PATH = r'c:\logitrack\LogiTrack--update-status-report-20260126023903\Country and Port.csv'

# ── Country name aliases (CSV name → DB country_name_en) ──────────────
COUNTRY_ALIASES = {
    'UK': 'United Kingdom',
    'USA': 'United States',
    'Korea': 'South Korea',
    "Côte D'Ivoire": "Cote D'Ivoire",
    'Cote D\'Ivoire': "Cote D'Ivoire",
    'Trinidad And Tobago': 'Trinidad and Tobago',
    'Trinidad and Tobago': 'Trinidad and Tobago',
    'Saint Vincent And The Grenadines': 'Saint Vincent and the Grenadines',
    'Congo': 'Democratic Republic of Congo',
    'Russia': 'Russian Federation',
    'Czech Republic': 'Czechia',
    'Bolivia': 'Bolivia',
    'Papua New Guinea': 'Papua New Guinea',
    'French Guiana': 'French Guiana',
    'Kosovo': 'Kosovo',
    'South Sudan': 'South Sudan',
    'Somalia': 'Somalia',
    'Uganda': 'Uganda',
}

# ── Country name → 2-letter ISO code (for fallback generation) ─────────
COUNTRY_ISO = {
    'Albania': 'AL', 'Algeria': 'DZ', 'Antigua': 'AG', 'Argentina': 'AR',
    'Australia': 'AU', 'Austria': 'AT', 'Bahamas': 'BS', 'Bahrain': 'BH',
    'Bangladesh': 'BD', 'Barbados': 'BB', 'Belgium': 'BE', 'Benin': 'BJ',
    'Bolivia': 'BO', 'Brazil': 'BR', 'Brunei': 'BN', 'Bulgaria': 'BG',
    'Burkina Faso': 'BF', 'Cambodia': 'KH', 'Cameroon': 'CM', 'Canada': 'CA',
    'Chile': 'CL', 'China': 'CN', 'Colombia': 'CO', 'Congo': 'CD',
    'Costa Rica': 'CR', "Côte D'Ivoire": 'CI', 'Croatia': 'HR', 'Cuba': 'CU',
    'Cyprus': 'CY', 'Czech Republic': 'CZ', 'Denmark': 'DK', 'Djibouti': 'DJ',
    'Dominican': 'DO', 'Ecuador': 'EC', 'Egypt': 'EG', 'El Salvador': 'SV',
    'Estonia': 'EE', 'Fiji': 'FJ', 'Finland': 'FI', 'France': 'FR',
    'French Guiana': 'GF', 'French Polynesia': 'PF', 'Gabon': 'GA',
    'Georgia': 'GE', 'Germany': 'DE', 'Ghana': 'GH', 'Greece': 'GR',
    'Grenada': 'GD', 'Guadeloupe': 'GP', 'Guinea': 'GN', 'Guyana': 'GY',
    'Haiti': 'HT', 'Honduras': 'HN', 'Hong Kong': 'HK', 'Hungary': 'HU',
    'India': 'IN', 'Indonesia': 'ID', 'Iraq': 'IQ', 'Ireland': 'IE',
    'Israel': 'IL', 'Italy': 'IT', 'Japan': 'JP', 'Jordan': 'JO',
    'Kazakhstan': 'KZ', 'Kenya': 'KE', 'Korea': 'KR', 'Kosovo': 'XK',
    'Kuwait': 'KW', 'Kyrgyzstan': 'KG', 'Latvia': 'LV', 'Lebanon': 'LB',
    'Liberia': 'LR', 'Libya': 'LY', 'Lithuania': 'LT', 'Macau': 'MO',
    'Madagascar': 'MG', 'Malaysia': 'MY', 'Maldives': 'MV', 'Malta': 'MT',
    'Mauritius': 'MU', 'Mayotte': 'YT', 'Mexico': 'MX', 'Mongolia': 'MN',
    'Morocco': 'MA', 'Mozambique': 'MZ', 'Namibia': 'NA', 'Netherlands': 'NL',
    'New Caledonia': 'NC', 'New Zealand': 'NZ', 'Nigeria': 'NG', 'Norway': 'NO',
    'Oman': 'OM', 'Pakistan': 'PK', 'Panama': 'PA', 'Papua New Guinea': 'PG',
    'Paraguay': 'PY', 'Peru': 'PE', 'Philippines': 'PH', 'Poland': 'PL',
    'Portugal': 'PT', 'Puerto Rico': 'PR', 'Qatar': 'QA', 'Reunion': 'RE',
    'Romania': 'RO', 'Russia': 'RU', 'Saint Barthelemy': 'BL',
    'Saint Vincent And The Grenadines': 'VC', 'Saudi Arabia': 'SA',
    'Senegal': 'SN', 'Seychelles': 'SC', 'Sierra Leone': 'SL',
    'Singapore': 'SG', 'Slovakia': 'SK', 'Slovenia': 'SI',
    'Somalia': 'SO', 'South Africa': 'ZA', 'South Sudan': 'SS',
    'Spain': 'ES', 'Sri Lanka': 'LK', 'Suriname': 'SR', 'Sweden': 'SE',
    'Switzerland': 'CH', 'Taiwan': 'TW', 'Tanzania': 'TZ', 'Thailand': 'TH',
    'Togo': 'TG', 'Trinidad And Tobago': 'TT', 'Trinidad and Tobago': 'TT',
    'Tunisia': 'TN', 'Turkey': 'TR', 'Uganda': 'UG',
    'UK': 'GB', 'United Arab Emirates': 'AE', 'Uruguay': 'UY',
    'USA': 'US', 'Venezuela': 'VE', 'Vietnam': 'VN',
}


def parse_csv(filepath):
    """Parse CSV into list of (country, port_name, display_name, port_code, port_type)"""
    ports = []
    current_mode = None  # 'SEA' or 'AIR'

    with open(filepath, encoding='utf-8-sig') as f:
        for raw_line in f:
            line = raw_line.rstrip('\n').rstrip('\r')
            stripped = line.strip()

            # Detect section headers
            if 'SEA port code' in stripped:
                current_mode = 'SEA'
                continue
            if 'AIR  port code' in stripped or 'AIR port code' in stripped:
                current_mode = 'AIR'
                continue
            if not current_mode:
                continue

            # Skip header rows (Country / port name / Display name / port code)
            if stripped.startswith('Country') and 'port name' in stripped:
                continue
            # Skip empty lines
            if not stripped:
                continue

            # Split by tab first, then handle "/" delimiter
            # The CSV is tab-separated: Country \t / \t port name \t / \t Display name \t / \t port code
            parts = line.split('\t')
            # Remove empty and "/" tokens, strip whitespace
            parts = [p.strip() for p in parts]
            parts = [p for p in parts if p and p != '/']

            if len(parts) < 4:
                continue

            country = parts[0].strip()
            port_name_raw = parts[1].strip()
            display_name = parts[2].strip()
            port_code = parts[3].strip()

            # Skip header row entries
            if country == 'Country' or port_name_raw == 'port name':
                continue

            # Skip if port_code looks invalid (too short or contains spaces etc.)
            if not port_code or len(port_code) < 2:
                continue

            # For AIR: display_name format = "CODE - Full Airport Name, Country"
            # Extract actual port_name from display_name
            if current_mode == 'AIR':
                # "VIE - Vienna International Airport, Austria"
                match = re.match(r'^[A-Z]+\s*-\s*(.+)$', display_name)
                if match:
                    display_name = match.group(1).strip()

            ports.append((country, port_name_raw, display_name, port_code, current_mode))

    return ports


def get_db_data(conn):
    cur = conn.cursor()
    # Get country map: name_en -> (id, country_code)
    cur.execute("SELECT id, country_code, country_name_en FROM country")
    country_by_name = {}
    country_by_code = {}
    for row in cur.fetchall():
        cid, ccode, cname = row
        country_by_name[cname.strip()] = (cid, ccode)
        country_by_code[ccode.strip()] = (cid, cname)

    # Get existing port codes
    cur.execute("SELECT port_code FROM port")
    existing_codes = set(r[0].strip().upper() for r in cur.fetchall())

    return country_by_name, country_by_code, existing_codes


def resolve_country(csv_country, country_by_name):
    """Return (country_id, country_code) or (None, None)"""
    name = csv_country.strip()
    # Direct match
    if name in country_by_name:
        return country_by_name[name]
    # Try alias
    alias = COUNTRY_ALIASES.get(name)
    if alias and alias in country_by_name:
        return country_by_name[alias]
    # Partial match (case-insensitive)
    name_lower = name.lower()
    for k, v in country_by_name.items():
        if k.lower() == name_lower:
            return v
    # Try ISO lookup to get code, then match by code
    iso = COUNTRY_ISO.get(name)
    if iso:
        for k, v in country_by_name.items():
            if v[1] == iso:
                return v
    return (None, None)


def main():
    print("Parsing CSV...")
    ports = parse_csv(CSV_PATH)
    print(f"  Parsed {len(ports)} port entries from CSV")

    # Check for duplicates within CSV (same port_code)
    seen_codes = {}
    deduped = []
    for p in ports:
        code = p[3].strip().upper().rstrip()
        if code not in seen_codes:
            seen_codes[code] = p
            deduped.append(p)
        else:
            print(f"  [SKIP-DUP in CSV] {code} - {p[1]} ({p[0]}) vs {seen_codes[code][1]}")
    print(f"  After CSV dedup: {len(deduped)} unique port codes")

    conn = pymysql.connect(host='localhost', user='root', password='ldf123',
                           db='logitrack', charset='utf8mb4', autocommit=False)
    try:
        country_by_name, country_by_code, existing_codes = get_db_data(conn)
        print(f"  DB has {len(existing_codes)} existing ports, {len(country_by_name)} countries")

        cur = conn.cursor()
        inserted = 0
        skipped_dup = 0
        skipped_no_country = 0
        no_country_list = []

        for (csv_country, port_name_raw, display_name, port_code_raw, port_type) in deduped:
            port_code = port_code_raw.strip().upper().rstrip()

            # Skip if already exists in DB
            if port_code in existing_codes:
                skipped_dup += 1
                continue

            # Resolve country
            country_id, country_code = resolve_country(csv_country, country_by_name)

            if country_id is None:
                # Try ISO fallback
                iso = COUNTRY_ISO.get(csv_country)
                if iso:
                    country_code = iso
                    # Try to find id by iso code
                    for k, v in country_by_name.items():
                        if v[1] == iso:
                            country_id = v[0]
                            break

            if country_code is None:
                iso = COUNTRY_ISO.get(csv_country)
                country_code = iso

            if country_id is None:
                skipped_no_country += 1
                no_country_list.append((csv_country, port_code, port_name_raw))
                # Still insert with NULL country_id if we have country_code
                if country_code is None:
                    print(f"  [NO COUNTRY] {csv_country} | {port_code} | {port_name_raw}")
                    continue

            # Build port_name = "City, Country" (use display_name which already has this format)
            port_name = display_name.strip()
            # city = raw port name from CSV
            city = port_name_raw.strip()

            cur.execute("""
                INSERT INTO port (port_code, port_name, country_id, city, country_code, port_type, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, 1)
            """, (port_code, port_name, country_id, city, country_code, port_type))
            inserted += 1
            existing_codes.add(port_code)  # prevent re-insert in same run

        conn.commit()
        print(f"\n=== Import Summary ===")
        print(f"  Inserted:           {inserted}")
        print(f"  Skipped (existing): {skipped_dup}")
        print(f"  Skipped (no country in DB): {skipped_no_country}")
        if no_country_list:
            print(f"  Countries not found:")
            for c, pc, pn in no_country_list:
                print(f"    - {c} | {pc} | {pn}")

        # Final count
        cur.execute("SELECT COUNT(*) FROM port")
        total = cur.fetchone()[0]
        cur.execute("SELECT port_type, COUNT(*) FROM port GROUP BY port_type")
        by_type = cur.fetchall()
        print(f"\n  Total ports in DB now: {total}")
        for row in by_type:
            print(f"    {row[0]}: {row[1]}")

    finally:
        conn.close()


if __name__ == '__main__':
    main()
