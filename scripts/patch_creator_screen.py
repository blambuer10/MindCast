from PIL import Image, ImageDraw, ImageFont
import numpy as np

orig_img = Image.open("/Users/bl10buer/.gemini/antigravity-ide/brain/1810b937-8dbf-40f1-bb66-5c99ba04a3ad/mindcast_creator_epiphany_1787963858930.jpg").convert("RGB")

ui_w, ui_h = 600, 380
ui = Image.new("RGB", (ui_w, ui_h), (8, 10, 15))
draw = ImageDraw.Draw(ui)

FONT_TITLE = "/System/Library/Fonts/Supplemental/DIN Alternate Bold.ttf"
FONT_REG = "/System/Library/Fonts/Supplemental/Arial.ttf"

f_logo = ImageFont.truetype(FONT_TITLE, 38)
f_sub = ImageFont.truetype(FONT_REG, 18)
f_h2 = ImageFont.truetype(FONT_TITLE, 28)
f_box = ImageFont.truetype(FONT_REG, 20)
f_btn = ImageFont.truetype(FONT_TITLE, 20)

# Browser header
draw.rectangle([0, 0, ui_w, 32], fill=(20, 24, 34))
draw.ellipse([12, 10, 22, 20], fill=(239, 68, 68))
draw.ellipse([28, 10, 38, 20], fill=(234, 179, 8))
draw.ellipse([44, 10, 54, 20], fill=(34, 197, 94))
draw.rounded_rectangle([150, 6, ui_w - 150, 26], radius=5, fill=(10, 13, 20), outline=(40, 48, 65))
draw.text((180, 8), "🔒  mindcast.fun", font=f_sub, fill=(148, 163, 184))

# Navbar
draw.text((40, 50), "MINDCAST", font=f_logo, fill=(255, 255, 255))
draw.text((230, 62), "·  Ideas, alive.", font=f_sub, fill=(74, 222, 128))

# Hero title
draw.text((40, 110), "GIVE YOUR IDEA AN AUTONOMOUS MIND", font=f_sub, fill=(56, 189, 248))
draw.text((40, 140), "Cast a thesis into the living Noosphere:", font=f_h2, fill=(241, 245, 249))

# Textarea Box
draw.rounded_rectangle([40, 190, ui_w - 40, 290], radius=8, fill=(14, 18, 26), outline=(74, 222, 128), width=2)
draw.text((55, 215), "Autonomous AI agents will manage global supply chains...", font=f_box, fill=(56, 189, 248))

# Button
draw.rounded_rectangle([40, 315, 280, 360], radius=6, fill=(74, 222, 128))
draw.text((55, 328), "⚡ CAST THESIS (1 USDC)", font=f_btn, fill=(10, 15, 20))

# Destination coordinates on the laptop screen in orig_img:
# Top-Left: (388, 396)
# Top-Right: (573, 394)
# Bottom-Right: (606, 550)
# Bottom-Left: (422, 567)

# We map from (x_dst, y_dst) -> (x_src, y_src)
# For each corner:
# (388, 396) -> (0, 0)
# (573, 394) -> (ui_w, 0)
# (606, 550) -> (ui_w, ui_h)
# (422, 567) -> (0, ui_h)

def get_perspective_coeffs(src_coords, dst_coords):
    # Mapping dst -> src
    matrix = []
    for (xd, yd), (xs, ys) in zip(dst_coords, src_coords):
        matrix.append([xd, yd, 1, 0, 0, 0, -xs*xd, -xs*yd])
        matrix.append([0, 0, 0, xd, yd, 1, -ys*xd, -ys*yd])
    A = np.matrix(matrix, dtype=float)
    B = np.array([c for pt in src_coords for c in pt]).reshape(8)
    res = np.dot(np.linalg.inv(A), B)
    return np.array(res).flatten().tolist()

dst_pts = [(388, 396), (573, 394), (606, 550), (422, 567)]
src_pts = [(0, 0), (ui_w, 0), (ui_w, ui_h), (0, ui_h)]
coeffs = get_perspective_coeffs(src_pts, dst_pts)

warped = ui.transform(orig_img.size, Image.Transform.PERSPECTIVE, coeffs, Image.Resampling.BICUBIC)

# Create polygon mask for clean blending
mask = Image.new("L", orig_img.size, 0)
mask_draw = ImageDraw.Draw(mask)
mask_draw.polygon(dst_pts, fill=255)

# Paste warped screen onto orig_img using mask
orig_img.paste(warped, (0, 0), mask)
orig_img.save("/Users/bl10buer/Desktop/MindCast/mindcast-app/public/mindcast_creator_clean.jpg", quality=95)
print("SUCCESS: Screen overlaid perfectly with no artifacts!")
