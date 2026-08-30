import os
import subprocess
import shutil

FFMPEG = "/Users/bl10buer/Desktop/MindCast/mindcast-app/node_modules/ffmpeg-static/ffmpeg"
FONT_TITLE = "/System/Library/Fonts/Supplemental/DIN Alternate Bold.ttf"

IMG_BRAIN = "/Users/bl10buer/.gemini/antigravity-ide/brain/1810b937-8dbf-40f1-bb66-5c99ba04a3ad/mindcast_core_awakening_1787961317829.jpg"
IMG_DECOMP = "/Users/bl10buer/.gemini/antigravity-ide/brain/1810b937-8dbf-40f1-bb66-5c99ba04a3ad/mindcast_decomposition_diagram_1787962114859.jpg"
IMG_HUD = "/Users/bl10buer/.gemini/antigravity-ide/brain/1810b937-8dbf-40f1-bb66-5c99ba04a3ad/mindcast_cognitive_hud_1787962136066.jpg"
IMG_DEBATE = "/Users/bl10buer/.gemini/antigravity-ide/brain/1810b937-8dbf-40f1-bb66-5c99ba04a3ad/mindcast_debate_arena_1787961331593.jpg"
IMG_GALAXY = "/Users/bl10buer/.gemini/antigravity-ide/brain/1810b937-8dbf-40f1-bb66-5c99ba04a3ad/mindcast_noosphere_galaxy_1787961351458.jpg"
IMG_OUTRO = "/Users/bl10buer/.gemini/antigravity-ide/brain/1810b937-8dbf-40f1-bb66-5c99ba04a3ad/mindcast_brand_outro_1787961367638.jpg"

TMP_DIR = "/tmp/mindcast_video_build"
os.makedirs(TMP_DIR, exist_ok=True)

OUT_DESKTOP = "/Users/bl10buer/Desktop/MindCast/mindcast_teaser.mp4"
OUT_PUBLIC = "/Users/bl10buer/Desktop/MindCast/mindcast-app/public/mindcast_teaser.mp4"

# 1. Synthesize Soundtrack
print("1. Synthesizing new High-Tension Electro Cyberpunk Soundtrack...")
subprocess.run(["python3", "/Users/bl10buer/Desktop/MindCast/mindcast-app/scripts/generate_audio.py"], check=True)
AUDIO_FILE = f"{TMP_DIR}/cyberpunk_synth.wav"

GRADE = "scale=1920:1080,eq=contrast=1.14:brightness=-0.02:saturation=1.18"

# SCENE 1: The Hook (4.5s)
print("2. Rendering Scene 1: The Dead Idea Hook (4.5s)...")
cmd1 = [
    FFMPEG, "-y", "-loop", "1", "-i", IMG_BRAIN, "-t", "4.5",
    "-vf", (
        f"{GRADE},"
        f"drawtext=fontfile='{FONT_TITLE}':text='YOU POST AN IDEA ON THE INTERNET.':"
        "fontcolor=0xFFFFFF:fontsize=56:x=(w-text_w)/2:y=h*0.37:borderw=3:bordercolor=0x000000:"
        "box=1:boxcolor=0x05070E@0.85:boxborderw=20:"
        "alpha='if(lt(t,0.5),t/0.5,if(gt(t,3.8),(4.5-t)/0.7,1))',"
        f"drawtext=fontfile='{FONT_TITLE}':text='IT GETS 12 LIKES. AND DIES.':"
        "fontcolor=0xF87171:fontsize=42:x=(w-text_w)/2:y=h*0.50:borderw=2:bordercolor=0x000000:"
        "box=1:boxcolor=0x05070E@0.85:boxborderw=16:"
        "alpha='if(lt(t,1.2),(t-1.2)/0.5,if(gt(t,3.8),(4.5-t)/0.7,1))'"
    ),
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", f"{TMP_DIR}/scene1.mp4"
]
subprocess.run(cmd1, check=True)

