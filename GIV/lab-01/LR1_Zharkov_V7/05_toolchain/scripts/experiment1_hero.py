#!/usr/bin/env python3
"""Експеримент №1: кодування hero (JPEG / WebP / AVIF / SVG-оригінал). Вхід: lossless PNG з SVG-майстра."""
import io, time, json, os, statistics
import numpy as np
from PIL import Image
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "04_experiment")
def psnr(a, b):
    mse = np.mean((a.astype(np.float64) - b.astype(np.float64)) ** 2)
    return 99 if mse == 0 else 10 * np.log10(255 ** 2 / mse)
def encode(img, fmt, q):
    buf = io.BytesIO(); t = time.perf_counter()
    if fmt == "JPEG":   img.save(buf, "JPEG", quality=q, optimize=True, progressive=True, subsampling=0 if q >= 90 else 2)
    elif fmt == "WebP": img.save(buf, "WEBP", quality=q, method=6)
    elif fmt == "AVIF": img.save(buf, "AVIF", quality=q, speed=6)
    return buf.getvalue(), (time.perf_counter() - t) * 1000
res = {}
for name in ["hero-desktop-master", "hero-mobile-master"]:
    src = Image.open(os.path.join(ROOT, "02_work", name + ".png")).convert("RGB"); ref = np.array(src)
    rows = []
    for fmt, qs in [("JPEG", [75, 85, 92]), ("WebP", [75, 85, 92]), ("AVIF", [50, 65, 80])]:
        for q in qs:
            data, ms = encode(src, fmt, q)
            dec = np.array(Image.open(io.BytesIO(data)).convert("RGB"))
            # "banding-помітність": максимальна абс. похибка у темній плавній зоні (нижня третина без крісел не виділяємо — беремо весь кадр 99-й перцентиль)
            err = np.abs(dec.astype(int) - ref.astype(int)).max(axis=2)
            rows.append(dict(fmt=fmt, q=q, kb=round(len(data) / 1024, 1), ms=round(ms), psnr=round(psnr(ref, dec), 2), p99=int(np.percentile(err, 99.9))))
            fn = f"{name}_{fmt}_q{q}.{'jpg' if fmt=='JPEG' else fmt.lower()}"
            open(os.path.join(OUT, fn), "wb").write(data)
    svg = open(os.path.join(ROOT, "01_source", name + ".svg"), encoding="utf-8").read()
    res[name] = dict(rows=rows, png_kb=round(os.path.getsize(os.path.join(ROOT, "02_work", name + ".png")) / 1024, 1), svg_kb=round(len(svg.encode()) / 1024, 1), size=src.size)
json.dump(res, open(os.path.join(OUT, "exp1_hero_results.json"), "w"), ensure_ascii=False, indent=1)
for n, r in res.items():
    print(n, r["size"], "PNG", r["png_kb"], "SVG", r["svg_kb"])
    for x in r["rows"]: print("  ", x)
