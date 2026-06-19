import fitz
import pytesseract
from PIL import Image
import io
import os
import sys

# Configure tesseract path
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

PDF_FILES = [
    (r"D:\Lynk\翎英教育LynkEdu\教研系统\AP\题库系统\raw_pdfs\2023_Practice_1.pdf", r"D:\Lynk\翎英教育LynkEdu\题库系统-web\ap-question-bank\scripts\ocr_2023_set1.txt"),
    (r"D:\Lynk\翎英教育LynkEdu\教研系统\AP\题库系统\raw_pdfs\2023_Practice_2.pdf", r"D:\Lynk\翎英教育LynkEdu\题库系统-web\ap-question-bank\scripts\ocr_2023_set2.txt"),
    (r"D:\Lynk\翎英教育LynkEdu\教研系统\AP\题库系统\raw_pdfs\2023_Practice_3.pdf", r"D:\Lynk\翎英教育LynkEdu\题库系统-web\ap-question-bank\scripts\ocr_2023_set3.txt"),
]

DPI = 300


def process_pdf(pdf_path, output_path):
    print(f"\nProcessing: {pdf_path}")
    print(f"Output: {output_path}")

    doc = fitz.open(pdf_path)
    total_pages = doc.page_count
    print(f"Total pages: {total_pages}")

    # If output exists, load progress
    processed_pages = set()
    if os.path.exists(output_path):
        with open(output_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("=== PAGE ") and line.strip().endswith(" ==="):
                    try:
                        page_num = int(line.strip().replace("=== PAGE ", "").replace(" ===", ""))
                        processed_pages.add(page_num)
                    except ValueError:
                        pass
        print(f"Resuming: {len(processed_pages)} pages already processed")

    with open(output_path, "a", encoding="utf-8") as out:
        for page_idx in range(total_pages):
            page_num = page_idx + 1
            if page_num in processed_pages:
                print(f"  Skipping page {page_num}/{total_pages} (already done)")
                continue

            print(f"  OCR page {page_num}/{total_pages} ...", end="", flush=True)

            page = doc.load_page(page_idx)
            # Render at 300 DPI
            zoom = DPI / 72.0
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat)
            img_data = pix.tobytes("png")
            img = Image.open(io.BytesIO(img_data))

            # Run OCR
            text = pytesseract.image_to_string(img, lang="eng")

            out.write(f"\n=== PAGE {page_num} ===\n")
            out.write(text)
            out.flush()

            print(" done")

            # Save progress every 5 pages by just having flushed
            if page_num % 5 == 0:
                print(f"  Progress checkpoint at page {page_num}")

    doc.close()
    print(f"Finished: {output_path}")


def main():
    for pdf_path, output_path in PDF_FILES:
        if not os.path.exists(pdf_path):
            print(f"ERROR: PDF not found: {pdf_path}")
            continue
        try:
            process_pdf(pdf_path, output_path)
        except Exception as e:
            print(f"ERROR processing {pdf_path}: {e}")
            import traceback
            traceback.print_exc()

    print("\nAll done!")


if __name__ == "__main__":
    main()