# SCENE 2: The Living Mind (4.5s) - NO 0G, NO POWERED BY
print("3. Rendering Scene 2: The Living Mind (4.5s)...")
cmd2 = [
    FFMPEG, "-y", "-loop", "1", "-i", IMG_BRAIN, "-t", "4.5",
    "-vf", (
        f"{GRADE},"
        f"drawtext=fontfile='{FONT_TITLE}':text='WHAT IF IDEAS WERE ALIVE?':"
        "fontcolor=0x39FF14:fontsize=62:x=(w-text_w)/2:y=h*0.36:borderw=3:bordercolor=0x000000:"
        "box=1:boxcolor=0x05070E@0.85:boxborderw=22:"
        "alpha='if(lt(t,0.5),t/0.5,if(gt(t,3.8),(4.5-t)/0.7,1))',"
        f"drawtext=fontfile='{FONT_TITLE}':text='SOVEREIGN INTELLECTUAL ENTITIES WITH MINDS OF THEIR OWN':"
        "fontcolor=0x38BDF8:fontsize=36:x=(w-text_w)/2:y=h*0.51:borderw=2:bordercolor=0x000000:"
        "box=1:boxcolor=0x05070E@0.85:boxborderw=16:"
        "alpha='if(lt(t,1.0),(t-1.0)/0.5,if(gt(t,3.8),(4.5-t)/0.7,1))'"
    ),
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", f"{TMP_DIR}/scene2.mp4"
]
subprocess.run(cmd2, check=True)

# SCENE 3: Illustrator Diagram - Thesis Decomposition (4.5s)
print("4. Rendering Scene 3: Thesis Decomposition Schematic (4.5s)...")
cmd3 = [
    FFMPEG, "-y", "-loop", "1", "-i", IMG_DECOMP, "-t", "4.5",
    "-vf", (
        f"{GRADE},"
        f"drawtext=fontfile='{FONT_TITLE}':text='COGNITIVE THESIS DECOMPOSITION':"
        "fontcolor=0x38BDF8:fontsize=54:x=(w-text_w)/2:y=h*0.06:borderw=3:bordercolor=0x000000:"
        "box=1:boxcolor=0x05070E@0.88:boxborderw=18:"
        "alpha='if(lt(t,0.5),t/0.5,if(gt(t,3.8),(4.5-t)/0.7,1))',"
        f"drawtext=fontfile='{FONT_TITLE}':text='MINDS BREAK LARGE THESES INTO MEASURABLE SUBCLAIMS & METRICS':"
        "fontcolor=0xFFFFFF:fontsize=32:x=(w-text_w)/2:y=h*0.93:borderw=2:bordercolor=0x000000:"
        "box=1:boxcolor=0x05070E@0.85:boxborderw=14:"
        "alpha='if(lt(t,0.9),(t-0.9)/0.5,if(gt(t,3.8),(4.5-t)/0.7,1))'"
    ),
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", f"{TMP_DIR}/scene3.mp4"
]
subprocess.run(cmd3, check=True)

# SCENE 4: Illustrator Diagram - Live Evidence HUD (4.5s)
print("5. Rendering Scene 4: Evidence & Calibration Dashboard (4.5s)...")
cmd4 = [
    FFMPEG, "-y", "-loop", "1", "-i", IMG_HUD, "-t", "4.5",
    "-vf", (
        f"{GRADE},"
        f"drawtext=fontfile='{FONT_TITLE}':text='AUTONOMOUS EVIDENCE HARVESTING':"
        "fontcolor=0x39FF14:fontsize=52:x=(w-text_w)/2:y=h*0.06:borderw=3:bordercolor=0x000000:"
        "box=1:boxcolor=0x05070E@0.88:boxborderw=18:"
        "alpha='if(lt(t,0.5),t/0.5,if(gt(t,3.8),(4.5-t)/0.7,1))',"
        f"drawtext=fontfile='{FONT_TITLE}':text='SUPPORTING & OPPOSING WEB AUDITS \u00b7 REAL-TIME BELIEF CALIBRATION':"
        "fontcolor=0x38BDF8:fontsize=32:x=(w-text_w)/2:y=h*0.93:borderw=2:bordercolor=0x000000:"
        "box=1:boxcolor=0x05070E@0.85:boxborderw=14:"
        "alpha='if(lt(t,0.9),(t-0.9)/0.5,if(gt(t,3.8),(4.5-t)/0.7,1))'"
    ),
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", f"{TMP_DIR}/scene4.mp4"
]
subprocess.run(cmd4, check=True)

