#!/usr/bin/env python3
"""
Precise Table Cropper — 通用PDF表格精确裁剪工具

解决AP考试等场景中"表格截图包含多余题干文字"的问题。
通过OpenCV形态学操作检测表格边框线，精确裁剪到表格区域本身
（包含表格标题，但不包含前后问题文字）。

支持：
- 从PDF直接提取表格（text-based or scanned）
- 对已有图片重新裁剪
- 可复用于任何科目

Usage:
    # 从PDF提取
    python scripts/precise_table_cropper.py \
        --pdf "AP Macro 2012.pdf" --page 40 \
        --output 2012_frq2_table.png
    
    # 对已有图片重新裁剪
    python scripts/precise_table_cropper.py \
        --image "public/images/frq/2012_frq2_table.png" \
        --output 2012_frq2_table.png
    
    # 批量处理目录
    python scripts/precise_table_cropper.py \
        --batch-dir "public/images/frq/" \
        --output-dir "public/images/frq/"
"""

import argparse
import os
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

# Optional: PyMuPDF for PDF rendering
try:
    import fitz
    HAS_FITZ = True
except ImportError:
    HAS_FITZ = False


def detect_table_bounds(image_bgr, remove_watermark=False):
    """
    检测图片中表格的精确边界（通过表格边框线 + 垂直线 + 文本密度）。
    
    改进算法：
    1. 检测水平线，按距离分组（max_gap=150px），找到最密集的组（表格）
    2. 检测垂直线，用于精确定位左右边界
    3. 对T-account表格（仅1条水平线）：用垂直线终止点+文本密度找底部
    4. 对完整边框表格：用水平线组的上下边界
    5. 检测文本间隙，移除表格上方/下方的问题文字
    
    Args:
        image_bgr: OpenCV BGR格式的图片（numpy array）
        remove_watermark: 是否去除TestDaily等灰色水印
    
    Returns:
        (x, y, w, h) 或 None（未检测到表格）
    """
    h_img, w_img = image_bgr.shape[:2]
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    
    # 可选：去除灰色水印（亮度>200的像素设为白色）
    if remove_watermark:
        gray = gray.copy()
        gray[gray > 200] = 255
    
    # 二值化：反色（线条=255白，背景=0黑）
    _, binary_inv = cv2.threshold(gray, 180, 255, cv2.THRESH_BINARY_INV)
    _, binary = cv2.threshold(gray, 180, 255, cv2.THRESH_BINARY)
    
    # ========== 辅助函数：找文本行 ==========
    def find_text_rows():
        row_sums = binary.sum(axis=1) // 255
        return [i for i, s in enumerate(row_sums) if s < w_img * 0.98]
    
    text_rows = set(find_text_rows())
    
    # ========== 检测水平线 ==========
    min_line_width = max(30, w_img // 5)
    h_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (min_line_width, 1))
    h_lines_morph = cv2.morphologyEx(binary_inv, cv2.MORPH_OPEN, h_kernel, iterations=1)
    h_sums = h_lines_morph.sum(axis=1) // 255
    h_positions = [i for i, s in enumerate(h_sums) if s > w_img * 0.4]
    
    # 后备：行最大连续白像素
    if len(h_positions) < 1:
        threshold = w_img * 0.4
        for y in range(h_img):
            row = binary_inv[y, :]
            max_consecutive = 0
            current = 0
            for x in range(w_img):
                if row[x] > 0:
                    current += 1
                    max_consecutive = max(max_consecutive, current)
                else:
                    current = 0
            if max_consecutive > threshold:
                h_positions.append(y)
    
    if not h_positions:
        return None
    
    # ========== 将水平线按距离分组 ==========
    def group_lines(lines, max_gap=150):
        if not lines:
            return []
        groups = [[lines[0]]]
        for line in lines[1:]:
            if line - groups[-1][-1] <= max_gap:
                groups[-1].append(line)
            else:
                groups.append([line])
        return groups
    
    h_groups = group_lines(h_positions, max_gap=150)
    
    # 选择最可能是表格的组：线数最多 × 跨度最大
    best_group = None
    best_score = 0
    for g in h_groups:
        span = g[-1] - g[0]
        score = len(g) * span
        if score > best_score:
            best_score = score
            best_group = g
    
    if not best_group:
        return None
    
    # ========== 检测垂直线 ==========
    v_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, h_img // 10))
    v_lines_morph = cv2.morphologyEx(binary_inv, cv2.MORPH_OPEN, v_kernel, iterations=1)
    v_sums = v_lines_morph.sum(axis=0) // 255
    v_positions = [i for i, s in enumerate(v_sums) if s > h_img * 0.15]
    
    # ========== 情况1：多条水平线（完整边框表格）==========
    if len(best_group) >= 2:
        top = best_group[0]
        bottom = best_group[-1]
        left = 0
        right = w_img - 1
        
        # 用垂直线精确定位左右
        if v_positions:
            left = max(0, v_positions[0] - 30)
            right = min(w_img - 1, v_positions[-1] + 30)
        
        # 检查上方是否有多余文本（如"The following is..."）
        if top > 30:
            gap_above = True
            for i in range(max(0, top - 30), top):
                if i in text_rows:
                    gap_above = False
                    break
            if not gap_above:
                # 有文本上方，向上找直到遇到间隙
                new_top = top
                for i in range(top - 1, max(0, top - 200), -1):
                    if i in text_rows:
                        new_top = i
                    else:
                        if top - i > 15:  # 15像素间隙
                            break
                top = new_top
        
        # 检查下方是否有多余文本（如问题文字）
        if bottom < h_img - 30:
            gap_below = True
            for i in range(bottom + 1, min(h_img, bottom + 30)):
                if i in text_rows:
                    gap_below = False
                    break
            if not gap_below:
                # 有文本下方，向下找空白间隙
                new_bottom = bottom
                for i in range(bottom + 1, min(h_img, bottom + 200)):
                    if i not in text_rows and (i+1) not in text_rows and (i+2) not in text_rows:
                        new_bottom = i
                        break
                bottom = new_bottom
    
    # ========== 情况2：仅1条水平线（T-account表格）==========
    elif len(best_group) == 1:
        separator = best_group[0]
        
        # 找到顶部：向上找文本，直到遇到间隙
        top = separator
        for i in range(separator - 1, max(0, separator - 200), -1):
            if i in text_rows:
                top = i
            else:
                if separator - i > 15:
                    break
        
        # 找到底部：使用垂直线终止点
        bottom = separator + 50
        if v_positions:
            best_v = None
            best_len = 0
            for v in v_positions:
                line_len = 0
                for i in range(separator, min(h_img, separator + 400)):
                    if v_sums[v] > h_img * 0.05:
                        line_len += 1
                    else:
                        break
                if line_len > best_len:
                    best_len = line_len
                    best_v = v
            
            if best_v and best_len > 30:
                bottom = separator + best_len
                # 确认底部是否有间隙
                for i in range(bottom, min(h_img, bottom + 50)):
                    if i not in text_rows and (i+1) not in text_rows:
                        bottom = i
                        break
        
        # 如果找不到垂直线，用文本密度
        if bottom == separator + 50:
            for i in range(separator + 50, min(h_img, separator + 400)):
                if i not in text_rows and (i+1) not in text_rows and (i+2) not in text_rows:
                    bottom = i
                    break
        
        # 找到左右边界
        left = w_img
        right = 0
        for i in range(top, bottom):
            if i in text_rows:
                nz = np.nonzero(binary[i] < 255)[0]
                if len(nz) > 0:
                    left = min(left, nz[0])
                    right = max(right, nz[-1])
        
        if left > right:
            left = 0
            right = w_img - 1
        
        left = max(0, left - 30)
        right = min(w_img - 1, right + 30)
    
    else:
        return None
    
    # ========== 最终裁剪框 ==========
    x = max(0, left - 5)
    y = max(0, top - 5)
    crop_w = min(w_img - x, right - left + 10)
    crop_h = min(h_img - y, bottom - top + 10)
    
    if crop_w < 50 or crop_h < 50:
        return None
    
    return (x, y, crop_w, crop_h)


