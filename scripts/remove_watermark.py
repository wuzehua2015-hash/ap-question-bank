#!/usr/bin/env python3
"""
Watermark Removal Tool — 去除图片底部版权水印

针对 College Board 风格水印（底部单行文本，如 © 2012 College Board）
策略：从底部扫描，找到水印文本行，在内容和水印之间的空白处裁剪

Usage:
    python scripts/remove_watermark.py input.png output.png
    python scripts/remove_watermark.py public/images/frq/ --batch
"""

import argparse
import os
import sys
from pathlib import Path

import numpy as np
from PIL import Image


def detect_watermark_cut(img, min_white_brightness=245, max_text_std=40, bottom_padding=2):
    """
    从底部往上扫描，找到水印文本行的上边界，返回裁剪点。
    
    策略：
    1. 从底部开始，跳过空白行（高亮度、低方差）
    2. 遇到文本行（亮度下降或方差上升）→ 进入水印区域
    3. 继续往上，找到水印结束后的第一个空白行 → 裁剪点
    4. 如果没有空白行，直接裁剪到水印开始处
    
    Args:
        min_white_brightness: 空白行最小平均亮度（0-255）
        max_text_std: 文本行最大标准差（低于此值可能是纯色而非文本）
        bottom_padding: 裁剪后保留的底部边距（像素）
    
    Returns:
        (new_height, had_watermark) — 新高度和是否检测到水印
    """
    arr = np.array(img).astype(np.float32)
    h, w = arr.shape[:2]
    
    # 灰度化
    if len(arr.shape) == 3:
        gray = np.mean(arr, axis=2)
    else:
        gray = arr
    
    # 每行统计
    row_mean = np.mean(gray, axis=1)
    row_std = np.std(gray, axis=1)
    
    # 判断空白行：亮度高 + 方差低
    is_white = (row_mean >= min_white_brightness) & (row_std <= max_text_std)
    
    # 从底部往上扫描
    state = 'blank'  # blank -> watermark -> content
    watermark_top = None
    
    for i in range(h - 1, -1, -1):
        if state == 'blank':
            # 跳过底部空白行
            if not is_white[i]:
                state = 'watermark'
                watermark_top = i
        elif state == 'watermark':
            # 在水印区域内，找最上方的非空白行
            if not is_white[i]:
                watermark_top = i
            else:
                # 水印结束，进入内容区域
                state = 'content'
                # i 是内容区域的最后一行（空白行），i+1 是水印开始行
                cut_row = i + 1  # 不额外加 padding，直接裁剪到水印开始处
                max_cut = max(50, int(h * 0.20))
                if cut_row >= h - max_cut:
                    return cut_row, True
                else:
                    return h, False
    
    # 如果扫描完都没找到内容区域，保守处理
    if watermark_top is not None:
        cut_row = watermark_top  # 裁剪到水印最上方
        max_cut = max(50, int(h * 0.20))
        if cut_row >= h - max_cut:
            return cut_row, True
    
    return h, False


def remove_watermark(img, **kwargs):
    """去除水印，返回处理后的图片。"""
    arr = np.array(img)
    h = arr.shape[0]
    
    new_h, had_watermark = detect_watermark_cut(img, **kwargs)
    
    if not had_watermark or new_h >= h:
        return img, False
    
    result = arr[:new_h, :]
    return Image.fromarray(result), True


def process_single(input_path, output_path=None, backup=True, **kwargs):
    """处理单个文件。"""
    input_path = Path(input_path)
    if not input_path.exists():
        print(f"❌ File not found: {input_path}")
        return False
    
    img = Image.open(input_path).convert('RGB')
    result, had_watermark = remove_watermark(img, **kwargs)
    
    if not had_watermark:
        print(f"  ℹ️ No watermark detected: {input_path.name}")
        return True
    
    old_h, new_h = img.size[1], result.size[1]
    
    # 备份
    if backup:
        backup_path = input_path.with_suffix('.original.png')
        if not backup_path.exists():
            img.save(backup_path, 'PNG')
            print(f"  💾 Backup: {backup_path.name}")
    
    # 保存
    if output_path is None:
        output_path = input_path
    result.save(output_path, 'PNG')
    
    print(f"  ✅ {input_path.name}: {old_h}→{new_h}px (cut {old_h - new_h}px)")
    return True


def process_batch(input_dir, output_dir=None, backup=True, extensions=('.png',), **kwargs):
    """批量处理目录。"""
    input_dir = Path(input_dir)
    if not input_dir.is_dir():
        print(f"❌ Not a directory: {input_dir}")
        return False
    
    files = []
    for ext in extensions:
        files.extend(input_dir.glob(f'*{ext}'))
    
    if not files:
        print(f"ℹ️ No images found in {input_dir}")
        return True
    
    print(f"\n📁 Processing {len(files)} images in {input_dir}\n")
    
    modified = 0
    for f in sorted(files):
        out = Path(output_dir) / f.name if output_dir else None
        if process_single(f, out, backup, **kwargs):
            if out is None or out == f:
                img = Image.open(f)
                if img.size[1] < Image.open(f.with_suffix('.original.png') if f.with_suffix('.original.png').exists() else f).size[1]:
                    modified += 1
    
    print(f"\n{'='*50}")
    print(f"Done: {len(files)} processed, {modified} watermarks removed")
    print(f"{'='*50}")
    return True


def main():
    parser = argparse.ArgumentParser(description='Remove bottom watermarks from images')
    parser.add_argument('input', help='Input file or directory')
    parser.add_argument('-o', '--output', help='Output file or directory (default: overwrite)')
    parser.add_argument('--batch', action='store_true', help='Batch process directory')
    parser.add_argument('--brightness', type=int, default=245, help='Min brightness for blank rows (0-255, default: 245)')
    parser.add_argument('--std', type=int, default=40, help='Max std for blank rows (default: 40)')
    parser.add_argument('--padding', type=int, default=2, help='Bottom padding after cut (default: 2)')
    parser.add_argument('--no-backup', action='store_true', help='Skip .original.png backups')
    parser.add_argument('--extensions', default='.png', help='Image extensions (comma-separated)')
    
    args = parser.parse_args()
    
    kwargs = {
        'min_white_brightness': args.brightness,
        'max_text_std': args.std,
        'bottom_padding': args.padding,
    }
    exts = tuple(args.extensions.split(','))
    
    if args.batch or Path(args.input).is_dir():
        process_batch(args.input, args.output, not args.no_backup, exts, **kwargs)
    else:
        process_single(args.input, args.output, not args.no_backup, **kwargs)


if __name__ == '__main__':
    main()
