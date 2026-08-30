import os
from PIL import Image, ImageDraw, ImageFont

TMP_DIR = "/tmp/mindcast_film_build"
os.makedirs(f"{TMP_DIR}/typing_frames", exist_ok=True)

FONT_PATH = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_MONO = "/System/Library/Fonts/Supplemental/Courier New Bold.ttf"
FONT_REG = "/System/Library/Fonts/Supplemental/Arial.ttf"

font_title = ImageFont.truetype(FONT_PATH, 42)
font_url = ImageFont.truetype(FONT_REG, 24)
font_label = ImageFont.truetype(FONT_PATH, 26)
font_text = ImageFont.truetype(FONT_MONO, 36)
font_btn = ImageFont.truetype(FONT_PATH, 28)

full_text = "Autonomous AI agents will manage global supply chains."

# 5 seconds at 30 fps = 150 frames
fps = 30
duration = 5.0
total_frames = int(fps * duration)

for frame_idx in range(total_frames):
    t = frame_idx / fps
    # Base background: deep dark carbon
    img = Image.new("RGB", (1920, 1080), (8, 10, 15))
    draw = ImageDraw.Draw(img)
    
    # 1. Browser Window Frame
    win_x0, win_y0, win_x1, win_y1 = 160, 100, 1760, 980
    draw.rounded_rectangle([win_x0, win_y0, win_x1, win_y1], radius=16, fill=(15, 18, 25), outline=(35, 42, 58), width=2)
    
    # Browser Header bar
    draw.rectangle([win_x0, win_y0, win_x1, win_y0 + 60], fill=(22, 27, 38))
    # Window traffic lights
    draw.ellipse([win_x0 + 25, win_y0 + 22, win_x0 + 41, win_y0 + 38], fill=(239, 68, 68))
    draw.ellipse([win_x0 + 55, win_y0 + 22, win_x0 + 71, win_y0 + 38], fill=(234, 179, 8))
    draw.ellipse([win_x0 + 85, win_y0 + 22, win_x0 + 101, win_y0 + 38], fill=(34, 197, 94))
    
    # URL pill bar
    url_box = [win_x0 + 400, win_y0 + 12, win_x1 - 400, win_y0 + 48]
    draw.rounded_rectangle(url_box, radius=8, fill=(10, 13, 20), outline=(45, 55, 75), width=1)
    draw.text((win_x0 + 430, win_y0 + 17), "🔒  mindcast.fun", font=font_url, fill=(148, 163, 184))
    
    # 2. MINDCAST Logo in browser
    draw.text((win_x0 + 80, win_y0 + 110), "MINDCAST", font=font_title, fill=(255, 255, 255))
    draw.text((win_x0 + 310, win_y0 + 122), "·  Ideas, alive.", font=font_url, fill=(74, 222, 128))
    
    # Tagline
    draw.text((win_x0 + 80, win_y0 + 200), "GIVE YOUR IDEA AN AUTONOMOUS MIND", font=font_label, fill=(148, 163, 184))
    draw.text((win_x0 + 80, win_y0 + 250), "Cast a thesis into the living Noosphere:", font=font_title, fill=(241, 245, 249))
    
    # 3. Textarea Input Field
    input_box = [win_x0 + 80, win_y0 + 330, win_x1 - 80, win_y0 + 580]
    draw.rounded_rectangle(input_box, radius=12, fill=(10, 13, 20), outline=(74, 222, 128) if t > 0.8 else (45, 55, 75), width=2)
    
    # Typewriter calculation
    # Type text between t=0.5s and t=3.8s
    if t < 0.5:
        char_count = 0
    else:
        progress = min(1.0, (t - 0.5) / 3.3)
        char_count = int(progress * len(full_text))
    
    typed_str = full_text[:char_count]
    cursor = " |" if (int(t * 4) % 2 == 0) else ""
    draw.text((win_x0 + 120, win_y0 + 370), typed_str + cursor, font=font_text, fill=(56, 189, 248))
    
    # Character count
    draw.text((win_x1 - 220, win_y0 + 530), f"{char_count} / 280", font=font_url, fill=(100, 116, 139))
    
    # 4. Action Button: [CAST THESIS · 1 USDC]
    btn_active = t > 3.8
    btn_box = [win_x0 + 80, win_y0 + 630, win_x0 + 460, win_y0 + 710]
    btn_color = (74, 222, 128) if btn_active else (30, 41, 59)
    btn_text_color = (10, 15, 20) if btn_active else (100, 116, 139)
    draw.rounded_rectangle(btn_box, radius=10, fill=btn_color)
    draw.text((win_x0 + 115, win_y0 + 652), "⚡ CAST THESIS  (1 USDC)", font=font_btn, fill=btn_text_color)
    
    # Save frame
    img.save(f"{TMP_DIR}/typing_frames/frame_{frame_idx:04d}.png")

print(f"Generated {total_frames} animated typing frames successfully.")
