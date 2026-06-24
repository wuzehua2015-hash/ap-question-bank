import fitz  # PyMuPDF
import json
import os
import re

# AP Microeconomics FRQ image extraction
# Extracts images from FRQ sections of AP exam PDFs

PDF_DIR = r'D:/Lynk/翎英教育LynkEdu/真题/AP/Full_Exams/Microeconomics'
OUTPUT_DIR = r'D:/Lynk/翎英教育LynkEdu/题库系统-web/ap-question-bank/public/images/ap/microeconomics/frq'

def extract_frq_images(year, pdf_path, frq_pages):
    """Extract images from FRQ pages of a PDF.
    
    frq_pages: list of page numbers (0-indexed) containing FRQ content
    """
    doc = fitz.open(pdf_path)
    images = []
    
    for page_num in frq_pages:
        if page_num >= len(doc):
            continue
        page = doc[page_num]
        
        # Get images on this page
        img_list = page.get_images(full=True)
        
        for img_index, img in enumerate(img_list, start=1):
            xref = img[0]
            pix = fitz.Pixmap(doc, xref)
            
            # Convert to PNG if needed
            if pix.n > 4:  # CMYK: convert to RGB
                pix = fitz.Pixmap(fitz.csRGB, pix)
            
            img_filename = f"{year}_FRQ_page{page_num+1}_img{img_index}.png"
            img_path = os.path.join(OUTPUT_DIR, img_filename)
            pix.save(img_path)
            pix = None
            
            images.append({
                'filename': img_filename,
                'page': page_num + 1,
                'path': f'/images/ap/microeconomics/frq/{img_filename}'
            })
    
    doc.close()
    return images

def find_frq_pages(pdf_path):
    """Find pages containing FRQ content by searching for 'Section II' or 'Free Response'."""
    doc = fitz.open(pdf_path)
    frq_pages = []
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text()
        
        # Look for FRQ section markers
        if re.search(r'Section\s+II|Free\s+Response|FRQ|Question\s+1', text, re.IGNORECASE):
            frq_pages.append(page_num)
    
    doc.close()
    return frq_pages

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Year to PDF mapping
    years = [2012, 2013, 2014, 2015, 2016, 2017, 2018]
    
    all_images = {}
    
    for year in years:
        # Try different PDF naming conventions
        pdf_names = [
            f'AP Micro {year}.pdf',
            f'AP_Microeconomics_{year}_Full_Exam.pdf',
            f'AP Microeconomics {year}.pdf',
        ]
        
        pdf_path = None
        for name in pdf_names:
            path = os.path.join(PDF_DIR, name)
            if os.path.exists(path):
                pdf_path = path
                break
        
        if not pdf_path:
            print(f'PDF not found for {year}')
            continue
        
        print(f'Processing {year}...')
        frq_pages = find_frq_pages(pdf_path)
        print(f'  Found FRQ pages: {frq_pages}')
        
        if frq_pages:
            images = extract_frq_images(year, pdf_path, frq_pages)
            all_images[year] = images
            print(f'  Extracted {len(images)} images')
    
    # Save manifest
    manifest_path = os.path.join(OUTPUT_DIR, 'manifest.json')
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(all_images, f, indent=2, ensure_ascii=False)
    
    print(f'\nDone. Manifest saved to {manifest_path}')
    
    return all_images

if __name__ == '__main__':
    main()
