"""Draw the HAVYN FIELD app icon: three glass towers in the void."""
import sys
from PIL import Image, ImageDraw, ImageFilter

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(len(a)))

def master(size=1024, safe=1.0):
    S = size
    img = Image.new("RGBA", (S, S), (4, 5, 13, 255))
    px = img.load()
    top, bot = (16, 24, 66), (3, 4, 12)
    for y in range(S):
        c = lerp(top, bot, (y / S) ** 0.8)
        for x in range(S):
            px[x, y] = c + (255,)
    glow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    g = ImageDraw.Draw(glow)
    g.ellipse([S * .12, S * .52, S * .88, S * .86], fill=(92, 232, 255, 70))
    glow = glow.filter(ImageFilter.GaussianBlur(S * .07))
    img = Image.alpha_composite(img, glow)

    k = safe
    cx = S / 2
    ground = S * (0.5 + 0.27 * k)
    w, d = S * 0.17 * k, S * 0.08 * k
    towers = [(-0.27, 0.30), (0.0, 0.50), (0.27, 0.38)]
    lay = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    edges = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    L = ImageDraw.Draw(lay); Ed = ImageDraw.Draw(edges)
    for dx, h in towers:
        x = cx + dx * S * k
        hh = S * h * k
        top = ground - hh
        left = [(x - w / 2, ground), (x, ground + d / 2), (x, top + d / 2), (x - w / 2, top)]
        right = [(x, ground + d / 2), (x + w / 2, ground), (x + w / 2, top), (x, top + d / 2)]
        cap = [(x - w / 2, top), (x, top + d / 2), (x + w / 2, top), (x, top - d / 2)]
        L.polygon(left, fill=(92, 232, 255, 120))
        L.polygon(right, fill=(47, 180, 255, 80))
        L.polygon(cap, fill=(220, 252, 255, 210))
        for poly in (left, right, cap):
            Ed.line(poly + [poly[0]], fill=(200, 250, 255, 230), width=max(2, int(S * 0.004)))
        Ed.line([(x - w / 2 + S * .012, top + S * .02), (x - w / 2 + S * .012, ground - S * .02)], fill=(255, 255, 255, 150), width=max(2, int(S * .006)))
    bloom = edges.filter(ImageFilter.GaussianBlur(S * 0.012))
    img = Image.alpha_composite(img, lay)
    img = Image.alpha_composite(img, bloom)
    img = Image.alpha_composite(img, edges)
    return img.convert("RGB")

if __name__ == "__main__":
    out = sys.argv[1]
    m = master(1024, 1.0)
    for name, s in (("icon-512.png", 512), ("icon-192.png", 192), ("apple-touch-icon.png", 180)):
        m.resize((s, s), Image.LANCZOS).save(f"{out}/{name}", optimize=True)
    master(1024, 0.78).resize((512, 512), Image.LANCZOS).save(f"{out}/icon-maskable-512.png", optimize=True)
