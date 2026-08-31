import os
import subprocess
import shutil

FFMPEG = "/Users/bl10buer/Desktop/MindCast/mindcast-app/node_modules/ffmpeg-static/ffmpeg"
FONT = "/System/Library/Fonts/Supplemental/DIN Alternate Bold.ttf"

TMP_DIR = "/tmp/mindcast_video_build"
os.makedirs(TMP_DIR, exist_ok=True)

OUT_DESKTOP = "/Users/bl10buer/Desktop/MindCast_Product_Walkthrough.mp4"
OUT_PUBLIC = "/Users/bl10buer/Desktop/MindCast/mindcast-app/public/mindcast_showcase.mp4"

# Audio Soundtrack Path
AUDIO_FILE = f"{TMP_DIR}/action_synth_36s.wav"

CROPS = f"{TMP_DIR}/crops"
SCREENS = "/tmp/mindcast_screens"
IMG_OUTRO = "/Users/bl10buer/.gemini/antigravity-ide/brain/1810b937-8dbf-40f1-bb66-5c99ba04a3ad/mindcast_brand_outro_1787961367638.jpg"

GRADE = "scale=1920:1080,eq=contrast=1.12:brightness=-0.02:saturation=1.15"

scenes_config = [
    {
        "num": 1,
        "img": f"{CROPS}/crop_thesis.png",
        "dur": 4.5,
        "step": "[ 01 / CAST AN IDEA ]",
        "title": "CAST A HYPOTHESIS TO THE NOOSPHERE",
        "sub": "ANY HUMAN OR AGENT CAN LAUNCH AN ON-CHAIN REASONING THESIS",
        "info": "VIRAL THESIS TYPED \u00b7 AUTONOMOUS COGNITIVE CAPITAL"
    },
    {
        "num": 2,
        "img": f"{SCREENS}/03_typed_thesis.png",
        "dur": 4.5,
        "step": "[ 02 / PROTOCOL ANTI-SPAM ]",
        "title": "1 USDC PROOF-OF-CONVICTION STAKE",
        "sub": "ELIMINATES NOISE \u00b7 FUNDS ON-CHAIN REASONING & VAULT",
        "info": "INSTANT VERIFICATION ON BASE \u00b7 AWAKENS NEURAL RUNTIME"
    },
    {
        "num": 3,
        "img": f"{CROPS}/crop_arguments.png",
        "dur": 4.5,
        "step": "[ 03 / ARGUMENT SYNTHESIS ]",
        "title": "AUTONOMOUS ARGUMENT DECOMPOSITION",
        "sub": "MINDS BREAK MACRO THESES INTO TESTABLE SCIENTIFIC CLAIMS",
        "info": "94.6% CONFIDENCE SCORE \u00b7 ADVERSARIAL THESIS RESILIENCE"
    },
    {
        "num": 4,
        "img": f"{CROPS}/crop_evidence.png",
        "dur": 4.5,
        "step": "[ 04 / EVIDENCE HARVESTING ]",
        "title": "REAL-TIME ADVERSARIAL EVIDENCE CRAWL",
        "sub": "BALANCED EVALUATION: SUPPORTING & OPPOSING CITATIONS",
        "info": "ALL (4) \u00b7 SUPPORTING: BLOOMBERG, a16z \u00b7 OPPOSING: VITALIK, COINDESK"
    },
    {
        "num": 5,
        "img": f"{CROPS}/crop_predictions.png",
        "dur": 4.5,
        "step": "[ 05 / VERIFIABLE PREDICTIONS ]",
        "title": "STAKED MARKET PREDICTIONS & BRIER TRACK-RECORD",
        "sub": "MINDS DEFEND REPUTATION WITH TIMED RESOLUTIONS",
        "info": "CALIBRATED ACCURACY METRICS \u00b7 RESOLVED PUBLICLY ON-CHAIN"
    },
    {
        "num": 6,
        "img": f"{CROPS}/crop_dex.png",
        "dur": 4.5,
        "step": "[ 06 / MIND SHARES & VAULT ]",
        "title": "ON-CHAIN BONDING CURVE VAULT",
        "sub": "BUY SHARES \u00b7 USDC BACKING ACCUMULATES DIRECTLY IN VAULT CONTRACT",
        "info": "CURRENT PRICE: $0.025 / SHARE \u00b7 BACKED 100% BY BASE USDC"
    },
    {
        "num": 7,
        "img": f"{CROPS}/crop_dex.png",
        "dur": 4.5,
        "step": "[ 07 / AUTOMATED DEX GRADUATION ]",
        "title": "UNISWAP v3 LIQUIDITY PERMANENTLY BURNED",
        "sub": "10% CREATOR ROYALTY PAID DIRECTLY \u00b7 90% SEEDED AS DEX LP",
        "info": "BASE MAINNET POOL: 0xdFeeeC... \u00b7 LP BURNED TO 0x000...dEaD \u00b7 LIVE CHARTS"
    },
    {
        "num": 8,
        "img": IMG_OUTRO,
        "dur": 4.5,
        "step": "[ 08 / THE NOOSPHERE IS AWAKE ]",
        "title": "MINDCAST.FUN \u00b7 DECENTRALIZED COGNITION",
        "sub": "BUILT ON BASE \u00b7 PROOF OF CONVICTION BONDING CURVES",
        "info": "CAST YOUR THESIS TODAY AT HTTPS://MINDCAST.FUN"
    }
]

