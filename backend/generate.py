import sys
import json
import re
import os

def parse_menu_text(text):
    # Split text into daily blocks looking for date patterns like DD-MM-YY or DD MM YY
    blocks = re.split(r'\n\n(?=\d{2}[ -]\d{2}[ -]\d{2})', text.strip())
    
    # Common starting items for each meal
    lunch_starts = ['Rice', 'Rice -', 'Soya Biryani', 'Veg Biryani', 'Veg biryani', 'Mushroom Biryani', 'Ghee Rice', 'Tomato Rice']
    dinner_starts = ['Chapatti', 'Pesarattu Dosa', 'Idly', 'Rumali rotti', 'Rumali roti', 'Kal dosai', 
                     'Kara dosa', 'Machine Dosa', 'Roast', 'Parotta', 'Onion Dosa', 'Curry leaves Dosa', 
                     'Kaldosa', 'Chapatti,Jam', 'Set Dosa', 'Dosai', 'Beetroot Dosa', 'Podi Dosai']
    
    menus = []
    
    for block in blocks:
        lines = [line.strip() for line in block.split('\n') if line.strip() and line.strip() != '-']
        if len(lines) < 2: continue
        
        # Parse date
        # It could be 01-05-26 or 01 05 26
        date_line = lines[0]
        parts = re.split(r'[- ]', date_line)
        if len(parts) >= 3:
            # Assuming format DD MM YY where YY is like 26 for 2026
            year = parts[2] if len(parts[2]) == 4 else f"20{parts[2]}"
            iso_date = f"{year}-{parts[1]}-{parts[0]}"
        else:
            continue
        
        # Parse day
        day_str = lines[1].replace(' ', '').replace('-', '')
        # Fix common OCR typos for days
        typos = {
            'Friay': 'Friday', 'Staurday': 'Saturday', 'Frida y': 'Friday', 
            'S ta urda y': 'Saturday', 'Saturda y': 'Saturday', 'Thurday': 'Thursday',
            'Wednesay': 'Wednesday', 'Tuesdayy': 'Tuesday', 'Monay': 'Monday'
        }
        for wrong, right in typos.items():
            if wrong in day_str:
                day_str = day_str.replace(wrong, right)
        
        meals_lines = lines[2:]
        
        breakfast, lunch, dinner = [], [], []
        
        if any(line in ['[BREAKFAST]', '[LUNCH]', '[DINNER]'] for line in meals_lines):
            current_meal = None
            for line in meals_lines:
                if line == '[BREAKFAST]':
                    current_meal = breakfast
                elif line == '[LUNCH]':
                    current_meal = lunch
                elif line == '[DINNER]':
                    current_meal = dinner
                else:
                    if current_meal is not None:
                        current_meal.append(line)
        else:
            # Find Lunch Start
            lunch_start_idx = len(meals_lines)
            for i, line in enumerate(meals_lines):
                if any(line.startswith(ls) for ls in lunch_starts):
                    lunch_start_idx = i
                    break
                    
            breakfast = meals_lines[:lunch_start_idx]
            rest = meals_lines[lunch_start_idx:]
            
            # Find Dinner Start in the remaining lines
            dinner_start_idx = len(rest)
            for i, line in enumerate(rest):
                if i > 0 and any(line.startswith(ds) for ds in dinner_starts):
                    dinner_start_idx = i
                    break
                    
            lunch = rest[:dinner_start_idx]
            dinner = rest[dinner_start_idx:]
        
        menus.append({
            "date": iso_date,
            "day": day_str,
            "breakfast": breakfast,
            "lunch": lunch,
            "dinner": dinner
        })
        
    return menus

def generate_outputs(menus, output_dir):
    # 1. SQL schema and Inserts
    sql_schema = """CREATE TABLE IF NOT EXISTS menus (
    id SERIAL PRIMARY KEY,
    menu_date DATE UNIQUE NOT NULL,
    day_of_week VARCHAR(15) NOT NULL,
    breakfast JSONB NOT NULL,
    lunch JSONB NOT NULL,
    dinner JSONB NOT NULL
);

-- Index for searching specific dishes in JSONB arrays efficiently
CREATE INDEX IF NOT EXISTS idx_menus_breakfast ON menus USING GIN (breakfast);
CREATE INDEX IF NOT EXISTS idx_menus_lunch ON menus USING GIN (lunch);
CREATE INDEX IF NOT EXISTS idx_menus_dinner ON menus USING GIN (dinner);
"""

    if not menus:
        print("No menus parsed!")
        return

    sql_inserts = "INSERT INTO menus (menu_date, day_of_week, breakfast, lunch, dinner) VALUES\n"
    values = []
    for m in menus:
        bf = json.dumps(m['breakfast']).replace("'", "''")
        lu = json.dumps(m['lunch']).replace("'", "''")
        di = json.dumps(m['dinner']).replace("'", "''")
        values.append(f"('{m['date']}', '{m['day']}', '{bf}'::jsonb, '{lu}'::jsonb, '{di}'::jsonb)")
        
    sql_inserts += ",\n".join(values) + "\nON CONFLICT (menu_date) DO UPDATE SET\n"
    sql_inserts += "    breakfast = EXCLUDED.breakfast,\n"
    sql_inserts += "    lunch = EXCLUDED.lunch,\n"
    sql_inserts += "    dinner = EXCLUDED.dinner;"

    json_output = json.dumps(menus, indent=2)

    with open(os.path.join(output_dir, 'schema.sql'), 'w') as f:
        f.write(sql_schema)
        
    with open(os.path.join(output_dir, 'insert.sql'), 'w') as f:
        f.write(sql_inserts)

    with open(os.path.join(output_dir, 'menu_api.json'), 'w') as f:
        f.write(json_output)

    print(f"Successfully processed {len(menus)} days.")
    print(f"Outputs saved to: {output_dir}")
    print("- schema.sql")
    print("- insert.sql")
    print("- menu_api.json")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python generate.py <path_to_ocr_text_file>")
        sys.exit(1)
        
    input_file = sys.argv[1]
    with open(input_file, 'r', encoding='utf-8') as f:
        text = f.read()
        
    menus = parse_menu_text(text)
    
    # Save outputs to the same directory as the script
    output_dir = os.path.dirname(os.path.abspath(__file__))
    generate_outputs(menus, output_dir)
