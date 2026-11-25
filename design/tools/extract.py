"""Split cetakins.pdf into individual transparent PNG assets.

usage: python -I extract.py <pdf> <outdir> [dpi]
"""
import sys, os, json
import numpy as np
import pymupdf as fz
from scipy import ndimage
from PIL import Image

pdf, out = sys.argv[1], sys.argv[2]
dpi = int(sys.argv[3]) if len(sys.argv) > 3 else 300
os.makedirs(out, exist_ok=True)
src = fz.open(pdf)
LAV = (0.8709849715232849, 0.8689860105514526, 0.9379873275756836)


def is_bg(p):
    f = p.get("fill")
    return f is not None and all(abs(a - b) < 1e-3 for a, b in zip(f, LAV)) and p["rect"].width > 400


def redraw(page, keep):
    """New single-page doc that redraws only selected vector paths."""
    doc = fz.open()
    np_ = doc.new_page(width=page.rect.width, height=page.rect.height)
    sh = np_.new_shape()
    for path in page.get_drawings():
        if not keep(path):
            continue
        for it in path["items"]:
            k = it[0]
            if k == "l":
                sh.draw_line(it[1], it[2])
            elif k == "re":
                sh.draw_rect(it[1])
            elif k == "qu":
                sh.draw_quad(it[1])
            elif k == "c":
                sh.draw_bezier(it[1], it[2], it[3], it[4])
        lc = path.get("lineCap") or (0,)
        sh.finish(
            fill=path.get("fill"), color=path.get("color"), dashes=path.get("dashes"),
            even_odd=path.get("even_odd", False), closePath=path.get("closePath", False),
            lineJoin=path.get("lineJoin", 0) or 0,
            lineCap=max(lc) if isinstance(lc, (tuple, list)) else lc,
            width=path.get("width") or 0,
            stroke_opacity=path.get("stroke_opacity") or 1,
            fill_opacity=path.get("fill_opacity") or 1,
        )
    sh.commit()
    return doc, np_


def render(page, clip=None):
    pm = page.get_pixmap(dpi=dpi, alpha=True, clip=clip)
    a = np.frombuffer(pm.samples, dtype=np.uint8).reshape(pm.height, pm.width, pm.n)
    return a.copy()


layers = []  # (page_no, rgba array, offset_px_x)
for pno, page in enumerate(src):
    if pno == 3:
        layers.append((pno, render(page, fz.Rect(0, 0, 595, page.rect.height)), 0))
        _d, p2 = redraw(page, lambda p: p["rect"].x0 >= 594 and not is_bg(p))
        layers.append((pno, render(p2), 0))
    elif pno == 4:
        _d, p2 = redraw(page, lambda p: not is_bg(p))
        layers.append((pno, render(p2), 0))
    else:
        layers.append((pno, render(page), 0))

meta = []
for li, (pno, img, _) in enumerate(layers):
    alpha = img[..., 3] > 8
    # fill holes & bridge tiny gaps so one sticker = one component
    mask = ndimage.binary_closing(alpha, iterations=6)
    mask = ndimage.binary_fill_holes(mask)
    lab, n = ndimage.label(mask)
    for ci, sl in enumerate(ndimage.find_objects(lab)):
        h = sl[0].stop - sl[0].start
        w = sl[1].stop - sl[1].start
        if w * h < 2500:
            continue
        crop = img[sl].copy()
        crop[..., 3] = np.where(lab[sl] == ci + 1, crop[..., 3], 0)
        name = f"p{pno + 1}_{li}_{ci:02d}.png"
        Image.fromarray(crop, "RGBA").save(os.path.join(out, name), optimize=True)
        meta.append({"file": name, "page": pno + 1, "x": sl[1].start, "y": sl[0].start, "w": w, "h": h})

json.dump(meta, open(os.path.join(out, "meta.json"), "w"), indent=1)
for m in meta:
    print(m)