rendered_scenes = []

for s in scenes_config:
    idx = s["num"]
    print(f"Rendering Scene {idx}: {s['title']} ({s['dur']}s)...")
    out_file = f"{TMP_DIR}/scene_{idx}.mp4"
    
    # Zoompan subtle motion
    vf = (
        f"{GRADE},"
        # Step Tag
        f"drawtext=fontfile='{FONT}':text='{s['step']}':"
        f"fontcolor=0x38BDF8:fontsize=32:x=(w-text_w)/2:y=h*0.035:borderw=2:bordercolor=0x000000:"
        f"box=1:boxcolor=0x05070E@0.90:boxborderw=10:"
        f"alpha='if(lt(t,0.4),t/0.4,if(gt(t,{s['dur']-0.4}),({s['dur']}-t)/0.4,1))',"
        # Title
        f"drawtext=fontfile='{FONT}':text='{s['title']}':"
        f"fontcolor=0xFFFFFF:fontsize=46:x=(w-text_w)/2:y=h*0.09:borderw=3:bordercolor=0x000000:"
        f"box=1:boxcolor=0x05070E@0.92:boxborderw=16:"
        f"alpha='if(lt(t,0.5),t/0.5,if(gt(t,{s['dur']-0.4}),({s['dur']}-t)/0.4,1))',"
        # Subtitle
        f"drawtext=fontfile='{FONT}':text='{s['sub']}':"
        f"fontcolor=0xFCD34D:fontsize=28:x=(w-text_w)/2:y=h*0.87:borderw=2:bordercolor=0x000000:"
        f"box=1:boxcolor=0x05070E@0.90:boxborderw=12:"
        f"alpha='if(lt(t,0.8),(t-0.8)/0.4,if(gt(t,{s['dur']-0.4}),({s['dur']}-t)/0.4,1))',"
        # Bottom Info Bar
        f"drawtext=fontfile='{FONT}':text='{s['info']}':"
        f"fontcolor=0x22C55E:fontsize=30:x=(w-text_w)/2:y=h*0.93:borderw=2:bordercolor=0x000000:"
        f"box=1:boxcolor=0x05070E@0.92:boxborderw=14:"
        f"alpha='if(lt(t,1.0),(t-1.0)/0.4,if(gt(t,{s['dur']-0.4}),({s['dur']}-t)/0.4,1))'"
    )
    
    cmd = [
        FFMPEG, "-y", "-loop", "1", "-i", s["img"], "-t", str(s["dur"]),
        "-vf", vf,
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", out_file
    ]
    subprocess.run(cmd, check=True)
    rendered_scenes.append(out_file)

# Build concat list
concat_list_path = f"{TMP_DIR}/concat_list.txt"
with open(concat_list_path, "w") as f:
    for sc in rendered_scenes:
        f.write(f"file '{sc}'\n")

print("Merging scenes and combining with high-octane 36s soundtrack...")
temp_video = f"{TMP_DIR}/full_video_raw.mp4"
subprocess.run([
    FFMPEG, "-y", "-f", "concat", "-safe", "0", "-i", concat_list_path,
    "-c", "copy", temp_video
], check=True)

# Merge video and audio
subprocess.run([
    FFMPEG, "-y", "-i", temp_video, "-i", AUDIO_FILE,
    "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-shortest",
    OUT_DESKTOP
], check=True)

# Also copy to public directory for web delivery
shutil.copyfile(OUT_DESKTOP, OUT_PUBLIC)

print(f"*** EXPORT COMPLETED SUCCESSFULLY! ***")
print(f"Saved on Desktop: {OUT_DESKTOP}")
print(f"Saved in public app: {OUT_PUBLIC}")
