from PIL import Image, ImageDraw, ImageFont

TMP_DIR = "/tmp/mindcast_film_build"
FONT_BOLD = "/System/Library/Fonts/Supplemental/DIN Alternate Bold.ttf"

font_huge = ImageFont.truetype(FONT_BOLD, 108)

img = Image.new("RGB", (1920, 1080), (6, 8, 12))
draw = ImageDraw.Draw(img)

# Pure, minimal, monolithic COMING SOON
text = "COMING SOON"
# Calculate centered position using textbbox
bbox = draw.textbbox((0, 0), text, font=font_huge)
text_w = bbox[2] - bbox[0]
text_h = bbox[3] - bbox[1]

x = (1920 - text_w) // 2
y = (1080 - text_h) // 2

# Subtle glow layer behind
for offset in range(4, 0, -1):
    draw.text((x - offset, y), text, font=font_huge, fill=(15, 25, 35))
    draw.text((x + offset, y), text, font=font_huge, fill=(15, 25, 35))
    draw.text((x, y - offset), text, font=font_huge, fill=(15, 25, 35))
    draw.text((x, y + offset), text, font=font_huge, fill=(15, 25, 35))

# Crisp Pure White
draw.text((x, y), text, font=font_huge, fill=(255, 255, 255))

img.save(f"{TMP_DIR}/coming_soon_clean.png")
print(f"Generated ultra-clean COMING SOON card: {TMP_DIR}/coming_soon_clean.png")
