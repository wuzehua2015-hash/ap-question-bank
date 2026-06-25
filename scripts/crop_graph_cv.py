import fitz
import cv2
import numpy as np
import os

# Graph questions that need page rendering + auto-crop
graph_questions = [
    (2012, 4, 20, 'AP Micro 2012.pdf'),     # price ceiling
    (2012, 18, 23, 'AP Micro 2012.pdf'),    # tax diagram
    (2012, 19, 23, 'AP Micro 2012.pdf'),    # tax diagram (same page)
    (2012, 24, 25, 'AP Micro 2012.pdf'),    # profit-maximizing
    (2012, 52, 33, 'AP Micro 2012.pdf'),    # TR/TC curves
    (2013, 33, 23, 'AP Micro 2013.pdf'),    # substitutes
    (2013, 43, 27, 'AP Micro 2013.pdf'),    # monopoly profit
    (2013, 59, 30, 'AP Micro 2013.pdf'),    # monopsony
    (2014, 11, 10, 'AP Micro 2014.pdf'),    # profit-maximizing
    (2014, 33, 14, 'AP Micro 2014.pdf'),    # rent control
    (2014, 34, 14, 'AP Micro 2014.pdf'),    # substitutes
    (2014, 42, 17, 'AP Micro 2014.pdf'),    # MRP labor
    (2015, 32, 19, 'AP Micro 2015.pdf'),    # elasticity points
    (2015, 38, 21, 'AP Micro 2015.pdf'),    # TC/TR curves
    (2015, 60, 30, 'AP Micro 2015.pdf'),    # monopsony
    (2016, 7, 10, 'AP Micro 2016.pdf'),     # MP/AP curves
    (2016, 18, 11, 'AP Micro 2016.pdf'),    # supply shift
    (2016, 25, 13, 'AP Micro 2016.pdf'),    # monopoly profit
    (2016, 58, 29, 'AP Micro 2016.pdf'),    # monopsony
]

output_dir = 'public/images/ap/microeconomics'
os.makedirs(output_dir, exist_ok=True)
base_pdf_path = 'D:/Lynk/翎英教育LynkEdu/真题/AP/Full_Exams/Microeconomics'

results = []

for year, q_num, page_1idx, pdf_name in graph_questions:
    pdf_path = os.path.join(base_pdf_path, pdf_name)
    doc = fitz.open(pdf_path)
    page = doc[page_1idx - 1]
    
    # Render page at high resolution (2x zoom)
    mat = fitz.Matrix(2, 2)
    pix = page.get_pixmap(matrix=mat)
    
    # Convert to numpy array (RGB)
    img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, 3)
    
    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    
    # Invert: black content becomes white, white background becomes black
    _, binary = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY_INV)
    
    # Find contours
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Find the largest contour that is likely a graph (not too small, not too large)
    best_contour = None
    best_score = 0
    page_area = pix.width * pix.height
    
    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        area = w * h
        
        # Skip very small (text) or very large (almost whole page)
        if area < 5000 or area > page_area * 0.7:
            continue
        
        # Skip if too thin (likely a line of text)
        if h < 50 or w < 50:
            continue
        
        # Score: prefer contours in upper half of page (graphs usually there)
        # and with moderate aspect ratio
        aspect_ratio = max(w, h) / max(min(w, h), 1)
        y_center = y + h / 2
        y_score = 1.0 if y_center < pix.height * 0.6 else 0.5
        
        score = area * y_score / (aspect_ratio + 0.1)
        
        if score > best_score:
            best_score = score
            best_contour = (x, y, w, h)
    
    if best_contour:
        x, y, w, h = best_contour
        # Add some padding
        padding = 20
        x1 = max(0, x - padding)
        y1 = max(0, y - padding)
        x2 = min(pix.width, x + w + padding)
        y2 = min(pix.height, y + h + padding)
        
        cropped = img[y1:y2, x1:x2]
        output_path = os.path.join(output_dir, f'{year}_Q{q_num:02d}.png')
        cv2.imwrite(output_path, cv2.cvtColor(cropped, cv2.COLOR_RGB2BGR))
        results.append(f'{year}_Q{q_num:02d}: Cropped {w}x{h} -> {output_path}')
    else:
        # Fallback: save whole page upper half
        y2 = int(pix.height * 0.6)
        cropped = img[0:y2, :]
        output_path = os.path.join(output_dir, f'{year}_Q{q_num:02d}.png')
        cv2.imwrite(output_path, cv2.cvtColor(cropped, cv2.COLOR_RGB2BGR))
        results.append(f'{year}_Q{q_num:02d}: Fallback - saved upper half ({pix.width}x{y2})')
    
    doc.close()

for r in results:
    print(r)

print(f'\nTotal: {len(results)} graph images processed')
