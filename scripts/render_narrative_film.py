import os
import subprocess
import shutil

FFMPEG = "/Users/bl10buer/Desktop/MindCast/mindcast-app/node_modules/ffmpeg-static/ffmpeg"
FONT_TITLE = "/System/Library/Fonts/Supplemental/DIN Alternate Bold.ttf"

# Cleaned Creator Image with MINDCAST on laptop screen
IMG_CREATOR = "/Users/bl10buer/Desktop/MindCast/mindcast-app/public/mindcast_creator_clean.jpg"
IMG_DECOMP = "/Users/bl10buer/.gemini/antigravity-ide/brain/1810b937-8dbf-40f1-bb66-5c99ba04a3ad/mindcast_decomposition_diagram_1787962114859.jpg"
IMG_HUD = "/Users/bl10buer/.gemini/antigravity-ide/brain/1810b937-8dbf-40f1-bb66-5c99ba04a3ad/mindcast_cognitive_hud_1787962136066.jpg"
IMG_DEBATE = "/Users/bl10buer/.gemini/antigravity-ide/brain/1810b937-8dbf-40f1-bb66-5c99ba04a3ad/mindcast_debate_arena_1787961331593.jpg"
IMG_COMING_SOON = "/tmp/mindcast_film_build/coming_soon_clean.png"
IMG_REVEAL = "/Users/bl10buer/.gemini/antigravity-ide/brain/1810b937-8dbf-40f1-bb66-5c99ba04a3ad/mindcast_final_reveal_1787962434584.jpg"

TMP_DIR = "/tmp/mindcast_film_build"
os.makedirs(TMP_DIR, exist_ok=True)

OUT_DESKTOP = "/Users/bl10buer/Desktop/MindCast/mindcast_teaser.mp4"
OUT_FILM = "/Users/bl10buer/Desktop/MindCast/mindcast_brand_film.mp4"
OUT_PUBLIC = "/Users/bl10buer/Desktop/MindCast/mindcast-app/public/mindcast_teaser.mp4"

AUDIO_FILE = "/tmp/mindcast_film_build/narrative_audio.wav"
GRADE = "scale=1920:1080,eq=contrast=1.12:brightness=-0.02:saturation=1.15"

print("--- Step 1: Rendering Scene 1: The Human Epiphany with MINDCAST Screen (4.5s) ---")
cmd1 = [
    FFMPEG, "-y", "-loop", "1", "-i", IMG_CREATOR, "-t", "4.5",
    "-vf", (
        f"{GRADE},"
        f"drawtext=fontfile='{FONT_TITLE}':text='AN IDEA IS BORN.':"
        "fontcolor=0xFFFFFF:fontsize=58:x=(w-text_w)/2:y=h*0.72:borderw=3:bordercolor=0x000000:"
        "box=1:boxcolor=0x05070E@0.85:boxborderw=20:"
        "alpha='if(lt(t,0.6),t/0.6,if(gt(t,3.8),(4.5-t)/0.7,1))',"
        f"drawtext=fontfile='{FONT_TITLE}':text='ON THE REGULAR WEB, IT GETS 12 LIKES. AND DIES.':"
        "fontcolor=0xF87171:fontsize=36:x=(w-text_w)/2:y=h*0.84:borderw=2:bordercolor=0x000000:"
        "box=1:boxcolor=0x05070E@0.85:boxborderw=16:"
        "alpha='if(lt(t,1.2),(t-1.2)/0.6,if(gt(t,3.8),(4.5-t)/0.7,1))'"
    ),
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", f"{TMP_DIR}/s1.mp4"
]
subprocess.run(cmd1, check=True)

print("--- Step 2: Rendering Scene 2: Screen Close-up & Live Typing (5.0s) ---")
cmd2 = [
    FFMPEG, "-y", "-framerate", "30", "-i", f"{TMP_DIR}/typing_frames/frame_%04d.png",
    "-vf", "scale=1920:1080",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", f"{TMP_DIR}/s2.mp4"
]
subprocess.run(cmd2, check=True)

print("--- Step 3: Rendering Scene 3: Thesis Decomposition Diagram (5.0s) ---")
cmd3 = [
    FFMPEG, "-y", "-loop", "1", "-i", IMG_DECOMP, "-t", "5.0",
    "-vf", (
        f"{GRADE},"
        f"drawtext=fontfile='{FONT_TITLE}':text='COGNITIVE THESIS DECOMPOSITION':"
        "fontcolor=0x38BDF8:fontsize=52:x=(w-text_w)/2:y=h*0.06:borderw=3:bordercolor=0x000000:"
        "box=1:boxcolor=0x05070E@0.88:boxborderw=18:"
        "alpha='if(lt(t,0.6),t/0.6,if(gt(t,4.2),(5.0-t)/0.8,1))',"
        f"drawtext=fontfile='{FONT_TITLE}':text='MINDS BREAK LARGE THESES INTO MEASURABLE SUBCLAIMS & METRICS':"
        "fontcolor=0xFFFFFF:fontsize=32:x=(w-text_w)/2:y=h*0.93:borderw=2:bordercolor=0x000000:"
        "box=1:boxcolor=0x05070E@0.85:boxborderw=14:"
        "alpha='if(lt(t,1.0),(t-1.0)/0.6,if(gt(t,4.2),(5.0-t)/0.8,1))'"
    ),
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", f"{TMP_DIR}/s3.mp4"
]
subprocess.run(cmd3, check=True)

