import fitz
import os
import json

# List of graph questions to crop: (year, q_num, pdf_page_0indexed, pdf_filename)
# Page numbers are 1-indexed for human readability, converted to 0-index in code
graph_questions = [
    # 2012
    (2012, 4, 20, 'AP Micro 2012.pdf'),    # price ceiling diagram
    (2012, 18, 23, 'AP Micro 2012.pdf'),   # tax diagram (shared with Q19)
    (2012, 19, 23, 'AP Micro 2012.pdf'),    # same tax diagram
    (2012, 24, 25, 'AP Micro 2012.pdf'),   # profit-maximizing graph
    (2012, 52, 33, 'AP Micro 2012.pdf'),   # TR/TC curves
    # 2013
    (2013, 3, 18, 'AP Micro 2013.pdf'),    # consumer surplus
    (2013, 33, 23, 'AP Micro 2013.pdf'),   # substitutes graph
    (2013, 43, 27, 'AP Micro 2013.pdf'),   # monopoly profit
    (2013, 47, 28, 'AP Micro 2013.pdf'),   # price ceiling
    (2013, 59, 30, 'AP Micro 2013.pdf'),   # monopsony
    # 2014
    (2014, 11, 10, 'AP Micro 2014.pdf'),   # profit-maximizing
    (2014, 33, 14, 'AP Micro 2014.pdf'),   # rent control
    (2014, 34, 14, 'AP Micro 2014.pdf'),   # substitutes
    (2014, 42, 17, 'AP Micro 2014.pdf'),   # MRP labor
    # 2015
    (2015, 32, 19, 'AP Micro 2015.pdf'),   # elasticity points
    (2015, 38, 21, 'AP Micro 2015.pdf'),   # TC/TR curves
    (2015, 57, 25, 'AP Micro 2015.pdf'),   # monopoly profit
    (2015, 60, 30, 'AP Micro 2015.pdf'),   # monopsony
    # 2016
    (2016, 7, 10, 'AP Micro 2016.pdf'),    # MP/AP curves
    (2016, 18, 11, 'AP Micro 2016.pdf'),   # supply shift tax
    (2016, 25, 13, 'AP Micro 2016.pdf'),   # monopoly profit
    (2016, 48, 17, 'AP Micro 2016.pdf'),   # price ceiling
    (2016, 58, 29, 'AP Micro 2016.pdf'),   # monopsony
    (2016, 60, 30, 'AP Micro 2016.pdf'),   # positive externality
    # 2017
    (2017, 37, 26, 'AP_Microeconomics_2017_Full_Exam.pdf'),  # natural monopoly
]

output_dir = 'public/images/ap/microeconomics'
os.makedirs(output_dir, exist_ok=True)

base_pdf_path = 'D:/Lynk/翎英教育LynkEdu/真题/AP/Full_Exams/Microeconomics'

results = []

for year, q_num, page_1idx, pdf_name in graph_questions:
    pdf_path = os.path.join(base_pdf_path, pdf_name)
    doc = fitz.open(pdf_path)
    page = doc[page_1idx - 1]  # convert to 0-indexed
    
    # Get all images on the page
    image_list = page.get_images(full=True)
    
    if image_list:
        # Get the largest image (likely the graph/diagram)
        largest_image = None
        largest_area = 0
        
        for img_index, img in enumerate(image_list, start=1):
            xref = img[0]
            pix = fitz.Pixmap(doc, xref)
            if pix.n > 4:  # CMYK: convert to RGB
                pix = fitz.Pixmap(fitz.csRGB, pix)
            
            area = pix.width * pix.height
            if area > largest_area:
                largest_area = area
                largest_image = pix
            else:
                pix = None
        
        if largest_image:
            # Ensure RGB format before saving as PNG
            if largest_image.n > 4:  # CMYK: convert to RGB
                largest_image = fitz.Pixmap(fitz.csRGB, largest_image)
            elif largest_image.n == 4:  # RGBA: convert to RGB
                largest_image = fitz.Pixmap(fitz.csRGB, largest_image)
            elif largest_image.n == 2:  # Grayscale+Alpha: convert to RGB
                largest_image = fitz.Pixmap(fitz.csRGB, largest_image)
            elif largest_image.n == 1:  # Grayscale: convert to RGB
                largest_image = fitz.Pixmap(fitz.csRGB, largest_image)
            
            output_path = os.path.join(output_dir, f'{year}_Q{q_num:02d}.png')
            largest_image.save(output_path)
            results.append(f'{year}_Q{q_num:02d}: Saved {output_path} ({largest_image.width}x{largest_image.height})')
            largest_image = None
        else:
            results.append(f'{year}_Q{q_num:02d}: No suitable image found')
    else:
        # No images - try to render the page as image and crop
        # For now, just mark as needing manual cropping
        results.append(f'{year}_Q{q_num:02d}: No images on page, needs manual crop')
    
    doc.close()

for r in results:
    print(r)

print(f'\nTotal: {len(results)} graph questions processed')

# Update question_bank.json with image_paths
with open('public/data/ap/microeconomics/question_bank.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

for q in questions:
    if q.get('requires_graph') and not q.get('image_paths'):
        img_path = f'/images/ap/microeconomics/{q["year"]}_Q{q["question_number"]:02d}.png'
        full_img_path = os.path.join('public', img_path.lstrip('/'))
        if os.path.exists(full_img_path):
            q['image_paths'] = [img_path]
            print(f'Updated {q["question_id"]}: {img_path}')

with open('public/data/ap/microeconomics/question_bank.json', 'w', encoding='utf-8') as f:
    json.dump(questions, f, indent=2, ensure_ascii=False)

print('Done!')