# SCENE 5: The Debate Arena (4.5s)
print("6. Rendering Scene 5: The 5-Round Debate Arena (4.5s)...")
cmd5 = [
    FFMPEG, "-y", "-loop", "1", "-i", IMG_DEBATE, "-t", "4.5",
    "-vf", (
        f"{GRADE},"
        f"drawtext=fontfile='{FONT_TITLE}':text='THE 5-ROUND INTELLECTUAL ARENA':"
        "fontcolor=0xFFD166:fontsize=54:x=(w-text_w)/2:y=h*0.16:borderw=3:bordercolor=0x000000:"
        "box=1:boxcolor=0x05070E@0.88:boxborderw=20:"
        "alpha='if(lt(t,0.5),t/0.5,if(gt(t,3.8),(4.5-t)/0.7,1))',"
        f"drawtext=fontfile='{FONT_TITLE}':text='THEY RESEARCH \u00b7 THEY PREDICT \u00b7 THEY REFUTE FLAWED CLAIMS':"
        "fontcolor=0xFFFFFF:fontsize=34:x=(w-text_w)/2:y=h*0.27:borderw=2:bordercolor=0x000000:"
        "box=1:boxcolor=0x05070E@0.85:boxborderw=16:"
        "alpha='if(lt(t,0.9),(t-0.9)/0.5,if(gt(t,3.8),(4.5-t)/0.7,1))'"
    ),
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", f"{TMP_DIR}/scene5.mp4"
]
subprocess.run(cmd5, check=True)

# SCENE 6: Outro & Call to Action (5.0s)
print("7. Rendering Scene 6: Outro & Call to Action (5.0s)...")
cmd6 = [
    FFMPEG, "-y", "-loop", "1", "-i", IMG_OUTRO, "-t", "5.0",
    "-vf", (
        f"{GRADE},"
        f"drawtext=fontfile='{FONT_TITLE}':text='GIVE YOUR IDEA A MIND.':"
        "fontcolor=0xFFFFFF:fontsize=54:x=(w-text_w)/2:y=h*0.24:borderw=3:bordercolor=0x000000:"
        "box=1:boxcolor=0x05070E@0.88:boxborderw=20:"
        "alpha='if(lt(t,0.5),t/0.5,1)',"
        f"drawtext=fontfile='{FONT_TITLE}':text='mindcast.fun':"
        "fontcolor=0x39FF14:fontsize=68:x=(w-text_w)/2:y=h*0.72:borderw=3:bordercolor=0x000000:"
        "box=1:boxcolor=0x05070E@0.90:boxborderw=24:"
        "alpha='if(lt(t,0.9),(t-0.9)/0.5,1)',"
        f"drawtext=fontfile='{FONT_TITLE}':text='LIVE ON BASE \u00b7 THE AUTONOMOUS NOOSPHERE':"
        "fontcolor=0x38BDF8:fontsize=32:x=(w-text_w)/2:y=h*0.84:borderw=2:bordercolor=0x000000:"
        "box=1:boxcolor=0x05070E@0.85:boxborderw=16:"
        "alpha='if(lt(t,1.3),(t-1.3)/0.5,1)'"
    ),
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", f"{TMP_DIR}/scene6.mp4"
]
subprocess.run(cmd6, check=True)

print("8. Concatenating 6 Scenes with Epic Soundtrack...")
concat_file = f"{TMP_DIR}/concat.txt"
with open(concat_file, "w") as f:
    f.write(f"file '{TMP_DIR}/scene1.mp4'\n")
    f.write(f"file '{TMP_DIR}/scene2.mp4'\n")
    f.write(f"file '{TMP_DIR}/scene3.mp4'\n")
    f.write(f"file '{TMP_DIR}/scene4.mp4'\n")
    f.write(f"file '{TMP_DIR}/scene5.mp4'\n")
    f.write(f"file '{TMP_DIR}/scene6.mp4'\n")

cmd_concat = [
    FFMPEG, "-y", "-f", "concat", "-safe", "0", "-i", concat_file,
    "-c", "copy", f"{TMP_DIR}/visual_raw.mp4"
]
subprocess.run(cmd_concat, check=True)

# Final mux with audio and fade-in/fade-out
final_cmd = [
    FFMPEG, "-y",
    "-i", f"{TMP_DIR}/visual_raw.mp4",
    "-i", AUDIO_FILE,
    "-vf", "fade=t=in:st=0:d=0.6,fade=t=out:st=26.2:d=1.3",
    "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "256k",
    "-shortest",
    OUT_DESKTOP
]
subprocess.run(final_cmd, check=True)

shutil.copyfile(OUT_DESKTOP, OUT_PUBLIC)
print("\n========================================================")
print("SUCCESS! Complete 6-Scene Cinematic Video Rendered:")
print(f"File 1: {OUT_DESKTOP}")
print(f"File 2: {OUT_PUBLIC}")
print("========================================================")
