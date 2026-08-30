import os
import subprocess
import shutil

FFMPEG = "/Users/bl10buer/Desktop/MindCast/mindcast-app/node_modules/ffmpeg-static/ffmpeg"

IMG_VOID = "/Users/bl10buer/.gemini/antigravity-ide/brain/1810b937-8dbf-40f1-bb66-5c99ba04a3ad/mindcast_scene1_void_1787962318412.jpg"
IMG_AWAKENING = "/Users/bl10buer/.gemini/antigravity-ide/brain/1810b937-8dbf-40f1-bb66-5c99ba04a3ad/mindcast_scene3_awakening_1787962339276.jpg"
IMG_OBSERVING = "/Users/bl10buer/.gemini/antigravity-ide/brain/1810b937-8dbf-40f1-bb66-5c99ba04a3ad/mindcast_scene4_observing_1787962360440.jpg"
IMG_DEBATE = "/Users/bl10buer/.gemini/antigravity-ide/brain/1810b937-8dbf-40f1-bb66-5c99ba04a3ad/mindcast_scene6_debate_1787962385863.jpg"
IMG_ECOSYSTEM = "/Users/bl10buer/.gemini/antigravity-ide/brain/1810b937-8dbf-40f1-bb66-5c99ba04a3ad/mindcast_scene8_ecosystem_1787962409059.jpg"
IMG_REVEAL = "/Users/bl10buer/.gemini/antigravity-ide/brain/1810b937-8dbf-40f1-bb66-5c99ba04a3ad/mindcast_final_reveal_1787962434584.jpg"

TMP_DIR = "/tmp/mindcast_film_build"
os.makedirs(TMP_DIR, exist_ok=True)

OUT_FILM = "/Users/bl10buer/Desktop/MindCast/mindcast_brand_film.mp4"
OUT_TEASER = "/Users/bl10buer/Desktop/MindCast/mindcast_teaser.mp4"
OUT_PUBLIC = "/Users/bl10buer/Desktop/MindCast/mindcast-app/public/mindcast_brand_film.mp4"

# 1. Synthesize 42s Audio Score
print("1. Synthesizing 42s Master Cinematic Film Score...")
subprocess.run(["python3", "/Users/bl10buer/Desktop/MindCast/mindcast-app/scripts/generate_film_audio.py"], check=True)
AUDIO_FILE = "/tmp/mindcast_video_build/film_score.wav"

# Common grading: deep blacks, pure restraint, no neon oversaturation
GRADE = "scale=1920:1080,eq=contrast=1.08:brightness=-0.02:saturation=0.98"

# SCENE 1: THE VOID (4.5s) - Pure darkness, slow delicate push into the particle
print("2. Rendering Scene 1: The Void (4.5s)...")
cmd1 = [
    FFMPEG, "-y", "-loop", "1", "-i", IMG_VOID, "-t", "4.5",
    "-vf", f"{GRADE},fade=t=in:st=0:d=1.5",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", f"{TMP_DIR}/s1.mp4"
]
subprocess.run(cmd1, check=True)

# SCENE 2: BIRTH & AWAKENING (6.0s) - Organic crystalline thought constellation
print("3. Rendering Scene 2: Awakening of the Mind (6.0s)...")
cmd2 = [
    FFMPEG, "-y", "-loop", "1", "-i", IMG_AWAKENING, "-t", "6.0",
    "-vf", f"{GRADE},fade=t=in:st=0:d=0.8",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", f"{TMP_DIR}/s2.mp4"
]
subprocess.run(cmd2, check=True)

# SCENE 3: OBSERVING THE WORLD (6.5s) - Abstract fluid information streams flowing & absorbing
print("4. Rendering Scene 3: Observing the World (6.5s)...")
cmd3 = [
    FFMPEG, "-y", "-loop", "1", "-i", IMG_OBSERVING, "-t", "6.5",
    "-vf", f"{GRADE},fade=t=in:st=0:d=0.8",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", f"{TMP_DIR}/s3.mp4"
]
subprocess.run(cmd3, check=True)

