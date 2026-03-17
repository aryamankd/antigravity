"""
Generates an architecture diagram for the Antigravity (Watch Patrol HQ) project.
"""

import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch

fig, ax = plt.subplots(1, 1, figsize=(15, 7))
ax.set_xlim(0, 15)
ax.set_ylim(0, 7)
ax.axis("off")
fig.patch.set_facecolor("#0d1117")

# ── Colors ────────────────────────────────────────────────────────────────────
BG_DARK = "#161b22"
BORDER  = "#30363d"
GREEN   = "#3fb950"
BLUE    = "#58a6ff"
PURPLE  = "#bc8cff"
ORANGE  = "#f0883e"
GOLD    = "#d4a843"
WHITE   = "#e6edf3"
GRAY    = "#8b949e"

def draw_box(x, y, w, h, label, sublabel=None, color=BLUE, fontsize=10):
    box = FancyBboxPatch(
        (x, y), w, h,
        boxstyle="round,pad=0.15",
        facecolor=BG_DARK,
        edgecolor=color,
        linewidth=1.5,
    )
    ax.add_patch(box)
    if sublabel:
        ax.text(x + w / 2, y + h / 2 + 0.18, label, ha="center", va="center",
                fontsize=fontsize, fontweight="bold", color=WHITE, family="monospace")
        ax.text(x + w / 2, y + h / 2 - 0.2, sublabel, ha="center", va="center",
                fontsize=7.5, color=GRAY, family="monospace")
    else:
        ax.text(x + w / 2, y + h / 2, label, ha="center", va="center",
                fontsize=fontsize, fontweight="bold", color=WHITE, family="monospace")

def draw_arrow(x1, y1, x2, y2, color=GRAY):
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle="-|>", color=color, lw=1.5))

# ── Title ─────────────────────────────────────────────────────────────────────
ax.text(7.5, 6.6, "Watch Patrol HQ — Architecture", ha="center", va="center",
        fontsize=16, fontweight="bold", color=WHITE, family="monospace")
ax.text(7.5, 6.25, "8 RSS Feeds  ·  Unsplash API  ·  Static Site Generator",
        ha="center", va="center", fontsize=9, color=GRAY, family="monospace")

# ── Column 1: Data Sources ────────────────────────────────────────────────────
ax.text(1.8, 5.7, "DATA SOURCES", ha="center", va="center",
        fontsize=8, fontweight="bold", color=ORANGE, family="monospace")

rss_feeds = [
    "Hodinkee", "Fratello", "Monochrome", "SJX",
    "Revolution", "Worn & Wound", "Time+Tide", "aBlogtoWatch",
]
y_rss = 5.1
for i, feed in enumerate(rss_feeds):
    row, col = divmod(i, 4)
    fx = 0.2 + col * 0.85
    fy = y_rss - row * 0.65
    draw_box(fx, fy, 0.8, 0.52, feed, color=GREEN, fontsize=7)

draw_box(0.2, 2.0, 3.2, 0.7, "Unsplash API", "fetch-dict-images.js\nWatch term → image URL", color=BLUE)

# ── Column 2: Scripts ─────────────────────────────────────────────────────────
ax.text(6.2, 5.7, "SCRIPTS", ha="center", va="center",
        fontsize=8, fontweight="bold", color=ORANGE, family="monospace")

draw_box(4.7, 4.5, 3.0, 1.0, "fetch-news.js", "Parse RSS feeds\nDetect brand (Rolex, AP, etc.)\nExtract image + category\nDedup by URL → top 40", color=GREEN, fontsize=9)

draw_box(4.7, 2.7, 3.0, 1.0, "fetch-dict-images.js", "Load dictionary.json\nQuery Unsplash per term\nRate-limit: 45/hr\nWrite image URLs back", color=BLUE, fontsize=9)

draw_box(4.7, 1.3, 3.0, 1.0, "build.js", "Read template.html\nInject news cards HTML\nInject dictionary terms\nWrite → index.html", color=PURPLE, fontsize=9)

# Arrows: RSS → fetch-news.js
for i in range(8):
    row, col = divmod(i, 4)
    fx = 0.2 + col * 0.85 + 0.8
    fy = y_rss - row * 0.65 + 0.26
    draw_arrow(fx, fy, 4.7, 5.05 - (0.15 if i > 3 else 0), color=GREEN)

# Unsplash → fetch-dict-images.js
draw_arrow(3.4, 2.35, 4.7, 3.05, color=BLUE)

# ── Column 3: Data Files ──────────────────────────────────────────────────────
ax.text(10.3, 5.7, "DATA", ha="center", va="center",
        fontsize=8, fontweight="bold", color=ORANGE, family="monospace")

draw_box(8.5, 4.3, 3.6, 1.1, "data/news.json", "40 articles · sorted newest first\nFields: title, link, source,\ndate, image, category, brand", color=GREEN, fontsize=9)

draw_box(8.5, 2.7, 3.6, 1.1, "data/dictionary.json", "Watch glossary A–Z\nFields: term, letter,\ndefinition, image URL", color=BLUE, fontsize=9)

# fetch-news → news.json
draw_arrow(7.7, 5.0, 8.5, 4.9, color=GREEN)
# fetch-dict → dictionary.json
draw_arrow(7.7, 3.2, 8.5, 3.25, color=BLUE)

# ── Column 4: Build & Site ────────────────────────────────────────────────────
ax.text(13.3, 5.7, "OUTPUT", ha="center", va="center",
        fontsize=8, fontweight="bold", color=ORANGE, family="monospace")

draw_box(12.0, 4.2, 2.8, 0.9, "template.html", "Section shells\nNav, hero, JS logic\nTailwind CSS", color=GRAY, fontsize=9)

draw_box(12.0, 2.7, 2.8, 1.1, "index.html", "Watch Patrol HQ\nNews feed · Dictionary\nBrand filters · Dark UI", color=GOLD, fontsize=9)

# news.json + dictionary → build.js
draw_arrow(12.1, 4.85, 7.7, 1.8, color=GREEN)
draw_arrow(12.1, 3.25, 7.7, 1.7, color=BLUE)

# template → build.js
draw_arrow(12.0, 4.65, 8.0, 1.75, color=GRAY)

# build.js → index.html
draw_arrow(7.7, 1.8, 12.0, 3.3, color=PURPLE)

# ── Footer ────────────────────────────────────────────────────────────────────
stats = "Node.js  ·  rss-parser  ·  Puppeteer  ·  Tailwind CSS  ·  GitHub Pages"
ax.text(7.5, 0.4, stats, ha="center", va="center",
        fontsize=9, color=GRAY, family="monospace",
        bbox=dict(boxstyle="round,pad=0.4", facecolor=BG_DARK, edgecolor=BORDER, linewidth=1))

plt.tight_layout(pad=0.5)
plt.savefig("/tmp/readme-gen/architecture_antigravity.png", dpi=200, facecolor=fig.get_facecolor())
plt.close()
print("Saved → /tmp/readme-gen/architecture_antigravity.png")
