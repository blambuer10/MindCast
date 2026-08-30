from PIL import Image, ImageDraw, ImageFont
import shutil

AVATAR_SRC = "/Users/bl10buer/.gemini/antigravity-ide/brain/1810b937-8dbf-40f1-bb66-5c99ba04a3ad/mindcast_x_avatar_1788123537417.jpg"
BANNER_SRC = "/Users/bl10buer/.gemini/antigravity-ide/brain/1810b937-8dbf-40f1-bb66-5c99ba04a3ad/mindcast_x_banner_bg_1788123569200.jpg"

# -------------------------------------------------------------
# 1. PROCESS AVATAR (PROFILE PICTURE) - 1080x1080
# -------------------------------------------------------------
avatar_img = Image.open(AVATAR_SRC)
avatar_1080 = avatar_img.resize((1080, 1080), Image.Resampling.LANCZOS)

out_avatar_mc = "/Users/bl10buer/Desktop/MindCast/twitter_avatar_1080x1080.png"
out_avatar_dt = "/Users/bl10buer/Desktop/twitter_avatar_1080x1080.png"

avatar_1080.save(out_avatar_mc)
avatar_1080.save(out_avatar_dt)
print(f"Saved Avatar: {out_avatar_mc}")

# -------------------------------------------------------------
# 2. PROCESS HEADER BANNER - 1500x500 (Official Twitter Dimension)
# -------------------------------------------------------------
banner_bg = Image.open(BANNER_SRC)
# Resize to 1500 width keeping proportional height, then crop central 500px
target_w = 1500
target_h = 500

# Original is 1920x1080 -> scale so width is 1500 (height becomes 843)
scaled_h = int(1080 * (target_w / 1920.0))
resized_bg = banner_bg.resize((target_w, scaled_h), Image.Resampling.LANCZOS)

# Center crop vertically to exactly 500px height
top = (scaled_h - target_h) // 2
banner_1500 = resized_bg.crop((0, top, target_w, top + target_h)).convert("RGBA")

# Dark gradient vignette on right half for text legibility
overlay = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
ov_draw = ImageDraw.Draw(overlay)

for x in range(650, target_w):
    factor = ((x - 650) / (target_w - 650.0))
    alpha = int(140 * (factor ** 1.3))
    ov_draw.line([(x, 0), (x, target_h)], fill=(4, 7, 12, alpha))

banner_final = Image.alpha_composite(banner_1500, overlay).convert("RGB")
draw = ImageDraw.Draw(banner_final)

FONT_BOLD = "/System/Library/Fonts/Supplemental/DIN Alternate Bold.ttf"
FONT_REG = "/System/Library/Fonts/Supplemental/Arial.ttf"

font_tag = ImageFont.truetype(FONT_BOLD, 18)
font_brand = ImageFont.truetype(FONT_BOLD, 82)
font_slogan = ImageFont.truetype(FONT_BOLD, 30)
font_sub = ImageFont.truetype(FONT_REG, 24)
font_meta = ImageFont.truetype(FONT_BOLD, 22)

# Text anchor on the right side
tx = 750

# 1. Subtle pill badge
badge_w = 340
badge_box = [tx, 75, tx + badge_w, 112]
draw.rounded_rectangle(badge_box, radius=18, fill=(10, 20, 32), outline=(56, 189, 248), width=1)
draw.text((tx + 18, 83), "THE LIVING INTELLECTUAL NOOSPHERE", font=font_tag, fill=(56, 189, 248))

# 2. Main Brand: MINDCAST
draw.text((tx, 130), "MINDCAST", font=font_brand, fill=(255, 255, 255))

# 3. Slogan & Philosophy
draw.text((tx + 2, 230), "Ideas, alive.", font=font_slogan, fill=(74, 222, 128))
draw.text((tx + 2, 275), "Where human ideas become autonomous minds.", font=font_sub, fill=(148, 163, 184))

# 4. Divider line
draw.line([(tx, 330), (tx + 660, 330)], fill=(35, 48, 68), width=1)

# 5. Website & Meta
draw.text((tx, 355), "mindcast.fun", font=font_meta, fill=(241, 245, 249))
draw.text((tx + 175, 355), "•", font=font_meta, fill=(74, 222, 128))
draw.text((tx + 205, 355), "Autonomous 5-Round Debates", font=font_meta, fill=(148, 163, 184))
draw.text((tx + 540, 355), "•", font=font_meta, fill=(74, 222, 128))
draw.text((tx + 565, 355), "Base", font=font_meta, fill=(56, 189, 248))

out_banner_mc = "/Users/bl10buer/Desktop/MindCast/twitter_header_1500x500.png"
out_banner_dt = "/Users/bl10buer/Desktop/twitter_header_1500x500.png"

banner_final.save(out_banner_mc, quality=95)
banner_final.save(out_banner_dt, quality=95)

# Also copy to public directory
shutil.copyfile(out_avatar_mc, "/Users/bl10buer/Desktop/MindCast/mindcast-app/public/twitter_avatar_1080x1080.png")
shutil.copyfile(out_banner_mc, "/Users/bl10buer/Desktop/MindCast/mindcast-app/public/twitter_header_1500x500.png")

print(f"Refined Header Banner: {out_banner_mc}")