# SCENE 4: CONFLICT / INTELLECTUAL DEBATE (7.5s) - Two minds testing each other's reasoning
print("5. Rendering Scene 4: The Intellectual Dialogue (7.5s)...")
cmd4 = [
    FFMPEG, "-y", "-loop", "1", "-i", IMG_DEBATE, "-t", "7.5",
    "-vf", f"{GRADE},fade=t=in:st=0:d=0.8",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", f"{TMP_DIR}/s4.mp4"
]
subprocess.run(cmd4, check=True)

# SCENE 5: EMERGENCE & THE NOOSPHERE ECOSYSTEM (8.0s) - Vast constellation of minds, light accumulating
print("6. Rendering Scene 5: The Emergent Ecosystem (8.0s)...")
cmd5 = [
    FFMPEG, "-y", "-loop", "1", "-i", IMG_ECOSYSTEM, "-t", "8.0",
    "-vf", f"{GRADE},fade=t=in:st=0:d=0.8,fade=t=out:st=6.8:d=1.2",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", f"{TMP_DIR}/s5.mp4"
]
subprocess.run(cmd5, check=True)

# SCENE 6: THE SILENCE (3.0s) - Complete black void before revelation
print("7. Rendering Scene 6: Pure Silence in Black (3.0s)...")
cmd6 = [
    FFMPEG, "-y", "-f", "lavfi", "-i", "color=c=black:s=1920x1080:d=3.0",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", f"{TMP_DIR}/s6.mp4"
]
subprocess.run(cmd6, check=True)

# SCENE 7: FINAL REVEAL (6.5s) - The MINDCAST sigil and 'Ideas, alive.' on pure black
print("8. Rendering Scene 7: Final Reveal (6.5s)...")
cmd7 = [
    FFMPEG, "-y", "-loop", "1", "-i", IMG_REVEAL, "-t", "6.5",
    "-vf", "scale=1920:1080,fade=t=in:st=0:d=0.8,fade=t=out:st=5.2:d=1.3",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", f"{TMP_DIR}/s7.mp4"
]
subprocess.run(cmd7, check=True)

# Concatenate all 7 scenes
print("9. Concatenating Visual Narrative (42.0s)...")
concat_file = f"{TMP_DIR}/concat.txt"
with open(concat_file, "w") as f:
    f.write(f"file '{TMP_DIR}/s1.mp4'\n")
    f.write(f"file '{TMP_DIR}/s2.mp4'\n")
    f.write(f"file '{TMP_DIR}/s3.mp4'\n")
    f.write(f"file '{TMP_DIR}/s4.mp4'\n")
    f.write(f"file '{TMP_DIR}/s5.mp4'\n")
    f.write(f"file '{TMP_DIR}/s6.mp4'\n")
    f.write(f"file '{TMP_DIR}/s7.mp4'\n")

cmd_concat = [
    FFMPEG, "-y", "-f", "concat", "-safe", "0", "-i", concat_file,
    "-c", "copy", f"{TMP_DIR}/visual_raw.mp4"
]
subprocess.run(cmd_concat, check=True)

# Final Mux with Master Audio Track
print("10. Final Audio-Visual Master Muxing...")
final_cmd = [
    FFMPEG, "-y",
    "-i", f"{TMP_DIR}/visual_raw.mp4",
    "-i", AUDIO_FILE,
    "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "256k",
    "-shortest",
    OUT_FILM
]
subprocess.run(final_cmd, check=True)

# Copy to public folder and teaser paths
shutil.copyfile(OUT_FILM, OUT_PUBLIC)
shutil.copyfile(OUT_FILM, OUT_TEASER)

print("\n========================================================")
print("MASTER CINEMATIC BRAND FILM COMPLETED!")
print(f"1. {OUT_FILM}")
print(f"2. {OUT_TEASER}")
print(f"3. {OUT_PUBLIC}")
print("========================================================")
