#!/usr/bin/env python3
"""Генерує редаговані SVG-джерела (01_source). Детермінований (seed фіксований)."""
import random, math, os, json
from PIL import ImageFont
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC = os.path.join(ROOT, "01_source")
FONT = "'DejaVu Sans', Verdana, sans-serif"
BOLD = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 100)

def fit_font(text, target_w):
    return target_w / BOLD.getlength(text) * 100

def star(cx, cy, r, rot=-90, inner=0.42):
    pts = []
    for i in range(10):
        a = math.radians(rot + i * 36)
        rr = r if i % 2 == 0 else r * inner
        pts.append(f"{cx + rr*math.cos(a):.1f},{cy + rr*math.sin(a):.1f}")
    return " ".join(pts)

def write(path, s):
    with open(path, "w", encoding="utf-8") as f:
        f.write(s)

# ---------------------------------------------------------------- LOGO
TICKET = "M8 0H56a8 8 0 0 1 8 8V13a7 7 0 0 0 0 14V32a8 8 0 0 1-8 8H8a8 8 0 0 1-8-8V27a7 7 0 0 0 0-14V8A8 8 0 0 1 8 0Z"
PLAY = "M26 10.5 26 29.5 43 20Z"
def logo(body, play, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 40" width="64" height="40" role="img">'
            f'<title>{title}</title><path d="{TICKET}" fill="{body}"/><path d="{PLAY}" fill="{play}"/></svg>')
write(f"{SRC}/logo-master-light.svg", logo("#1c1233", "#f2a93b", "Кінопульс"))
write(f"{SRC}/logo-master-dark.svg", logo("#faf6f0", "#f2a93b", "Кінопульс"))

# ---------------------------------------------------------------- ICONS (viewBox 24, currentColor)
ICONS = {
 "action":  '<path d="M13.5 1.5 4 13.4h6.2l-1.4 9.1 10.7-13h-6.6z"/>',
 "comedy":  '<path fill-rule="evenodd" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM8.6 8.2a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2zm6.8 0a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2zM7 14h10a5 5 0 0 1-10 0z"/>',
 "drama":   '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>',
 "horror":  '<path fill-rule="evenodd" d="M12 2a8 8 0 0 0-8 8v12l2.67-2.4L9.33 22 12 19.6 14.67 22l2.66-2.4L20 22V10a8 8 0 0 0-8-8zM9.5 9.4a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4zm5 0a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4z"/>',
 "thriller":'<path fill-rule="evenodd" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM8.6 8a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm6.8 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM12 13.2c2.1 0 3.4 1.2 3.4 2.7s-1.3 2.7-3.4 2.7-3.4-1.2-3.4-2.7 1.3-2.7 3.4-2.7z"/>',
 "crime":   '<path fill-rule="evenodd" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM6.5 7.6l4-1.5.5 1.4-4 1.5zM17.5 7.6l-4-1.5-.5 1.4 4 1.5zM8.8 9.3a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6zm6.4 0a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6zM8.5 15.2h7v1.6h-7z"/>',
}
NAMES = {"action":"Бойовик","comedy":"Комедія","drama":"Драма","horror":"Жахи","thriller":"Трилер","crime":"Кримінал"}
for k, p in ICONS.items():
    src = (f'<!-- genre-{k}: {NAMES[k]}. Правила: viewBox 24x24, fill=currentColor, без stroke, evenodd для отворів -->\n'
           f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true" focusable="false">\n  {p}\n</svg>\n')
    write(f"{SRC}/icons/genre-{k}.svg", src)

# ---------------------------------------------------------------- PATTERN tile
write(f"{SRC}/header-pattern-master.svg",
 '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">'
 '<g fill="none" stroke="#ffffff" stroke-opacity=".07" stroke-width="1.5"><path d="M-8 104 104-8"/><path d="M40 104 104 40"/><path d="M-8 56 56-8"/></g>'
 '<g fill="#f2a93b" fill-opacity=".35"><circle cx="24" cy="72" r="3"/><circle cx="48" cy="48" r="3"/><circle cx="72" cy="24" r="3"/></g></svg>')

# ---------------------------------------------------------------- POSTERS
def rng_dots(seed, n, w, h_art, rmin, rmax):
    r = random.Random(seed); out = []
    for _ in range(n):
        out.append((r.uniform(0, w), r.uniform(0, h_art), r.uniform(rmin, rmax), r.uniform(.18, .5)))
    return out

def poster(kind, w, h, title, sub, title_frac, panel_col, panel_op, title_col, sub_col):
    s = w / 1000.0
    art_h = 0.78 * h
    fs = fit_font(title, title_frac * w)
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" font-family="{FONT}">']
    if kind == "drama":
        o.append('<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1740"/><stop offset=".55" stop-color="#24506a"/><stop offset="1" stop-color="#2a9d8f"/></linearGradient></defs>')
        o.append(f'<rect width="{w}" height="{h}" fill="url(#g)"/>')
        o.append(f'<circle cx="{w*.5:.0f}" cy="{h*.27:.0f}" r="{w*.17:.0f}" fill="#e8e6e1"/>')
        for i in range(5):
            y = h * (0.665 + i * 0.02)
            o.append(f'<path d="M0 {y:.0f} {w} {y-8*s:.0f}" stroke="#fff" stroke-opacity=".22" stroke-width="{1.6*s:.1f}"/>')
    elif kind == "action":
        o.append('<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a1220"/><stop offset=".6" stop-color="#8a2f3e"/><stop offset="1" stop-color="#d9505a"/></linearGradient></defs>')
        o.append(f'<rect width="{w}" height="{h}" fill="url(#g)"/>')
        bx, by, bw, bh = 0.28 * w, 0.07 * h, 0.44 * w, 0.46 * h
        pts = [(.62,0),(.12,.58),(.42,.58),(.28,1),(.9,.36),(.58,.36),(.78,0)]
        o.append('<polygon fill="#f2c79b" points="' + " ".join(f"{bx+x*bw:.0f},{by+y*bh:.0f}" for x, y in pts) + '"/>')
        for tri in [((.40,.735),(.55,.60),(.60,.735)),((.62,.735),(.68,.63),(.80,.735)),((.12,.60),(.55,.735),(.30,.735))]:
            o.append('<polygon fill="#f2c79b" fill-opacity=".92" points="' + " ".join(f"{x*w:.0f},{y*h:.0f}" for x, y in tri) + '"/>')
    else:  # comedy
        o.append('<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4d3410"/><stop offset="1" stop-color="#c98a2e"/></linearGradient></defs>')
        o.append(f'<rect width="{w}" height="{h}" fill="url(#g)"/>')
        for x, y, r, op in rng_dots(11, 46, w, art_h, 3 * s, 15 * s):
            o.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r:.1f}" fill="#2b1d0a" fill-opacity="{op:.2f}"/>')
    o.append(f'<rect y="{art_h:.0f}" width="{w}" height="{h-art_h:.0f}" fill="{panel_col}" fill-opacity="{panel_op}"/>')
    o.append(f'<text x="{w/2:.0f}" y="{h*.865:.0f}" text-anchor="middle" font-weight="700" font-size="{fs:.1f}" fill="{title_col}">{title}</text>')
    o.append(f'<text x="{w/2:.0f}" y="{h*.915:.0f}" text-anchor="middle" font-size="{fs*.32:.1f}" fill="{sub_col}" letter-spacing="{2*s:.1f}">{sub}</text>')
    o.append('</svg>')
    return "\n".join(o)

