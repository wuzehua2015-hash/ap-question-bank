import fitz
import cv2
import numpy as np
import os
import re

# Graph questions to crop: (year, q_num, pdf_filename)
graph_questions = [
    (2012, 4, 'AP Micro 2012.pdf'),     # price ceiling
    (2012, 18, 'AP Micro 2012.pdf'),    # tax diagram
    (2012, 19, 'AP Micro 2012.pdf'),    # tax diagram
    (2012, 24, 'AP Micro 2012.pdf'),    # profit-maximizing
    (2012, 52, 'AP Micro 2012.pdf'),    # TR/TC curves
    (2013, 33, 'AP Micro 2013.pdf'),    # substitutes
    (2013, 43, 'AP Micro 2013.pdf'),    # monopoly profit
    (2013, 59, 'AP Micro 2013.pdf'),    # monopsony
    (2014, 11, 'AP Micro 2014.pdf'),    # profit-maximizing
    (2014, 33, 'AP Micro 2014.pdf'),    # rent control
    (2014, 34, 'AP Micro 2014.pdf'),    # substitutes
    (2014, 42, 'AP Micro 2014.pdf'),    # MRP labor
    (2015, 32, 'AP Micro 2015.pdf'),    # elasticity points
    (2015, 38, 'AP Micro 2015.pdf'),    # TC/TR curves
    (2015, 60, 'AP Micro 2015.pdf'),    # monopsony
    (2016, 7, 'AP Micro 2016.pdf'),     # MP/AP curves
    (2016, 18, 'AP Micro 2016.pdf'),    # supply shift
    (2016, 25, 'AP Micro 2016.pdf'),    # monopoly profit
    (2016, 58, 'AP Micro 2016.pdf'),    # monopsony
]

output_dir = 'public/images/ap/microeconomics'
os.makedirs(output_dir, exist_ok=True)
base_pdf_path = 'D:/Lynk/翎英教育LynkEdu/真题/AP/Full_Exams/Microeconomics'

results = []

for year, q_num, pdf_name in graph_questions:
    pdf_path = os.path.join(base_pdf_path, pdf_name)
    doc = fitz.open(pdf_path)
    
    # Find the page containing this question number
    target_page = None
    for i in range(len(doc)):
        text = doc[i].get_text()
        # Look for question number at start of line
        if re.search(rf'\n\s*{q_num}\.\s+', text) or text.startswith(f'{q_num}. '):
            target_page = i
            break
    
    if target_page is None:
        doc.close()
        results.append(f'{year}_Q{q_num:02d}: Question not found in PDF')
        continue
    
    page = doc[target_page]
    
    # Render page at 2x resolution
    mat = fitz.Matrix(2, 2)
    pix = page.get_pixmap(matrix=mat)
    img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, 3)
    
    # Find text blocks to exclude from cropping
    blocks = page.get_text("blocks")
    text_mask = np.zeros((pix.height, pix.width), dtype=np.uint8)
    
    for b in blocks:
        x0, y0, x1, y1 = int(b[0]*2), int(b[1]*2), int(b[2]*2), int(b[3]*2)
        text_mask[y0:y1, x0:x1] = 255
    
    # Convert to grayscale and invert
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    _, binary = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY_INV)
    
    # Remove text areas from binary mask
    binary = cv2.subtract(binary, text_mask)
    
    # Find contours
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    best_contour = None
    best_score = 0
    page_area = pix.width * pix.height
    
    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        area = w * h
        
        if area < 5000 or area > page_area * 0.5:
            continue
        if h < 50 or w < 50:
            continue
        
        aspect_ratio = max(w, h) / max(min(w, h), 1)
        y_center = y + h / 2
        y_score = 1.0 if y_center < pix.height * 0.6 else 0.5
        
        score = area * y_score / (aspect_ratio + 0.1)
        
        if score > best_score:
            best_score = score
            best_contour = (x, y, w, h)
    
    if best_contour:
        x, y, w, h = best_contour
        padding = 20
        x1 = max(0, x - padding)
        y1 = max(0, y - padding)
        x2 = min(pix.width, x + w + padding)
        y2 = min(pix.height, y + h + padding)
        
        cropped = img[y1:y2, x1:x2]
        output_path = os.path.join(output_dir, f'{year}_Q{q_num:02d}.png')
        cv2.imwrite(output_path, cv2.cvtColor(cropped, cv2.COLOR_RGB2BGR))
        results.append(f'{year}_Q{q_num:02d}: Page {target_page+1}, cropped {w}x{h}')
    else:
        # Fallback: render page and save as-is (upper half)
        y2 = int(pix.height * 0.6)
        cropped = img[0:y2, :]
        output_path = os.path.join(output_dir, f'{year}_Q{q_num:02d}.png')
        cv2.imwrite(output_path, cv2.cvtColor(cropped, cv2.COLOR_RGB2BGR))
        results.append(f'{year}_Q{q_num:02d}: Page {target_page+1}, fallback upper half')
    
    doc.close()

for r in results:
    print(r)

print(f'\nTotal: {len(results)}')
