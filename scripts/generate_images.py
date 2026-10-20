"""Procedural product and editorial artwork for the T.O.O.K FIT demo store.

These are original, code-drawn studio illustrations (not photographs and not
AI-generated). They are deterministic: running the script again produces the
same files. Requires Pillow.

    python scripts/generate_images.py
"""
from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageChops

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "images" / "products"
EDITORIAL = ROOT / "public" / "images" / "editorial"

W, H = 1024, 1280
SS = 2  # supersampling factor

COLORS = {
    "black": (40, 40, 42),
    "charcoal": (62, 63, 66),
    "gray": (140, 140, 138),
    "cream": (226, 218, 200),
    "white": (238, 236, 230),
    "camel": (176, 136, 92),
    "brown": (104, 74, 52),
    "sand": (196, 178, 146),
    "navy": (40, 50, 74),
    "olive": (92, 96, 66),
    "blue": (150, 172, 198),
    "denim": (78, 98, 128),
    "washed-black": (56, 56, 60),
}

BACKDROPS = [
    ((236, 233, 226), (222, 218, 209)),
    ((229, 226, 220), (212, 208, 200)),
    ((240, 237, 231), (226, 221, 211)),
    ((222, 221, 217), (205, 204, 199)),
]

# slug, kind, (primary color, secondary color)
PRODUCTS = [
    ("ardent-wool-overcoat", "coat", ("black", "camel")),
    ("northline-down-puffer", "puffer", ("black", "olive")),
    ("meridian-leather-bomber", "bomber", ("black", "brown")),
    ("sable-suede-blouson", "blouson", ("brown", "sand")),
    ("fieldwork-quilted-jacket", "quilted", ("olive", "navy")),
    ("stratus-technical-parka", "parka", ("charcoal", "olive")),
    ("harbor-cable-knit-sweater", "cable", ("cream", "navy")),
    ("linea-mock-neck-knit", "mockneck", ("black", "cream")),
    ("atelier-shawl-cardigan", "cardigan", ("brown", "charcoal")),
    ("ridge-half-zip-knit", "halfzip", ("navy", "gray")),
    ("loft-brushed-mohair-crew", "mohair", ("gray", "cream")),
    ("base-heavyweight-sweatshirt", "sweatshirt", ("gray", "black")),
    ("studio-long-sleeve-tee", "longtee", ("white", "charcoal")),
    ("campus-oxford-shirt", "shirt", ("blue", "white")),
    ("quarry-flannel-overshirt", "overshirt", ("brown", "olive")),
    ("echo-waffle-henley", "henley", ("cream", "charcoal")),
    ("avenue-wide-wool-trousers", "widetrousers", ("charcoal", "brown")),
    ("harlow-corduroy-pants", "corduroy", ("brown", "cream")),
    ("terrain-cargo-pants", "cargo", ("olive", "black")),
    ("ash-washed-denim", "denim", ("washed-black", "denim")),
    ("rest-fleece-sweatpants", "sweatpants", ("gray", "navy")),
    ("pleat-tapered-chinos", "chinos", ("sand", "navy")),
    ("hearth-knit-lounge-set", "knitset", ("cream", "gray")),
    ("transit-tracksuit-set", "tracksuit", ("black", "navy")),
    ("column-flannel-two-piece", "suitset", ("charcoal", "navy")),
    ("clerk-leather-derby", "derby", ("black", "brown")),
    ("frost-winter-sneaker", "sneaker", ("cream", "black")),
    ("moor-chelsea-boots", "boot", ("black", "brown")),
    ("commute-nylon-crossbody", "crossbody", ("black", "olive")),
    ("market-canvas-tote", "tote", ("cream", "black")),
    ("drift-cashmere-blend-scarf", "scarf", ("charcoal", "camel")),
    ("dock-ribbed-beanie", "beanie", ("black", "olive")),
]


def shade(c, f):
    return tuple(max(0, min(255, int(v * f))) for v in c)


