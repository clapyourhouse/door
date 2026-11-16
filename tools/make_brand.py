# Generates Door Travel brand images (original artwork: a doorway with light, no third-party imagery).
# Run: python3 tools/make_brand.py   -> writes app/www/og.png, icon-192.png, apple-touch-icon.png, favicon.png, logo.svg
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os
OUT = os.path.join(os.path.dirname(__file__), '..', 'app', 'www')
BG = (10, 10, 15); ACC = (227, 240, 154); LIGHT_TOP = (255, 214, 140); LIGHT_BOT = (255, 120, 90)
F = '/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf'
FR = '/usr/share/fonts/truetype/google-fonts/Poppins-Regular.ttf'

def door(size, bg=BG, radius=0.0):
    """Square image: doorway (arched frame) with warm light inside."""
    S = size * 4
    im = Image.new('RGBA', (S, S), bg if bg else (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    w, h = S * 0.42, S * 0.66
    x0, y0 = (S - w) / 2, S * 0.17
    x1, y1 = x0 + w, y0 + h
    arc = w / 2
    # light inside the door: vertical gradient clipped to the arch shape
    mask = Image.new('L', (S, S), 0)
    md = ImageDraw.Draw(mask)
    t = S * 0.045  # frame thickness
    ix0, ix1, iy0, iy1 = x0 + t, x1 - t, y0 + t, y1
    md.rectangle([ix0, iy0 + (ix1 - ix0) / 2 - 6, ix1, iy1], fill=255)
    md.pieslice([ix0, iy0, ix1, iy0 + (ix1 - ix0)], 180, 360, fill=255)
    grad = Image.new('RGB', (S, S))
    gd = ImageDraw.Draw(grad)
    for y in range(S):
        k = min(max((y - y0) / h, 0), 1)
        gd.line([(0, y), (S, y)], fill=tuple(int(LIGHT_TOP[i] * (1 - k) + LIGHT_BOT[i] * k) for i in range(3)))
    im.paste(grad, (0, 0), mask)
    # frame
    d.rounded_rectangle([x0, y0 + arc, x1, y1], radius=0, outline=ACC, width=int(t))
    d.pieslice([x0, y0, x1, y0 + w], 180, 360, outline=ACC, width=int(t))
    # cover the seam between arch and rect (redraw side walls)
    d.rectangle([x0, y0 + arc, x0 + t, y1], fill=ACC)
    d.rectangle([x1 - t, y0 + arc, x1, y1], fill=ACC)
    # a slightly open door leaf (darker panel on the left) with handle
    leaf = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    ld = ImageDraw.Draw(leaf)
    lw = (ix1 - ix0) * 0.34
    ld.polygon([(ix0, iy0 + (ix1 - ix0) / 2), (ix0 + lw, iy0 + (ix1 - ix0) / 2 + S * 0.03), (ix0 + lw, iy1 - S * 0.03), (ix0, iy1)], fill=(10, 10, 15, 235))
    ld.ellipse([ix0 + lw - S * 0.055, (iy0 + iy1) / 2 + S * 0.03, ix0 + lw - S * 0.025, (iy0 + iy1) / 2 + S * 0.06], fill=ACC)
    im.paste(leaf, (0, 0), leaf)
    # ground line
    d.rectangle([S * 0.22, y1, S * 0.78, y1 + t * 0.6], fill=ACC)
    im = im.resize((size, size), Image.LANCZOS)
    return im if not bg else im.convert('RGB')

def save(im, name):
    im.save(os.path.join(OUT, name), optimize=True)

# icons
save(door(512).resize((192, 192), Image.LANCZOS), 'icon-192.png')
save(door(180), 'apple-touch-icon.png')
save(door(64).resize((32, 32), Image.LANCZOS), 'favicon.png')

# OG image 1200x630
W, H = 1200, 630
og = Image.new('RGB', (W, H), BG)
glow = Image.new('RGB', (W, H), BG)
gd = ImageDraw.Draw(glow)
gd.ellipse([-200, 60, 700, 760], fill=(70, 38, 30))
glow = glow.filter(ImageFilter.GaussianBlur(120))
og = Image.blend(og, glow, 0.9)
mark = door(500, bg=None)
og.paste(mark, (20, 60), mark)
d = ImageDraw.Draw(og)
d.text((560, 180), 'DOOR TRAVEL', font=ImageFont.truetype(F, 74), fill=ACC)
d.text((560, 290), 'Open a door.', font=ImageFont.truetype(F, 44), fill=(245, 245, 245))
d.text((560, 348), 'Land somewhere in Japan.', font=ImageFont.truetype(F, 44), fill=(245, 245, 245))
d.text((560, 460), 'Street View  ·  AI guide  ·  Directions', font=ImageFont.truetype(FR, 30), fill=(170, 170, 180))
save(og, 'og.png')

# logo.svg (vector mark)
svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-label="Door Travel">
<rect width="256" height="256" fill="#0a0a0f"/>
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd68c"/><stop offset="1" stop-color="#ff785a"/></linearGradient></defs>
<path d="M75 189V99a53 53 0 0 1 106 0v90z" fill="url(#g)" stroke="#e3f09a" stroke-width="11" stroke-linejoin="round"/>
<path d="M80 100 111 108V183L80 189z" fill="#0a0a0f" opacity=".92"/>
<circle cx="106" cy="148" r="4" fill="#e3f09a"/>
<rect x="56" y="189" width="144" height="7" fill="#e3f09a"/>
</svg>
'''
open(os.path.join(OUT, 'logo.svg'), 'w').write(svg)
print('ok')
