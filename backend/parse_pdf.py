import sys
import json
import logging
import warnings
import re
import cv2
import numpy as np
from pypdf import PdfReader
from generate import parse_menu_text

# Force standard streams to use UTF-8 on Windows to avoid UnicodeEncodeError
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

logging.getLogger("pypdf").setLevel(logging.ERROR)
warnings.filterwarnings("ignore")

def clean_ocr_date(s):
    # Normalize OCR typos in dates
    s_norm = s.strip().replace('i', '1').replace('I', '1').replace('o', '0').replace('O', '0').replace('—', '').strip()
    match = re.search(r'(\d{1,2})[- ](\d{2})[- ](\d{2})', s_norm)
    if match:
        day = match.group(1).zfill(2)
        month = match.group(2)
        year = match.group(3)
        cleaned_date = f"{day}-{month}-{year}"
        
        # Remove the date from normalized string to get remaining text
        remaining = re.sub(r'\d{1,2}[- ]\d{2}[- ]\d{2}', '', s_norm).strip()
        remaining = re.sub(r'^[-\s_]+', '', remaining).strip()
        return cleaned_date, remaining
    return None, None

def extract_text_ocr(pdf_path):
    import fitz  # PyMuPDF
    
    text = ""
    reader = None
    try:
        doc = fitz.open(pdf_path)
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            pix = page.get_pixmap(dpi=150)
            img_bytes = pix.tobytes("png")
            
            # Fast-path: Check for native text first
            native_boxes = []
            text_dict = page.get_text("dict")
            scale_x = pix.width / page.rect.width if page.rect.width else 1.0
            scale_y = pix.height / page.rect.height if page.rect.height else 1.0
            
            for block in text_dict.get("blocks", []):
                for line in block.get("lines", []):
                    for span in line.get("spans", []):
                        t = span.get("text", "").strip()
                        if t:
                            x0, y0, x1, y1 = span.get("bbox")
                            native_boxes.append({
                                "text": t,
                                "min_x": x0 * scale_x,
                                "max_x": x1 * scale_x,
                                "center_y": ((y0 + y1) / 2) * scale_y
                            })
                            
            if len(native_boxes) > 30:
                boxes = native_boxes
            else:
                if reader is None:
                    import easyocr
                    reader = easyocr.Reader(['en'], verbose=False)
                results = reader.readtext(img_bytes, detail=1)
                boxes = []
                if results:
                    for res in results:
                        bbox, t, _ = res
                        min_x = min(p[0] for p in bbox)
                        max_x = max(p[0] for p in bbox)
                        min_y = min(p[1] for p in bbox)
                        max_y = max(p[1] for p in bbox)
                        center_y = (min_y + max_y) / 2
                        boxes.append({
                            "text": t,
                            "min_x": min_x,
                            "max_x": max_x,
                            "center_y": center_y
                        })
                
            if boxes:
                boxes.sort(key=lambda b: b['center_y'])
                rows = []
                current_row = []
                for b in boxes:
                    if not current_row:
                        current_row.append(b)
                    else:
                        avg_y = sum(x['center_y'] for x in current_row) / len(current_row)
                        if abs(b['center_y'] - avg_y) < 20: 
                            current_row.append(b)
                        else:
                            rows.append(current_row)
                            current_row = [b]
                if current_row:
                    rows.append(current_row)
                
                # Intelligent 1D KMeans to find exactly 4 columns dynamically
                header_keywords = ["BANNARI", "AMMAN", "INSTITUTE", "TECHNOLOGY", "Boys Mess Menu", "DAYS", "BREAK-FAST", "LUNCH", "DINNER", "Ph:", "E-matl", "638 40 1", "Ancut", "Aneut", "Acnt"]
                valid_min_xs = []
                for b in boxes:
                    text_clean = b['text'].upper()
                    if len(text_clean) <= 1: continue
                    if any(kw in text_clean for kw in header_keywords): continue
                    if (b['max_x'] - b['min_x']) > 280: continue
                    valid_min_xs.append(b['min_x'])
                
                if not valid_min_xs:
                    valid_min_xs = [b['min_x'] for b in boxes if len(b['text'].strip()) > 1]
                
                if not valid_min_xs: continue
                
                S_min = min(valid_min_xs)
                S_max = max(valid_min_xs)
                
                c0 = S_min
                c1 = S_min + 0.175 * (S_max - S_min)
                c2 = S_min + 0.60 * (S_max - S_min)
                c3 = S_min + 0.98 * (S_max - S_min)
                
                centers = [c0, c1, c2, c3]
                for _ in range(10):
                    clusters = {0:[], 1:[], 2:[], 3:[]}
                    for x in valid_min_xs:
                        distances = [abs(x - c) for c in centers]
                        closest = distances.index(min(distances))
                        clusters[closest].append(x)
                    new_centers = []
                    for i in range(4):
                        if clusters[i]: new_centers.append(sum(clusters[i])/len(clusters[i]))
                        else: new_centers.append(centers[i])
                    centers = new_centers
                
                centers.sort()
                bounds = []
                for i in range(3):
                    c_curr = centers[i]
                    c_next = centers[i+1]
                    b_val = c_next - 35
                    if b_val <= c_curr + 15:
                        b_val = (c_curr + c_next) / 2
                    bounds.append(b_val)
                
            # Detect horizontal lines using OpenCV
            img_bytes = pix.tobytes("png")
            nparr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
            _, thresh = cv2.threshold(img, 200, 255, cv2.THRESH_BINARY_INV)
            
            # Use a large kernel to connect broken horizontal lines
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (150, 1))
            horizontal_lines = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
            contours, _ = cv2.findContours(horizontal_lines, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            y_coords = []
            for c in contours:
                x, y, w, h = cv2.boundingRect(c)
                if w > 200:
                    y_coords.append(y + h//2)
            y_coords.sort()

            # Filter close lines
            filtered_y_coords = []
            for y in y_coords:
                if not filtered_y_coords or y - filtered_y_coords[-1] > 50:
                    filtered_y_coords.append(y)
            y_coords = filtered_y_coords

            def get_block_index(cy):
                # If we have reliable table lines (expecting ~7-9 lines for 7 days)
                if len(y_coords) >= 5:
                    for i in range(len(y_coords)-1):
                        if y_coords[i] <= cy <= y_coords[i+1]:
                            return i
                    if cy < y_coords[0]: return -1
                    return len(y_coords) - 1
                else:
                    # Fallback math logic if lines are completely broken
                    date_boxes = [b for b in boxes if b['min_x'] < bounds[0] and clean_ocr_date(b['text'])[0]]
                    if not date_boxes: return 0
                    date_boxes.sort(key=lambda x: x['center_y'])
                    anchor_y = date_boxes[0]['center_y']
                    grid_offset = anchor_y - 85.0
                    row_height = 195.0
                    if len(date_boxes) > 1:
                        diffs = [date_boxes[i]['center_y'] - date_boxes[i-1]['center_y'] for i in range(1, len(date_boxes))]
                        valid_diffs = [d for d in diffs if 100 < d < 300]
                        if valid_diffs: row_height = np.median(valid_diffs)
                    if cy < grid_offset: return -1
                    return int((cy - grid_offset) // row_height)

            row_blocks = {}
            for b in boxes:
                b_idx = get_block_index(b['center_y'])
                if b_idx not in row_blocks:
                    row_blocks[b_idx] = []
                row_blocks[b_idx].append(b)

            date_blocks = []
            for b_idx in sorted(row_blocks.keys()):
                if b_idx == -1: continue # Skip headers
                
                cell_boxes = row_blocks[b_idx]
                col1, col2, col3, col4 = [], [], [], []
                for b in cell_boxes:
                    x = b['min_x']
                    if x < bounds[0]: col1.append(b)
                    elif x < bounds[1]: col2.append(b)
                    elif x < bounds[2]: col3.append(b)
                    else: col4.append(b)
                
                col1.sort(key=lambda b: b['center_y'])
                col2.sort(key=lambda b: b['center_y'])
                col3.sort(key=lambda b: b['center_y'])
                col4.sort(key=lambda b: b['center_y'])
                
                col1_texts = [b['text'] for b in col1]
                col2_texts = [b['text'] for b in col2]
                col3_texts = [b['text'] for b in col3]
                col4_texts = [b['text'] for b in col4]
                
                col1_str = " ".join(col1_texts)
                cleaned_date, remaining = clean_ocr_date(col1_str)
                
                # Check if this block looks like table headers
                if "DAYS" in col1_str.upper() or "BREAK" in col1_str.upper() or "LUNCH" in col1_str.upper():
                    continue

                current_block = {"col1": [], "col2": col2_texts, "col3": col3_texts, "col4": col4_texts}
                if cleaned_date:
                    current_block["col1"].append(cleaned_date)
                    if remaining: current_block["col1"].append(remaining)
                else:
                    if col1_str: current_block["col1"].append(col1_str)
                
                if any(current_block.values()):
                    date_blocks.append(current_block)
            
            page_lines = []
            for b in date_blocks:
                page_lines.append("")
                for c1 in b["col1"]: page_lines.append(c1)
                if b["col2"]:
                    page_lines.append("[BREAKFAST]")
                    for c2 in b["col2"]: page_lines.append(c2)
                if b["col3"]:
                    page_lines.append("[LUNCH]")
                    for c3 in b["col3"]: page_lines.append(c3)
                if b["col4"]:
                    page_lines.append("[DINNER]")
                    for c4 in b["col4"]: page_lines.append(c4)
            
            text += "\n".join(page_lines) + "\n\n"
        doc.close()
    except Exception as e:
        print(f"OCR Error: {e}", file=sys.stderr)
    return text

def extract_text_from_pdf(pdf_path):
    # Force OCR to ensure high-fidelity spatial layout/column extraction
    return extract_text_ocr(pdf_path)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python parse_pdf.py <path_to_pdf>"}))
        sys.exit(1)

    pdf_path = sys.argv[1]
    raw_text = extract_text_from_pdf(pdf_path)
    
    # Preprocess text to normalize spacing/newlines before date patterns: DD-MM-YY or DD MM YY
    raw_text = re.sub(r'\s+(?=\d{2}[ -]\d{2}[ -]\d{2})', '\n\n', raw_text)
    
    if not raw_text.strip():
        print(json.dumps({"error": "No text extracted from PDF. Is it a scanned image?"}))
        sys.exit(1)

    menus = parse_menu_text(raw_text)
    
    # Output JSON to stdout so Go server can parse it
    print(json.dumps(menus))
