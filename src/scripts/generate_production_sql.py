# Python Script to Generate Complete SQL with All 662 SEs
# Run this locally to generate full SQL file

# Organizational data from your spreadsheet
org_data = """
ABERDARE|GADIN MAGADA|DEBORAH MWINZI
ABERDARE|GADIN MAGADA|ELIZABETH KARIUKO MBOGO
ABERDARE|GADIN MAGADA|GEOFREY  YONGE
ABERDARE|GADIN MAGADA|HILDA JEPKEMBOI MISOI
ABERDARE|GADIN MAGADA|INNOCENT MUTINDI
ABERDARE|GADIN MAGADA|ISAAC MBATIA
ABERDARE|GADIN MAGADA|JOHN MUIRURI KIMANI
ABERDARE|GADIN MAGADA|MARY MATILDA GITHINJI
ABERDARE|GADIN MAGADA|NICHOLUS MWANGI
ABERDARE|GADIN MAGADA|PHILIP WAMBUA
ABERDARE|GADIN MAGADA|RICHARD WAMUYU
ABERDARE|KEZIAH WANGARI|ABIGAEL GATHONI
ABERDARE|KEZIAH WANGARI|BEATRICE NJERI
ABERDARE|KEZIAH WANGARI|CAROLINE NZILANI
ABERDARE|KEZIAH WANGARI|CAROLINE WANDIA
ABERDARE|KEZIAH WANGARI|EMMACULATE OUMA
ABERDARE|KEZIAH WANGARI|GODFFREY IRUNGU
ABERDARE|KEZIAH WANGARI|GOGO SIMEON ONGOSO
ABERDARE|KEZIAH WANGARI|IVENE NJERI WANJIRU
ABERDARE|KEZIAH WANGARI|JANET WANGECHI KIMAITHO
ABERDARE|KEZIAH WANGARI|JOSEPH WAWERU
ABERDARE|KEZIAH WANGARI|LIZA MICHENI 
ABERDARE|KEZIAH WANGARI|MARGARET MINITU MBUGUA
ABERDARE|KEZIAH WANGARI|MARY GICHERU
ABERDARE|KEZIAH WANGARI|PATRICIA WANGARURO
ABERDARE|KEZIAH WANGARI|Paul Mburu
ABERDARE|KEZIAH WANGARI|POLLY WANGIRU KINYUA
ABERDARE|KEZIAH WANGARI|TOBIAS AWOUR
ABERDARE|KEZIAH WANGARI|WILSON KAMAU
... (Add all 662 lines from your data)
"""

def generate_email(full_name):
    """Generate email from full name"""
    parts = full_name.strip().split()
    if len(parts) >= 2:
        first = parts[0].lower()
        last = parts[-1].lower()
        return f"{first}.{last}@airtel.co.ke"
    return f"{full_name.lower().replace(' ', '.')}@airtel.co.ke"

def generate_zsm_id(zsm_name, zsm_map):
    """Get or create ZSM ID"""
    if zsm_name not in zsm_map:
        zsm_map[zsm_name] = f"zsm-{len(zsm_map) + 1:03d}"
    return zsm_map[zsm_name]

def parse_data(data_str):
    """Parse organizational data"""
    lines = [l.strip() for l in data_str.strip().split('\n') if l.strip() and '|' in l]
    
    selines = []
    zsm_map = {}
    zone_zsms = {}
    
    for line in lines:
        parts = line.split('|')
        if len(parts) == 3:
            zone, zsm, se_name = parts
            zone = zone.strip()
            zsm = zsm.strip()
            se_name = se_name.strip()
            
            # Track ZSMs by zone
            if zone not in zone_zsms:
                zone_zsms[zone] = set()
            zone_zsms[zone].add(zsm)
            
            zsm_id = generate_zsm_id(zsm, zsm_map)
            
            se_lines.append({
                'zone': zone,
                'zsm': zsm,
                'zsm_id': zsm_id,
                'name': se_name,
                'email': generate_email(se_name)
            })
    
    return se_lines, zsm_map, zone_zsms

def generate_sql(se_lines, zsm_map, zone_zsms):
    """Generate complete SQL"""
    
    sql = "-- COMPLETE PRODUCTION DATA: 662 Airtel Kenya SEs\\n\\n"
    sql += "BEGIN;\\n\\n"
    
    # Generate ZSM inserts
    sql += "-- Zone Sales Managers\\n"
    for zsm_name, zsm_id in sorted(zsm_map.items(), key=lambda x: x[1]):
        # Find zone for this ZSM
        zone = None
        for z, zsms in zone_zsms.items():
            if zsm_name in zsms:
                zone = z
                break
        
        email = generate_email(zsm_name)
        phone = f"+25471{int(zsm_id.split('-')[1]):07d}"
        
        sql += f"INSERT INTO users (id, full_name, phone_number, email, role, region, team, status) VALUES\\n"
        sql += f"('{zsm_id}', '{zsm_name}', '{phone}', '{email}', 'manager', '{zone}', 'Management', 'active');\\n"
    
    sql += "\\n-- Sales Executives\\n"
    
    # Generate SE inserts
    for idx, se in enumerate(se_lines, 1):
        se_id = f"se-{idx:03d}"
        phone = f"+254712{idx:06d}"
        points = max(0, 2500 - (idx * 4))  # Decreasing points
        
        sql += f"INSERT INTO users (id, full_name, phone_number, email, role, region, team, manager_id, status, total_points, current_rank) VALUES\\n"
        sql += f"('{se_id}', '{se['name']}', '{phone}', '{se['email']}', 'sales_executive', '{se['zone']}', '{se['zsm']}', '{se['zsm_id']}', 'active', {points}, {idx});\\n"
    
    sql += "\\nCOMMIT;\\n"
    
    return sql

# Main execution
if __name__ == "__main__":
    se_lines, zsm_map, zone_zsms = parse_data(org_data)
    sql = generate_sql(se_lines, zsm_map, zone_zsms)
    
    # Write to file
    with open('complete_production_data.sql', 'w') as f:
        f.write(sql)
    
    print(f"✅ Generated SQL for {len(se_lines)} SEs")
    print(f"✅ {len(zsm_map)} ZSMs created")
    print(f"✅ {len(zone_zsms)} zones configured")
    print("\\n📄 File saved: complete_production_data.sql")
