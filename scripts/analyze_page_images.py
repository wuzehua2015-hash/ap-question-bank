#!/usr/bin/env python3
"""
AP Graph Page Analyzer - 职责：扫描指定PDF页面，列出所有图像的位置和bbox

用法：
    python analyze_page_images.py <pdf_path> <page_num> [page_num2 ...]

输出：
    每页的图像列表，包含xref和bbox坐标
"""
import fitz
import sys

def analyze_page_images(pdf_path, page_nums):
    doc = fitz.open(pdf_path)
    results = []
    for p in page_nums:
        page = doc[p - 1]
        img_list = page.get_images(full=True)
        results.append(f"\nPage {p}: {len(img_list)} image(s)")
        for idx, img in enumerate(img_list):
            xref = img[0]
            for info in page.get_image_info(xrefs=[xref]):
                bbox = info['bbox']
                width = bbox[2] - bbox[0]
                height = bbox[3] - bbox[1]
                results.append(f"  Image {idx}: xref={xref}, bbox=({bbox[0]:.1f}, {bbox[1]:.1f}, {bbox[2]:.1f}, {bbox[3]:.1f}), size={width:.1f}x{height:.1f}")
    doc.close()
    return "\n".join(results)

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python analyze_page_images.py <pdf_path> <page_num> [page_num2 ...]")
        sys.exit(1)
    pdf_path = sys.argv[1]
    page_nums = [int(x) for x in sys.argv[2:]]
    print(analyze_page_images(pdf_path, page_nums))
