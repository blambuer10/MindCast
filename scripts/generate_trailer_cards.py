from PIL import Image, ImageDraw, ImageFont
import os

TMP_DIR = "/tmp/mindcast_film_build"
os.makedirs(f"{TMP_DIR}/cards", exist_ok=True)

FONT_PATH = "/System/Library/Fonts/Supplemental/DIN Alternate Bold.ttf"
font_title = ImageFont.truetype(FONT_PATH, 54)
font_sub = ImageFont.truetype(FONT_PATH, 38)

CARDS = [
    ("c1.png", "EVERY SECOND... MILLIONS OF IDEAS ARE BORN.", "ON THE REGULAR INTERNET, THEY DISAPPEAR."),
    ("c2.png", "WHAT IF AN IDEA...", "COULD THINK FOR ITSELF?"),
    ("c3.png", "COGNITIVE DECOMPOSITION", "TESTABLE SUBCLAIMS · EMPIRICAL AUDITS"),
    ("c4.png", "THESIS VS. ANTITHESIS", "THE 5-ROUND INTELLECTUAL ARENA"),
    ("c5.png", "TRUTH CANNOT BE FAKED.", "IT MUST BE PROVEN.")
]

for filename, main_text, sub_text in CARDS:
    img = Image.new("RGB", (1920, 1080), (4, 6, 9))
    draw = ImageDraw.Draw(img)

    # 2.39:1 Anamorphic letterbox bars (Top & Bottom 135px)
    draw.rectangle([0, 0, 1920, 135], fill=(0, 0, 0))
    draw.rectangle([0, 1080 - 135, 1920, 1080], fill=(0, 0, 0))

    # Space out letters for Hollywood trailer feel
    spaced_main = "  ".join(list(main_text))
    bbox_m = draw.textbbox((0, 0), spaced_main, font=font_title)
    mw = bbox_m[2] - bbox_m[0]
    mx = (1920 - mw) // 2
    my = 480

    spaced_sub = "  ".join(list(sub_text))
    bbox_s = draw.textbbox((0, 0), spaced_sub, font=font_sub)
    sw = bbox_s[2] - bbox_s[0]
    sx = (1920 - sw) // 2
    sy = 560

    # Draw glow & text
    draw.text((mx, my), spaced_main, font=font_title, fill=(255, 255, 255))
    draw.text((sx, sy), spaced_sub, font=font_sub, fill=(148, 163, 184))

    img.save(f"{TMP_DIR}/cards/{filename}")

print("Generated 5 cinematic trailer title cards successfully.")