posters = {
 # id: (kind, w, h, title, sub, title_frac, panel_col, panel_op, title_col, sub_col)
 "misyachna-havan":  ("drama", 1000, 1500, "МІСЯЧНА ГАВАНЬ", "ДРАМА • КІНОПУЛЬС", .72, "#1b4f56", .92, "#ffffff", "#cfe3e1"),
 "zaliznyi-horyzont":("action", 1000, 1333, "ЗАЛІЗНИЙ ГОРИЗОНТ", "БОЙОВИК • КІНОПУЛЬС", .94, "#4a1220", .75, "#f7d3a8", "#f0c9a6"),
 "smikh-u-provulku": ("comedy", 1000, 1481, "СМІХ У ПРОВУЛКУ", "КОМЕДІЯ • КІНОПУЛЬС", .78, "#f3d9a4", .95, "#1a1240", "#5a4320"),
}
for pid, spec in posters.items():
    write(f"{SRC}/poster-{pid}.svg", poster(spec[0], *spec[1:]))

# safe-zone метадані (частки ширини/висоти) — заповнюються куратором при прийманні постера
meta = {
 "misyachna-havan":   {"title":"МІСЯЧНА ГАВАНЬ",   "text_bbox":[0.14,0.815,0.86,0.93], "alt":"Постер фільму «Місячна гавань»: місяць над нічною водою"},
 "zaliznyi-horyzont": {"title":"ЗАЛІЗНИЙ ГОРИЗОНТ","text_bbox":[0.03,0.815,0.97,0.93], "alt":"Постер фільму «Залізний горизонт»: блискавка над уламками"},
 "smikh-u-provulku":  {"title":"СМІХ У ПРОВУЛКУ",  "text_bbox":[0.11,0.815,0.89,0.93], "alt":"Постер фільму «Сміх у провулку»: бурштинове тло з плямами"},
}
write(f"{SRC}/posters-meta.json", json.dumps(meta, ensure_ascii=False, indent=2))