def crop_image(input_path, output_path, show_debug=False, remove_watermark=False):
    """对已有图片进行表格精确裁剪。使用PIL读取以支持中文路径。"""
    # 使用PIL读取（支持中文路径），再转为OpenCV格式
    pil_img = Image.open(str(input_path)).convert('RGB')
    img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    
    bounds = detect_table_bounds(img, remove_watermark=remove_watermark)
    if bounds is None:
        print(f"  [WARNING] Table not detected in: {input_path.name}")
        return False
    
    x, y, w, h = bounds
    cropped = img[y:y+h, x:x+w]
    
    # 使用PIL保存（支持中文路径）
    cropped_rgb = cv2.cvtColor(cropped, cv2.COLOR_BGR2RGB)
    Image.fromarray(cropped_rgb).save(str(output_path), 'PNG')
    
    if show_debug:
        debug = img.copy()
        cv2.rectangle(debug, (x, y), (x+w, y+h), (0, 0, 255), 3)
        debug_rgb = cv2.cvtColor(debug, cv2.COLOR_BGR2RGB)
        debug_path = Path(output_path).with_suffix('.debug.png')
        Image.fromarray(debug_rgb).save(str(debug_path), 'PNG')
        print(f"  [DEBUG] Debug saved: {debug_path.name}")
    
    print(f"  [OK] {input_path.name}: {img.shape[1]}x{img.shape[0]} -> {w}x{h}")
    return True


