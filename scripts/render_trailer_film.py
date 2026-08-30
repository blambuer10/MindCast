import os
import subprocess
import shutil

FFMPEG = "/Users/bl10buer/Desktop/MindCast/mindcast-app/node_modules/ffmpeg-static/ffmpeg"

TMP_DIR = "/tmp/mindcast_film_build"
os.makedirs(f"{TMP_DIR}/trailer_cuts", exist_ok=True)

# Assets
CARD_1 = f"{TMP_DIR}/cards/c1.png"
IMG_EYE = "/Users/bl10buer/.gemini/antigravity-ide/brain/1810b937-8dbf-40f1-bb66-5c99ba04a3ad/trailer_clash_eye_1787995317430.jpg"
CARD_2 = f"{TMP_DIR}/cards/c2.png"
IMG_CREATOR = "/Users/bl10buer/Desktop/MindCast/mindcast-app/public/mindcast_creator_clean.jpg"
IMG_KEYBOARD = "/Users/bl10buer/.gemini/antigravity-ide/brain/1810b937-8dbf-40f1-bb66-5c99ba04a3ad/trailer_typing_macro_1787995336653.jpg"
IMG_CORE = "/Users/bl10buer/.gemini/antigravity-ide/brain/1810b937-8dbf-40f1-bb66-5c99ba04a3ad/trailer_neural_core_1787995356681.jpg"
CARD_3 = f"{TMP_DIR}/cards/c3.png"
IMG_DECOMP = "/Users/bl10buer/.gemini/antigravity-ide/brain/1810b937-8dbf-40f1-bb66-5c99ba04a3ad/mindcast_decomposition_diagram_1787962114859.jpg"
IMG_HUD = "/Users/bl10buer/.gemini/antigravity-ide/brain/1810b937-8dbf-40f1-bb66-5c99ba04a3ad/mindcast_cognitive_hud_1787962136066.jpg"
CARD_4 = f"{TMP_DIR}/cards/c4.png"
IMG_ARENA = "/Users/bl10buer/.gemini/antigravity-ide/brain/1810b937-8dbf-40f1-bb66-5c99ba04a3ad/mindcast_debate_arena_1787961331593.jpg"
CARD_COMING_SOON = f"{TMP_DIR}/coming_soon_clean.png"
IMG_FINAL = "/Users/bl10buer/.gemini/antigravity-ide/brain/1810b937-8dbf-40f1-bb66-5c99ba04a3ad/mindcast_final_reveal_1787962434584.jpg"

AUDIO_SCORE = "/tmp/mindcast_film_build/trailer_score.wav"

OUT_DESKTOP = "/Users/bl10buer/Desktop/MindCast/mindcast_teaser.mp4"
OUT_PUBLIC = "/Users/bl10buer/Desktop/MindCast/mindcast-app/public/mindcast_teaser.mp4"
OUT_TRAILER = "/Users/bl10buer/Desktop/MindCast/mindcast_trailer.mp4"

# Cinematic Anamorphic Letterbox 2.39:1 on 1920x1080
LETTERBOX = "scale=1920:1080,drawbox=x=0:y=0:w=1920:h=135:color=black:t=fill,drawbox=x=0:y=945:w=1920:h=135:color=black:t=fill"
GRADE = f"{LETTERBOX},eq=contrast=1.15:brightness=-0.02:saturation=1.12"

shots = [
    # (id, input_type, path, duration, vf)
    ("t1", "img", CARD_1, 2.2, "scale=1920:1080,fade=t=in:st=0:d=0.3"),
    ("t2", "img", IMG_EYE, 2.8, f"{GRADE},fade=t=in:st=0:d=0.2"),
    ("t3", "img", CARD_2, 2.2, "scale=1920:1080,fade=t=in:st=0:d=0.2"),
    ("t4", "img", IMG_CREATOR, 2.8, f"{GRADE},fade=t=in:st=0:d=0.2"),
    ("t5", "img", IMG_KEYBOARD, 2.0, f"{GRADE},fade=t=in:st=0:d=0.15"),
    ("t6", "seq", f"{TMP_DIR}/typing_frames/frame_%04d.png", 3.0, f"{LETTERBOX}"),
    ("t7", "img", IMG_CORE, 3.0, f"{GRADE},fade=t=in:st=0:d=0.2"),
    ("t8", "img", CARD_3, 2.2, "scale=1920:1080,fade=t=in:st=0:d=0.15"),
    ("t9", "img", IMG_DECOMP, 2.8, f"{GRADE},fade=t=in:st=0:d=0.2"),
    ("t10", "img", IMG_HUD, 2.5, f"{GRADE},fade=t=in:st=0:d=0.15"),
    ("t11", "img", CARD_4, 2.0, "scale=1920:1080,fade=t=in:st=0:d=0.15"),
    ("t12", "img", IMG_ARENA, 3.0, f"{GRADE},fade=t=in:st=0:d=0.15"),
    ("t13", "black", None, 1.5, "scale=1920:1080"),
    ("t14", "img", CARD_COMING_SOON, 3.0, f"{LETTERBOX},fade=t=in:st=0:d=0.2,fade=t=out:st=2.5:d=0.5"),
    ("t15", "img", IMG_FINAL, 3.8, "scale=1920:1080,fade=t=in:st=0:d=0.4,fade=t=out:st=3.0:d=0.8")
]

print("Rendering individual trailer cuts...")
concat_list = []
for shot_id, shot_type, path, dur, vf in shots:
    out_path = f"{TMP_DIR}/trailer_cuts/{shot_id}.mp4"
    concat_list.append(out_path)
    
    if shot_type == "img":
        cmd = [
            FFMPEG, "-y", "-loop", "1", "-i", path, "-t", str(dur),
            "-vf", vf, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", out_path
        ]
    elif shot_type == "seq":
        cmd = [
            FFMPEG, "-y", "-framerate", "30", "-i", path, "-t", str(dur),
            "-vf", vf, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", out_path
        ]
    elif shot_type == "black":
        cmd = [
            FFMPEG, "-y", "-f", "lavfi", "-i", f"color=c=black:s=1920x1080:d={dur}",
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", out_path
        ]
    subprocess.run(cmd, check=True)

print("Concatenating 15 trailer sequences...")
concat_file = f"{TMP_DIR}/trailer_cuts/concat.txt"
with open(concat_file, "w") as f:
    for c in concat_list:
        f.write(f"file '{c}'\n")

raw_visual = f"{TMP_DIR}/trailer_visual_raw.mp4"
subprocess.run([
    FFMPEG, "-y", "-f", "concat", "-safe", "0", "-i", concat_file,
    "-c", "copy", raw_visual
], check=True)

print("Final Muxing with Hollywood Trailer Score...")
final_cmd = [
    FFMPEG, "-y",
    "-i", raw_visual,
    "-i", AUDIO_SCORE,
    "-c:v", "libx264", "-preset", "fast", "-crf", "17", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "256k",
    "-shortest",
    OUT_DESKTOP
]
subprocess.run(final_cmd, check=True)

# Copy to all target outputs
shutil.copyfile(OUT_DESKTOP, OUT_PUBLIC)
shutil.copyfile(OUT_DESKTOP, OUT_TRAILER)

print("\n========================================================")
print("BLOCKBUSTER MOVIE TRAILER COMPLETED (38.0s)!")
print(f"1. {OUT_DESKTOP}")
print(f"2. {OUT_TRAILER}")
print(f"3. {OUT_PUBLIC}")
print("========================================================")