# ---------------------------------------------------------------- HERO
def hero(W, H, screen, seats, ticket, extra_stars, seed, spos=(.905,.14)):
    r = random.Random(seed)
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
         '<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#110c23"/><stop offset=".7" stop-color="#181230"/><stop offset="1" stop-color="#1e1638"/></linearGradient>'
         f'<radialGradient id="glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#6b4a2c" stop-opacity=".55"/><stop offset="1" stop-color="#6b4a2c" stop-opacity="0"/></radialGradient></defs>',
         f'<rect width="{W}" height="{H}" fill="url(#bg)"/>',
         f'<ellipse cx="{W/2:.0f}" cy="{screen[1]+screen[3]/2:.0f}" rx="{W*.55:.0f}" ry="{H*.62:.0f}" fill="url(#glow)"/>']
    sx, sy, sw, sh = screen
    for _ in range(extra_stars):
        x, y = r.uniform(0.05*W, 0.95*W), r.uniform(0.04*H, 0.56*H)
        if sx-6 < x < sx+sw+6 and sy-6 < y < sy+sh+6: continue
        o.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r.uniform(.8,3):.1f}" fill="#fff" fill-opacity="{r.uniform(.15,.85):.2f}"/>')
    o.append(f'<rect x="{sx}" y="{sy}" width="{sw}" height="{sh}" rx="10" fill="#ebe7e2" stroke="#c98a4a" stroke-width="2"/>')
    tx, ty, ts, tr = ticket
    o.append(f'<g transform="translate({tx} {ty}) rotate({tr}) scale({ts})"><path d="{TICKET}" fill="#f2a93b"/></g>')
    o.append(f'<polygon fill="#ffffff" points="{star(W*spos[0], H*spos[1], W*.014)}"/>')
    o.append(f'<polygon fill="#f2a93b" points="{star(W*.066, H*.44, W*.0085)}"/>')
    (n1, x1, w1, g1, y1, h1), (n2, x2, w2, g2, y2, h2) = seats
    for i in range(n1): o.append(f'<rect x="{x1+i*(w1+g1)}" y="{y1}" width="{w1}" height="{h1}" rx="12" fill="#130e26"/>')
    for i in range(n2): o.append(f'<rect x="{x2+i*(w2+g2)}" y="{y2}" width="{w2}" height="{h2}" rx="12" fill="#0d0919"/>')
    o.append('</svg>')
    return "\n".join(o)

write(f"{SRC}/hero-desktop-master.svg", hero(1600, 900, (431, 89, 738, 272), ((9,204,120,14,648,144),(9,182,125,14,802,140)), (92, 62, 1.5, -12), 46, 5))
write(f"{SRC}/hero-mobile-master.svg",  hero(720, 900, (40, 120, 640, 250), ((4,42,150,20,640,180),(4,20,156,20,840,120)), (46, 44, 1.1, -12), 36, 6, (.88,.06)))

# ---------------------------------------------------------------- BACKDROP (16:9, без тексту; ліва частина порожня під HTML-заголовок)
W, H = 1600, 900
o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
 '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a1220"/><stop offset=".62" stop-color="#8a2f3e"/><stop offset="1" stop-color="#d9505a"/></linearGradient>'
 '<linearGradient id="l" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1c0b14" stop-opacity=".92"/><stop offset=".45" stop-color="#1c0b14" stop-opacity=".5"/><stop offset=".62" stop-color="#1c0b14" stop-opacity="0"/></linearGradient></defs>',
 f'<rect width="{W}" height="{H}" fill="url(#g)"/>']
bx, by, bw, bh = 1000, 70, 420, 520
pts = [(.62,0),(.12,.58),(.42,.58),(.28,1),(.9,.36),(.58,.36),(.78,0)]
o.append('<polygon fill="#f2c79b" points="' + " ".join(f"{bx+x*bw:.0f},{by+y*bh:.0f}" for x, y in pts) + '"/>')
for tri in [((900,700),(1080,560),(1140,700)),((1180,700),(1260,600),(1400,700)),((760,610),(1120,700),(900,700))]:
    o.append('<polygon fill="#f2c79b" fill-opacity=".9" points="' + " ".join(f"{x},{y}" for x, y in tri) + '"/>')
o.append(f'<rect y="700" width="{W}" height="200" fill="#4a1220" fill-opacity=".55"/>')
o.append(f'<rect width="{W}" height="{H}" fill="url(#l)"/></svg>')
write(f"{SRC}/backdrop-zaliznyi-horyzont.svg", "\n".join(o))

# ---------------------------------------------------------------- PLACEHOLDER glyph
write(f"{SRC}/placeholder-glyph.svg", '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M3 4h18v16H3zM7.5 6.8a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4zM5 18h14l-4.6-6-3.4 4.2L9 13.6z"/></svg>')
print("sources ok:", sorted(os.listdir(SRC)))