def extract_from_pdf(pdf_path, page_num, output_path, dpi=300, show_debug=False, remove_watermark=False):
    """从PDF页面提取表格。"""
    if not HAS_FITZ:
        print("❌ PyMuPDF (fitz) not installed. Install with: pip install PyMuPDF")
        return False
    
    doc = fitz.open(pdf_path)
    page = doc[page_num - 1]  # 1-indexed to 0-indexed
    
    # 渲染为图片
    zoom = dpi / 72
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat)
    
    # 转换为OpenCV格式
    img_data = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, 3)
    img = cv2.cvtColor(img_data, cv2.COLOR_RGB2BGR)
    doc.close()
    
    bounds = detect_table_bounds(img, remove_watermark=remove_watermark)
    if bounds is None:
        print(f"  [WARNING] Table not detected on page {page_num}")
        return False
    
    x, y, w, h = bounds
    cropped = img[y:y+h, x:x+w]
    
    # 使用PIL保存（支持中文路径）
    cropped_rgb = cv2.cvtColor(cropped, cv2.COLOR_BGR2RGB)
    Image.fromarray(cropped_rgb).save(str(output_path), 'PNG')
    
    if show_debug:
        debug = img.copy()
        cv2.rectangle(debug, (x, y), (x+w, y+h), (0, 0, 255), 3)
        debug_rgb = cv2.cvtColor(debug, cv2.COLOR_BGR2RGB)
        debug_path = Path(output_path).with_suffix('.debug.png')
        Image.fromarray(debug_rgb).save(str(debug_path), 'PNG')
    
    print(f"  [OK] Page {page_num}: {img.shape[1]}x{img.shape[0]} -> {w}x{h}")
    return True


def process_batch(input_dir, output_dir=None, show_debug=False, remove_watermark=False):
    """批量处理目录中的图片。"""
    input_dir = Path(input_dir)
    if not input_dir.is_dir():
        print(f"❌ Not a directory: {input_dir}")
        return False
    
    output_dir = Path(output_dir) if output_dir else input_dir
    output_dir.mkdir(parents=True, exist_ok=True)
    
    files = sorted(input_dir.glob('*.png'))
    if not files:
        print(f"ℹ️ No PNG files found in {input_dir}")
        return True
    
    print(f"\n[INFO] Processing {len(files)} images in {input_dir}\n")
    
    success = 0
    for f in files:
        out = output_dir / f.name
        if crop_image(f, out, show_debug, remove_watermark):
            success += 1
    
    print(f"\n{'='*50}")
    print(f"Done: {success}/{len(files)} tables cropped successfully")
    print(f"{'='*50}")
    return True


def main():
    parser = argparse.ArgumentParser(description='Precise table cropper -- extract only the table region')
    parser.add_argument('--pdf', type=str, help='Input PDF file path')
    parser.add_argument('--page', type=int, help='Page number (1-indexed)')
    parser.add_argument('--image', type=str, help='Input image file path')
    parser.add_argument('--output', '-o', type=str, help='Output file path')
    parser.add_argument('--batch-dir', type=str, help='Batch process directory')
    parser.add_argument('--output-dir', type=str, help='Output directory for batch mode')
    parser.add_argument('--dpi', type=int, default=300, help='DPI for PDF rendering (default: 300)')
    parser.add_argument('--debug', action='store_true', help='Save debug visualization')
    parser.add_argument('--remove-watermark', action='store_true', help='Remove gray watermark (e.g., TestDaily)')
    
    args = parser.parse_args()
    
    if args.pdf:
        if not args.page:
            print("[ERROR] --page required when using --pdf")
            sys.exit(1)
        if not args.output:
            print("[ERROR] --output required")
            sys.exit(1)
        extract_from_pdf(args.pdf, args.page, args.output, args.dpi, args.debug, args.remove_watermark)
    
    elif args.image:
        if not args.output:
            print("[ERROR] --output required")
            sys.exit(1)
        crop_image(Path(args.image), Path(args.output), args.debug, args.remove_watermark)
    
    elif args.batch_dir:
        process_batch(args.batch_dir, args.output_dir, args.debug, args.remove_watermark)
    
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