def mix(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


# ---------------------------------------------------------------- backdrop
def backdrop(size, seed, horizon=0.74):
    w, h = size
    wall, floor = BACKDROPS[seed % len(BACKDROPS)]
    img = Image.new("RGB", size, wall)
    d = ImageDraw.Draw(img)
    hy = int(h * horizon)
    d.rectangle([0, hy, w, h], fill=floor)
    # soft light falloff from the top-left window
    light = Image.new("L", size, 0)
    ld = ImageDraw.Draw(light)
    ld.ellipse([-w * 0.4, -h * 0.5, w * 0.9, h * 0.7], fill=40)
    light = light.filter(ImageFilter.GaussianBlur(w // 6))
    img = Image.composite(Image.new("RGB", size, (255, 253, 248)), img, light)
    # architectural shadow band
    shadow = Image.new("L", size, 0)
    sd = ImageDraw.Draw(shadow)
    x0 = int(w * (0.62 + (seed % 3) * 0.08))
    sd.polygon([(x0, 0), (x0 + w * 0.22, 0), (x0 + w * 0.12, hy), (x0 - w * 0.1, hy)], fill=26)
    shadow = shadow.filter(ImageFilter.GaussianBlur(w // 40))
    img = Image.composite(Image.new("RGB", size, (150, 146, 138)), img, shadow)
    return img


# ---------------------------------------------------------------- shapes
def top_polygon(cx, top, width, length, sleeve, drop=0.0):
    """Flat-lay upper garment silhouette. Units are pixels."""
    hw = width / 2
    neck = width * 0.16
    sh_y = top + 30
    arm_y = sh_y + width * 0.42
    cuff_dx = width * (0.84 + drop)
    return [
        (cx - neck, top), (cx + neck, top),
        (cx + hw, sh_y),
        (cx + cuff_dx, sh_y + sleeve), (cx + cuff_dx - width * 0.24, sh_y + sleeve + 24),
        (cx + hw - 10, arm_y),
        (cx + hw - 6, top + length), (cx - hw + 6, top + length),
        (cx - hw + 10, arm_y),
        (cx - cuff_dx + width * 0.24, sh_y + sleeve + 24), (cx - cuff_dx, sh_y + sleeve),
        (cx - hw, sh_y),
    ]


def bottom_polygon(cx, top, width, length, hem, taper=0.0):
    hw = width / 2
    crotch = top + length * 0.3
    hem_w = hem * 0.42
    return [
        (cx - hw, top), (cx + hw, top),
        (cx + hw + 12 - taper, top + length * 0.5),
        (cx + hw + 8 - taper * 1.4, top + length),
        (cx + hw + 8 - taper * 1.4 - hem_w * 2, top + length),
        (cx + 8, crotch),
        (cx - 8, crotch),
        (cx - hw - 8 + taper * 1.4 + hem_w * 2, top + length),
        (cx - hw - 8 + taper * 1.4, top + length),
        (cx - hw - 12 + taper, top + length * 0.5),
    ]


class Canvas:
    def __init__(self, img):
        self.img = img
        self.size = img.size

    def shape(self, poly, color, texture=None, shadow=True, outline=True):
        w, h = self.size
        mask = Image.new("L", self.size, 0)
        ImageDraw.Draw(mask).polygon(poly, fill=255)
        if shadow:
            sh = mask.filter(ImageFilter.GaussianBlur(w // 70))
            sh = ImageChops.offset(sh, w // 90, w // 60).point(lambda v: v * 55 // 255)
            self.img.paste((40, 36, 32), (0, 0), sh)
        layer = Image.new("RGB", self.size, color)
        if texture:
            texture(layer, mask, color)
        # gentle volume: lighter top-left, darker bottom-right
        vol = Image.linear_gradient("L").resize(self.size).point(lambda v: v * 34 // 255)
        layer = ImageChops.subtract(layer, Image.merge("RGB", (vol, vol, vol)))
        self.img.paste(layer, (0, 0), mask)
        if outline:
            ImageDraw.Draw(self.img).line(poly + [poly[0]], fill=shade(color, 0.72), width=3 * SS, joint="curve")
        return mask

    def line(self, pts, color, width=3):
        ImageDraw.Draw(self.img).line(pts, fill=color, width=width * SS, joint="curve")

    def ellipse(self, box, fill=None, outline=None, width=2):
        ImageDraw.Draw(self.img).ellipse(box, fill=fill, outline=outline, width=width * SS)

    def rect(self, box, fill=None, outline=None, width=2, radius=0):
        ImageDraw.Draw(self.img).rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width * SS)


# ---------------------------------------------------------------- textures
def tex_lines(spacing, vertical=True, strength=0.9, wave=0.0, angle=False):
    def apply(layer, mask, color):
        d = ImageDraw.Draw(layer)
        w, h = layer.size
        dark = shade(color, strength)
        step = spacing * SS
        if angle:
            for x in range(-h, w, step):
                d.line([(x, 0), (x + h, h)], fill=dark, width=SS)
            return
        if vertical:
            for x in range(0, w, step):
                if wave:
                    pts = [(x + math.sin(y / (18 * SS)) * wave * SS, y) for y in range(0, h, 8 * SS)]
                    d.line(pts, fill=dark, width=2 * SS)
                else:
                    d.line([(x, 0), (x, h)], fill=dark, width=SS)
        else:
            for y in range(0, h, step):
                d.line([(0, y), (w, y)], fill=dark, width=SS)
    return apply


def tex_cable(layer, mask, color):
    d = ImageDraw.Draw(layer)
    w, h = layer.size
    dark, light = shade(color, 0.82), shade(color, 1.06)
    for x0 in range(0, w, 70 * SS):
        for y in range(0, h, 44 * SS):
            d.arc([x0, y, x0 + 36 * SS, y + 44 * SS], 200, 340, fill=dark, width=5 * SS)
            d.arc([x0, y + 22 * SS, x0 + 36 * SS, y + 66 * SS], 20, 160, fill=light, width=5 * SS)
        d.line([(x0 + 52 * SS, 0), (x0 + 52 * SS, h)], fill=dark, width=2 * SS)


def tex_noise(strength=18, blur=0):
    def apply(layer, mask, color):
        n = Image.effect_noise(layer.size, strength)
        if blur:
            n = n.filter(ImageFilter.GaussianBlur(blur))
        n = n.point(lambda v: (v - 128) // 3 + 128)
        base = Image.merge("RGB", (n, n, n))
        layer.paste(ImageChops.overlay(layer, base))
    return apply


def tex_quilt(layer, mask, color):
    tex_lines(46, angle=True, strength=0.78)(layer, mask, color)
    d = ImageDraw.Draw(layer)
    w, h = layer.size
    for x in range(0, w + h, 46 * SS):
        d.line([(x, 0), (x - h, h)], fill=shade(color, 0.78), width=SS)


def tex_puffer(layer, mask, color):
    d = ImageDraw.Draw(layer)
    w, h = layer.size
    band = 62 * SS
    for y in range(0, h, band):
        for i in range(band):
            t = math.sin(i / band * math.pi)
            d.line([(0, y + i), (w, y + i)], fill=shade(color, 0.8 + 0.32 * t))


def tex_leather(layer, mask, color):
    tex_noise(10, 2)(layer, mask, color)
    hl = Image.new("L", layer.size, 0)
    hd = ImageDraw.Draw(hl)
    w, h = layer.size
    hd.ellipse([w * 0.3, h * 0.2, w * 0.5, h * 0.6], fill=60)
    hl = hl.filter(ImageFilter.GaussianBlur(w // 18))
    layer.paste(Image.composite(Image.new("RGB", layer.size, shade(color, 1.9)), layer, hl))


def tex_check(layer, mask, color):
    d = ImageDraw.Draw(layer)
    w, h = layer.size
    dark = shade(color, 0.72)
    light = shade(color, 1.18)
    for x in range(0, w, 80 * SS):
        d.rectangle([x, 0, x + 26 * SS, h], fill=dark)
        d.line([(x + 50 * SS, 0), (x + 50 * SS, h)], fill=light, width=2 * SS)
    over = Image.new("RGB", layer.size, dark)
    m = Image.new("L", layer.size, 0)
    md = ImageDraw.Draw(m)
    for y in range(0, h, 80 * SS):
        md.rectangle([0, y, w, y + 26 * SS], fill=110)
    layer.paste(Image.composite(over, layer, m))


def tex_denim(layer, mask, color):
    tex_lines(5, angle=True, strength=0.86)(layer, mask, color)
    fade = Image.new("L", layer.size, 0)
    fd = ImageDraw.Draw(fade)
    w, h = layer.size
    fd.ellipse([w * 0.3, h * 0.35, w * 0.48, h * 0.62], fill=90)
    fd.ellipse([w * 0.52, h * 0.35, w * 0.7, h * 0.62], fill=90)
    fade = fade.filter(ImageFilter.GaussianBlur(w // 25))
    layer.paste(Image.composite(Image.new("RGB", layer.size, shade(color, 1.45)), layer, fade))


# ---------------------------------------------------------------- garments
def draw_top(c, kind, color, cx, top, scale=1.0):
    width = 400 * scale * SS
    length = {"coat": 760, "parka": 640, "puffer": 470, "bomber": 400, "blouson": 410,
              "quilted": 470, "overshirt": 500, "shirt": 500}.get(kind, 450) * scale * SS
    sleeve = {"coat": 560, "parka": 520}.get(kind, 430) * scale * SS
    if kind in ("puffer", "parka"):
        width *= 1.1
    drop = 0.06 if kind in ("sweatshirt", "mohair", "cable", "knitset") else 0.0
    poly = top_polygon(cx, top, width, length, sleeve, drop)
    texture = {
        "coat": tex_noise(14, 1), "puffer": tex_puffer, "bomber": tex_leather,
        "blouson": tex_noise(26, 2), "quilted": tex_quilt, "parka": tex_noise(8),
        "cable": tex_cable, "mockneck": tex_lines(9), "cardigan": tex_lines(10),
        "halfzip": tex_lines(9), "mohair": tex_noise(30, 3), "sweatshirt": tex_noise(12, 1),
        "longtee": tex_noise(8), "shirt": tex_lines(6, vertical=False, strength=0.95),
        "overshirt": tex_check, "henley": tex_lines(7, vertical=False, strength=0.88),
        "knitset": tex_lines(10), "tracksuit": tex_noise(6), "suitset": tex_noise(14, 1),
    }.get(kind)
    c.shape(poly, COLORS[color] if isinstance(color, str) else color, texture)
    col = COLORS[color] if isinstance(color, str) else color
    seam = shade(col, 0.62)
    hi = shade(col, 1.25) if sum(col) < 300 else shade(col, 0.8)
    neck = width * 0.16
    hw = width / 2
    hem = top + length
    # collars and closures
    if kind in ("coat", "suitset"):
        c.shape([(cx - neck, top), (cx - neck * 0.2, top + length * 0.38), (cx - neck * 1.45, top + length * 0.16), (cx - neck * 1.2, top + 10)], shade(col, 0.9), shadow=False)
        c.shape([(cx + neck, top), (cx + neck * 0.2, top + length * 0.38), (cx + neck * 1.45, top + length * 0.16), (cx + neck * 1.2, top + 10)], shade(col, 0.9), shadow=False)
        c.line([(cx, top + length * 0.38), (cx, hem)], seam)
        for i in range(2 if kind == "coat" else 1):
            y = top + length * (0.45 + i * 0.16)
            c.ellipse([cx - 30 * SS, y - 10 * SS, cx - 10 * SS, y + 10 * SS], fill=shade(col, 0.5))
        c.line([(cx - hw * 0.75, top + length * 0.62), (cx - hw * 0.3, top + length * 0.62)], seam)
        c.line([(cx + hw * 0.3, top + length * 0.62), (cx + hw * 0.75, top + length * 0.62)], seam)
    elif kind in ("puffer", "parka", "bomber", "blouson", "quilted", "tracksuit", "halfzip"):
        zip_end = top + length * (0.3 if kind == "halfzip" else 1.0)
        c.line([(cx, top + 16 * SS), (cx, zip_end)], hi, 3)
        if kind in ("bomber", "tracksuit", "halfzip"):
            c.shape([(cx - neck - 6, top - 12 * SS), (cx + neck + 6, top - 12 * SS), (cx + neck, top + 22 * SS), (cx - neck, top + 22 * SS)], shade(col, 0.82), tex_lines(6), shadow=False)
        if kind in ("bomber", "tracksuit"):
            c.rect([cx - hw + 6, hem - 34 * SS, cx + hw - 6, hem], fill=shade(col, 0.82))
        if kind == "parka":
            c.shape([(cx - neck * 1.6, top + 20), (cx - neck * 1.1, top - 120 * SS), (cx, top - 150 * SS), (cx + neck * 1.1, top - 120 * SS), (cx + neck * 1.6, top + 20)], shade(col, 0.88), tex_noise(8), shadow=False)
            for sx in (-1, 1):
                c.rect([cx + sx * hw * 0.62 - 60 * SS, top + length * 0.55, cx + sx * hw * 0.62 + 60 * SS, top + length * 0.75], outline=seam, width=2)
        if kind == "tracksuit":
            for sx in (-1, 1):
                c.line([(cx + sx * hw, top + 34 * SS), (cx + sx * (hw + 150 * SS * scale), top + 450 * SS * scale)], (230, 228, 222), 4)
        if kind in ("quilted", "blouson"):
            c.shape([(cx - neck - 10, top - 4), (cx + neck + 10, top - 4), (cx + neck * 1.7, top + 50 * SS), (cx - neck * 1.7, top + 50 * SS)], shade(col, 0.78), shadow=False)
            for i in range(4):
                y = top + 70 * SS + i * length / 5
                c.ellipse([cx + 14 * SS, y, cx + 30 * SS, y + 16 * SS], fill=hi)
    elif kind in ("shirt", "overshirt", "cardigan", "henley"):
        if kind != "henley":
            c.shape([(cx - neck - 8, top - 6), (cx, top + 46 * SS), (cx + neck + 8, top - 6), (cx + neck * 1.5, top + 40 * SS), (cx, top + 70 * SS), (cx - neck * 1.5, top + 40 * SS)], shade(col, 0.94), shadow=False)
        btn_end = top + length * (0.3 if kind == "henley" else 0.95)
        c.line([(cx, top + 60 * SS), (cx, btn_end)], seam, 2)
        n = 3 if kind == "henley" else 6
        for i in range(n):
            y = top + 90 * SS + i * (btn_end - top - 100 * SS) / max(1, n - 1)
            c.ellipse([cx + 6 * SS, y - 7 * SS, cx + 20 * SS, y + 7 * SS], fill=(226, 222, 212) if sum(col) < 400 else shade(col, 0.7))
        if kind in ("overshirt", "shirt"):
            for sx in (-1, 1):
                c.rect([cx + sx * hw * 0.5 - 50 * SS, top + 110 * SS, cx + sx * hw * 0.5 + 50 * SS, top + 220 * SS], outline=seam, width=2)
                if kind == "shirt":
                    break
    else:
        # knit / sweat / tee crews and mock necks
        if kind in ("mockneck",):
            c.shape([(cx - neck, top - 50 * SS), (cx + neck, top - 50 * SS), (cx + neck, top + 10), (cx - neck, top + 10)], shade(col, 0.88), tex_lines(7), shadow=False)
        else:
            c.ellipse([cx - neck, top - 26 * SS, cx + neck, top + 34 * SS], outline=seam, width=6)
        if kind in ("cable", "mockneck", "halfzip", "mohair", "sweatshirt", "knitset"):
            c.rect([cx - hw + 6, hem - 40 * SS, cx + hw - 6, hem], fill=shade(col, 0.86))
    return top + length


def draw_bottom(c, kind, color, cx, top, scale=1.0):
    col = COLORS[color] if isinstance(color, str) else color
    width = 300 * scale * SS
    length = 780 * scale * SS
    hem = {"widetrousers": 190, "corduroy": 150, "cargo": 150, "denim": 140, "sweatpants": 110,
           "chinos": 115, "knitset": 140, "tracksuit": 120, "suitset": 150}.get(kind, 140) * scale * SS
    taper = {"chinos": 30, "sweatpants": 40, "tracksuit": 30}.get(kind, 0) * scale * SS
    texture = {
        "widetrousers": tex_noise(14, 1), "corduroy": tex_lines(8, strength=0.8), "cargo": tex_noise(10),
        "denim": tex_denim, "sweatpants": tex_noise(14, 2), "chinos": tex_noise(8),
        "knitset": tex_lines(10), "tracksuit": tex_noise(6), "suitset": tex_noise(14, 1),
    }.get(kind)
    poly = bottom_polygon(cx, top, width, length, hem, taper)
    c.shape(poly, col, texture)
    seam = shade(col, 0.6)
    c.rect([cx - width / 2, top, cx + width / 2, top + 40 * SS], fill=shade(col, 0.84))
    if kind in ("widetrousers", "chinos", "suitset"):
        for sx in (-1, 1):
            c.line([(cx + sx * width * 0.25, top + 40 * SS), (cx + sx * width * 0.3, top + length)], shade(col, 0.78), 2)
    if kind == "cargo":
        for sx in (-1, 1):
            x = cx + sx * width * 0.42
            c.rect([x - 52 * SS, top + length * 0.42, x + 52 * SS, top + length * 0.6], fill=shade(col, 0.92), outline=seam, width=2)
    if kind == "denim":
        c.line([(cx - width / 2 + 20 * SS, top + 60 * SS), (cx - 30 * SS, top + 100 * SS)], (200, 160, 90), 2)
        c.line([(cx + width / 2 - 20 * SS, top + 60 * SS), (cx + 30 * SS, top + 100 * SS)], (200, 160, 90), 2)
    if kind in ("sweatpants", "tracksuit", "knitset"):
        c.line([(cx - 20 * SS, top + 40 * SS), (cx - 30 * SS, top + 120 * SS)], (232, 230, 224), 3)
        c.line([(cx + 20 * SS, top + 40 * SS), (cx + 30 * SS, top + 120 * SS)], (232, 230, 224), 3)
    if kind == "tracksuit":
        for sx in (-1, 1):
            c.line([(cx + sx * (width / 2 + 6 * SS), top + 50 * SS), (cx + sx * (width / 2 + 2 * SS - taper * 1.2), top + length - 10)], (230, 228, 222), 4)
    return top + length


def shoe_poly(x, y, s, boot=False, sneaker=False):
    h = (210 if boot else 120) * s
    l = 330 * s
    pts = [
        (x, y), (x + l, y), (x + l + 20 * s, y - 30 * s), (x + l - 10 * s, y - 70 * s),
        (x + l * 0.62, y - 95 * s if not boot else y - 105 * s),
        (x + l * 0.38, y - h), (x + l * 0.05, y - h), (x - 10 * s, y - 50 * s),
    ]
    return pts


def draw_shoes(c, kind, color, cx, cy, scale=1.0):
    col = COLORS[color]
    s = scale * SS
    for i, dx in enumerate((-190, 20)):
        x = cx + dx * s
        y = cy + i * 40 * s
        boot = kind == "boot"
        poly = shoe_poly(x, y, s, boot=boot, sneaker=kind == "sneaker")
        tex = tex_noise(24, 2) if (kind == "boot" and color == "brown") else tex_leather
        if kind == "sneaker":
            tex = tex_noise(10)
        c.shape(poly, col, tex)
        sole = (236, 232, 222) if kind == "sneaker" else shade(col, 0.5) if sum(col) > 200 else (34, 30, 28)
        c.rect([x - 12 * s, y - 4 * s, x + 352 * s, y + (34 if kind == "sneaker" else 18) * s], fill=sole, radius=int(10 * s))
        if boot:
            c.rect([x + 40 * s, y - 200 * s, x + 110 * s, y - 70 * s], fill=shade(col, 1.5))
            c.line([(x + 75 * s, y - 210 * s), (x + 75 * s, y - 240 * s)], shade(col, 0.6), 4)
        else:
            for k in range(4):
                lx = x + (170 + k * 28) * s
                c.line([(lx, y - 92 * s + k * 6 * s), (lx + 22 * s, y - 70 * s + k * 6 * s)], (236, 234, 228) if sum(col) < 300 else shade(col, 0.6), 2)
        if kind == "sneaker":
            c.line([(x + 60 * s, y - 40 * s), (x + 260 * s, y - 40 * s)], shade(col, 0.82), 3)


def draw_bag(c, kind, color, cx, cy, scale=1.0):
    col = COLORS[color]
    s = scale * SS
    if kind == "tote":
        w, h = 470 * s, 520 * s
        for hx in (-110, 110):
            ImageDraw.Draw(c.img).arc([cx + hx * s - 70 * s, cy - h / 2 - 200 * s, cx + hx * s + 70 * s, cy - h / 2 + 60 * s], 180, 360, fill=shade(col, 0.7), width=int(18 * s))
        poly = [(cx - w / 2, cy - h / 2), (cx + w / 2, cy - h / 2), (cx + w / 2 + 30 * s, cy + h / 2), (cx - w / 2 - 30 * s, cy + h / 2)]
        c.shape(poly, col, tex_lines(5, vertical=False, strength=0.94))
        c.rect([cx - w / 2 - 30 * s, cy + h / 2 - 60 * s, cx + w / 2 + 30 * s, cy + h / 2], fill=shade(col, 0.88))
    else:
        ImageDraw.Draw(c.img).arc([cx - 300 * s, cy - 620 * s, cx + 300 * s, cy + 40 * s], 190, 350, fill=shade(col, 0.75), width=int(16 * s))
        w, h = 400 * s, 290 * s
        poly = [(cx - w / 2, cy - h / 2 + 30 * s), (cx - w / 2 + 30 * s, cy - h / 2), (cx + w / 2 - 30 * s, cy - h / 2), (cx + w / 2, cy - h / 2 + 30 * s), (cx + w / 2, cy + h / 2 - 30 * s), (cx + w / 2 - 30 * s, cy + h / 2), (cx - w / 2 + 30 * s, cy + h / 2), (cx - w / 2, cy + h / 2 - 30 * s)]
        c.shape(poly, col, tex_noise(10))
        c.line([(cx - w / 2 + 30 * s, cy - h / 2 + 60 * s), (cx + w / 2 - 30 * s, cy - h / 2 + 60 * s)], (210, 206, 198), 3)
        c.rect([cx - 40 * s, cy - h / 2 - 10 * s, cx + 40 * s, cy - h / 2 + 30 * s], fill=(70, 70, 72), radius=int(6 * s))


def draw_scarf(c, color, cx, cy, scale=1.0):
    col = COLORS[color]
    s = scale * SS
    w = 230 * s
    poly = [(cx - w / 2, cy - 520 * s), (cx + w / 2, cy - 520 * s), (cx + w / 2 + 40 * s, cy + 420 * s), (cx - w / 2 + 40 * s, cy + 420 * s)]
    c.shape(poly, col, tex_noise(28, 3))
    fold = [(cx - w / 2 - 60 * s, cy - 200 * s), (cx + w / 2 + 10 * s, cy - 260 * s), (cx + w / 2 + 50 * s, cy - 120 * s), (cx - w / 2 - 20 * s, cy - 60 * s)]
    c.shape(fold, shade(col, 0.9), tex_noise(28, 3))
    for k in range(18):
        x = cx - w / 2 + 40 * s + k * (w / 17)
        c.line([(x, cy + 420 * s), (x + 4 * s, cy + 480 * s)], shade(col, 0.85), 3)


def draw_beanie(c, color, cx, cy, scale=1.0):
    col = COLORS[color]
    s = scale * SS
    w = 420 * s
    pts = []
    for i in range(41):
        a = math.pi * i / 40
        pts.append((cx - math.cos(a) * w / 2, cy - math.sin(a) * 330 * s))
    c.shape(pts, col, tex_lines(12))
    c.shape([(cx - w / 2 - 14 * s, cy - 10 * s), (cx + w / 2 + 14 * s, cy - 10 * s), (cx + w / 2 + 14 * s, cy + 150 * s), (cx - w / 2 - 14 * s, cy + 150 * s)], shade(col, 0.9), tex_lines(14, strength=0.8))


def render_product(slug, kind, color, variant, seed):
    size = (W * SS, H * SS)
    img = backdrop(size, seed + variant)
    c = Canvas(img)
    cx = W * SS / 2
    if variant == 2:
        cx += (40 if seed % 2 else -40) * SS
    scale = 1.0 if variant == 1 else 1.18
    tops = {"coat", "puffer", "bomber", "blouson", "quilted", "parka", "cable", "mockneck", "cardigan",
            "halfzip", "mohair", "sweatshirt", "longtee", "shirt", "overshirt", "henley"}
    bottoms = {"widetrousers", "corduroy", "cargo", "denim", "sweatpants", "chinos"}
    if kind in tops:
        top = (230 if kind not in ("coat", "parka") else 170) * SS
        if variant == 2:
            top -= 20 * SS
        draw_top(c, kind, color, cx, top, scale * (0.95 if kind == "coat" else 1.05))
    elif kind in bottoms:
        draw_bottom(c, kind, color, cx, (180 if variant == 1 else 120) * SS, scale * 1.0)
    elif kind in ("knitset", "tracksuit", "suitset"):
        sc = 0.72 * scale
        draw_bottom(c, kind, color, cx + 150 * SS, 420 * SS, sc * 0.95)
        draw_top(c, kind, color, cx - 120 * SS, 170 * SS, sc)
    elif kind in ("derby", "sneaker", "boot"):
        draw_shoes(c, kind, color, cx - 20 * SS, (820 if variant == 1 else 860) * SS, scale * 1.2)
    elif kind in ("tote", "crossbody"):
        draw_bag(c, kind, color, cx, 700 * SS, scale)
    elif kind == "scarf":
        draw_scarf(c, color, cx, 640 * SS, scale)
    elif kind == "beanie":
        draw_beanie(c, color, cx, 760 * SS, scale * 1.1)
    img = c.img.resize((W, H), Image.LANCZOS)
    noise = Image.effect_noise((W, H), 10).convert("RGB")
    img = Image.blend(img, ImageChops.overlay(img, noise), 0.12)
    return img


def render_editorial(name, size, garments, seed):
    w, h = size
    img = backdrop((w * SS, h * SS), seed, horizon=0.78)
    c = Canvas(img)
    for g in garments:
        kind, color, x, y, sc = g
        x *= SS
        y *= SS
        if kind in ("coat", "cable", "parka", "mockneck", "overshirt", "puffer"):
            draw_top(c, kind, color, x, y, sc)
        elif kind in ("widetrousers", "corduroy"):
            draw_bottom(c, kind, color, x, y, sc)
        elif kind in ("boot", "derby", "sneaker"):
            draw_shoes(c, kind, color, x, y, sc)
        elif kind == "scarf":
            draw_scarf(c, color, x, y, sc)
        elif kind == "beanie":
            draw_beanie(c, color, x, y, sc)
        elif kind in ("tote", "crossbody"):
            draw_bag(c, kind, color, x, y, sc)
    img = img.resize(size, Image.LANCZOS)
    img.save(EDITORIAL / name, "WEBP", quality=80, method=6)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    EDITORIAL.mkdir(parents=True, exist_ok=True)
    random.seed(7)
    for i, (slug, kind, colors) in enumerate(PRODUCTS):
        for v in (1, 2):
            img = render_product(slug, kind, colors[v - 1], v, i)
            path = OUT / f"{slug}-0{v}.webp"
            img.save(path, "WEBP", quality=80, method=6)
    fb = backdrop((W, H), 1)
    d = ImageDraw.Draw(fb)
    d.rectangle([W * 0.42, H * 0.42, W * 0.58, H * 0.42 + 2], fill=(150, 146, 138))
    fb.save(OUT / "fallback.webp", "WEBP", quality=80)
    render_editorial("hero-01.webp", (2000, 1125), [
        ("coat", "black", 560, 120, 1.05), ("cable", "cream", 1080, 200, 0.85),
        ("widetrousers", "charcoal", 1500, 160, 0.95), ("boot", "black", 1700, 1000, 0.75),
        ("scarf", "camel", 1880, 520, 0.6),
    ], 0)
    render_editorial("hero-mobile-01.webp", (1024, 1280), [
        ("coat", "black", 420, 120, 0.85), ("cable", "cream", 780, 380, 0.6), ("boot", "black", 600, 1180, 0.6),
    ], 2)
    render_editorial("editorial-02.webp", (2000, 1000), [
        ("parka", "charcoal", 520, 160, 0.9), ("mockneck", "cream", 1000, 220, 0.75),
        ("corduroy", "brown", 1400, 140, 0.85), ("beanie", "olive", 1760, 760, 0.6),
        ("crossbody", "black", 1820, 420, 0.5),
    ], 1)
    render_editorial("editorial-03.webp", (1024, 1280), [
        ("puffer", "navy", 520, 260, 0.95), ("sneaker", "cream", 460, 1180, 0.65),
    ], 3)


if __name__ == "__main__":
    main()