print("--- Step 4: Rendering Scene 4: Evidence & Calibration Dashboard (5.0s) ---")
cmd4 = [
    FFMPEG, "-y", "-loop", "1", "-i", IMG_HUD, "-t", "5.0",
    "-vf", (
        f"{GRADE},"
        f"drawtext=fontfile='{FONT_TITLE}':text='AUTONOMOUS EVIDENCE HARVESTING':"
        "fontcolor=0x39FF14:fontsize=52:x=(w-text_w)/2:y=h*0.06:borderw=3:bordercolor=0x000000:"
        "box=1:boxcolor=0x05070E@0.88:boxborderw=18:"
        "alpha='if(lt(t,0.6),t/0.6,if(gt(t,4.2),(5.0-t)/0.8,1))',"
        f"drawtext=fontfile='{FONT_TITLE}':text='SUPPORTING & OPPOSING WEB AUDITS \u00b7 REAL-TIME BELIEF CALIBRATION':"
        "fontcolor=0x38BDF8:fontsize=32:x=(w-text_w)/2:y=h*0.93:borderw=2:bordercolor=0x000000:"
        "box=1:boxcolor=0x05070E@0.85:boxborderw=14:"
        "alpha='if(lt(t,1.0),(t-1.0)/0.6,if(gt(t,4.2),(5.0-t)/0.8,1))'"
    ),
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", f"{TMP_DIR}/s4.mp4"
]
subprocess.run(cmd4, check=True)

print("--- Step 5: Rendering Scene 5: Thesis vs Antithesis Arena (5.0s) ---")
cmd5 = [
    FFMPEG, "-y", "-loop", "1", "-i", IMG_DEBATE, "-t", "5.0",
    "-vf", (
        f"{GRADE},"
        f"drawtext=fontfile='{FONT_TITLE}':text='THESIS VS. ANTITHESIS':"
        "fontcolor=0xFFD166:fontsize=56:x=(w-text_w)/2:y=h*0.16:borderw=3:bordercolor=0x000000:"
        "box=1:boxcolor=0x05070E@0.88:boxborderw=20:"
        "alpha='if(lt(t,0.6),t/0.6,if(gt(t,4.2),(5.0-t)/0.8,1))',"
        f"drawtext=fontfile='{FONT_TITLE}':text='5-ROUND INTELLECTUAL ARENA \u00b7 TESTING REASONING WITHOUT PUPPETS':"
        "fontcolor=0xFFFFFF:fontsize=34:x=(w-text_w)/2:y=h*0.27:borderw=2:bordercolor=0x000000:"
        "box=1:boxcolor=0x05070E@0.85:boxborderw=16:"
        "alpha='if(lt(t,1.0),(t-1.0)/0.6,if(gt(t,4.2),(5.0-t)/0.8,1))'"
    ),
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", f"{TMP_DIR}/s5.mp4"
]
subprocess.run(cmd5, check=True)

# SCENE 6: Minimalist, Bold COMING SOON (4.0s)
print("--- Step 6: Rendering Scene 6: Pure COMING SOON (4.0s) ---")
cmd6 = [
    FFMPEG, "-y", "-loop", "1", "-i", IMG_COMING_SOON, "-t", "4.0",
    "-vf", "scale=1920:1080,fade=t=in:st=0:d=0.5,fade=t=out:st=3.3:d=0.7",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", f"{TMP_DIR}/s6.mp4"
]
subprocess.run(cmd6, check=True)

# SCENE 7: Final Brand Reveal (5.5s)
print("--- Step 7: Rendering Scene 7: Final Brand Reveal (5.5s) ---")
cmd7 = [
    FFMPEG, "-y", "-loop", "1", "-i", IMG_REVEAL, "-t", "5.5",
    "-vf", "scale=1920:1080,fade=t=in:st=0:d=0.6,fade=t=out:st=4.5:d=1.0",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", f"{TMP_DIR}/s7.mp4"
]
subprocess.run(cmd7, check=True)

print("--- Step 8: Concatenating All 7 Scenes (34.0s) ---")
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

print("--- Step 9: Final Audio-Visual Muxing ---")
final_cmd = [
    FFMPEG, "-y",
    "-i", f"{TMP_DIR}/visual_raw.mp4",
    "-i", AUDIO_FILE,
    "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "256k",
    "-shortest",
    OUT_DESKTOP
]
subprocess.run(final_cmd, check=True)

# Copy to other output targets
shutil.copyfile(OUT_DESKTOP, OUT_FILM)
shutil.copyfile(OUT_DESKTOP, OUT_PUBLIC)

print("\n========================================================")
print("SUCCESS! Master Brand Film with Clean COMING SOON and MINDCAST Screen:")
print(f"1. {OUT_DESKTOP}")
print(f"2. {OUT_FILM}")
print(f"3. {OUT_PUBLIC}")
print("========================================================")
