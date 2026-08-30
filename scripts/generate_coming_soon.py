from PIL import Image, ImageDraw, ImageFont

TMP_DIR = "/tmp/mindcast_film_build"
FONT_BOLD = "/System/Library/Fonts/Supplemental/DIN Alternate Bold.ttf"
FONT_REG = "/System/Library/Fonts/Supplemental/Arial.ttf"

font_huge = ImageFont.truetype(FONT_BOLD, 92)
font_sub = ImageFont.truetype(FONT_REG, 34)
font_tag = ImageFont.truetype(FONT_BOLD, 28)

img = Image.new("RGB", (1920, 1080), (6, 8, 12))
draw = ImageDraw.Draw(img)

# Subtle background grid lines
for y in range(0, 1080, 80):
    draw.line([(0, y), (1920, y)], fill=(15, 18, 26), width=1)
for x in range(0, 1920, 80):
    draw.line([(x, 0), (x, 1080)], fill=(15, 18, 26), width=1)

# Subtle ambient light vignette
draw.ellipse([760, 340, 1160, 740], fill=(12, 28, 24), outline=(34, 197, 94, 40), width=1)

# Badge: 2026 ROADMAP
badge_box = [810, 310, 1110, 360]
draw.rounded_rectangle(badge_box, radius=25, fill=(15, 23, 42), outline=(56, 189, 248), width=1)
draw.text((850, 322), "⚡ LAUNCHING LIVE", font=font_tag, fill=(56, 189, 248))

# Main Title: COMING SOON
draw.text((630, 430), "COMING SOON", font=font_huge, fill=(255, 255, 255))

# Subtitle
draw.text((615, 570), "The First Living Intellectual Noosphere", font=font_sub, fill=(148, 163, 184))

# Bottom Tag
draw.text((790, 720), "mindcast.fun  ·  Base", font=font_tag, fill=(74, 222, 128))

img.save(f"{TMP_DIR}/coming_soon.png")
print("Generated coming_soon.png successfully.")
