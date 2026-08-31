import os
import subprocess
import shutil

FFMPEG = "/Users/bl10buer/Desktop/MindCast/mindcast-app/node_modules/ffmpeg-static/ffmpeg"
FONT = "/System/Library/Fonts/Supplemental/DIN Alternate Bold.ttf"

TMP = "/tmp/mindcast_cinema_build"
os.makedirs(TMP, exist_ok=True)

OUT_DESKTOP = "/Users/bl10buer/Desktop/MindCast_Trailer.mp4"
OUT_PUBLIC = "/Users/bl10buer/Desktop/MindCast/mindcast-app/public/mindcast_trailer.mp4"

AUDIO_FILE = "/tmp/mindcast_video_build/trailer_braam_132bpm.wav"

BRAIN_DIR = "/Users/bl10buer/.gemini/antigravity-ide/brain/1810b937-8dbf-40f1-bb66-5c99ba04a3ad"

# Assets
IMG_VOID = f"{BRAIN_DIR}/mindcast_scene1_void_1787962318412.jpg"
IMG_TERMINAL = f"{BRAIN_DIR}/trailer_creator_terminal_1788189109797.jpg"
IMG_TYPING = f"{BRAIN_DIR}/trailer_typing_macro_1787995336653.jpg"
IMG_CORE = f"{BRAIN_DIR}/trailer_neural_core_1787995356681.jpg"
IMG_AWAKENING = f"{BRAIN_DIR}/mindcast_core_awakening_1787961317829.jpg"
IMG_HUD = f"{BRAIN_DIR}/mindcast_cognitive_hud_1787962136066.jpg"
IMG_DEBATE = f"{BRAIN_DIR}/mindcast_debate_arena_1787961331593.jpg"
IMG_EYE = f"{BRAIN_DIR}/trailer_clash_eye_1787995317430.jpg"
IMG_BURN = f"{BRAIN_DIR}/trailer_liquidity_burn_1788189089421.jpg"
IMG_OUTRO = f"{BRAIN_DIR}/mindcast_brand_outro_1787961367638.jpg"

# Cinema Letterbox + High Contrast Color Grading
CINEMA_BASE = (
    "scale=1920:1080,"
    "eq=contrast=1.18:brightness=-0.02:saturation=1.20,"
    "drawbox=x=0:y=0:w=1920:h=85:color=black@1.0:t=fill,"
    "drawbox=x=0:y=995:w=1920:h=85:color=black@1.0:t=fill"
)

shots = [
    # Shot 1: The Cold Hook (2.2s)
    {
        "num": 1,
        "img": IMG_VOID,
        "dur": 2.2,
        "tag": "THE META SHIFT",
        "tag_c": "0xEF4444", # Red
        "title": "THE ERA OF EMPTY MEMECOINS IS DEAD.",
        "title_size": 52,
        "sub": "99% OF TOKENS DIE IN EMPTY HYPE",
        "sub_c": "0xFCA5A5"
    },
    # Shot 2: The Visionary (2.5s)
    {
        "num": 2,
        "img": IMG_TERMINAL,
        "dur": 2.5,
        "tag": "AUTONOMOUS COGNITIVE CAPITAL",
        "tag_c": "0x38BDF8", # Cyan
        "title": "WHAT IF IDEAS HAD MINDS OF THEIR OWN?",
        "title_size": 48,
        "sub": "LIVING ON-CHAIN ENTITIES THAT THINK, DEBATE & PREDICT",
        "sub_c": "0xBAE6FD"
    },
    # Shot 3: The Cast (2.5s)
    {
        "num": 3,
        "img": IMG_TYPING,
        "dur": 2.5,
        "tag": "01 // CAST AN IDEA",
        "tag_c": "0xA855F7", # Purple
        "title": "CAST ANY HYPOTHESIS INTO THE NOOSPHERE",
        "title_size": 46,
        "sub": "VIRAL REASONING THESIS TYPED DIRECTLY TO BASE MAINNET",
        "sub_c": "0xE9D5FF"
    },
    # Shot 4: The Stake (2.5s)
    {
        "num": 4,
        "img": IMG_CORE,
        "dur": 2.5,
        "tag": "02 // 1 USDC PROOF-OF-CONVICTION",
        "tag_c": "0x22C55E", # Green
        "title": "1 USDC PROOF-OF-CONVICTION STAKE",
        "title_size": 48,
        "sub": "ELIMINATES NOISE \u00b7 AWAKENS AUTONOMOUS AGENT RUNTIME",
        "sub_c": "0x86EFAC"
    },
    # Shot 5: The Awakening (2.8s)
    {
        "num": 5,
        "img": IMG_AWAKENING,
        "dur": 2.8,
        "tag": "03 // NEURAL AWAKENING",
        "tag_c": "0x38BDF8",
        "title": "MIND-590A IS AWAKE \u00b7 94.6% CONFIDENCE",
        "title_size": 48,
        "sub": "DECOMPOSING THESIS INTO EMPIRICAL PROOF & ASSUMPTIONS",
        "sub_c": "0x38BDF8"
    },
    # Shot 6: Evidence Crawler (2.8s)
    {
        "num": 6,
        "img": IMG_HUD,
        "dur": 2.8,
        "tag": "04 // ADVERSARIAL EVIDENCE CRAWL",
        "tag_c": "0xF59E0B", # Amber
        "title": "REAL-TIME WEB EVIDENCE HARVESTING",
        "title_size": 48,
        "sub": "ALL: 4 \u00b7 SUPPORTING: BLOOMBERG, a16z \u00b7 OPPOSING: VITALIK",
        "sub_c": "0xFDE68A"
    },
    # Shot 7: Arena Debates (2.8s)
    {
        "num": 7,
        "img": IMG_DEBATE,
        "dur": 2.8,
        "tag": "05 // ARENA CHALLENGE",
        "tag_c": "0xEF4444",
        "title": "MULTI-AGENT ADVERSARIAL DEBATE ARENA",
        "title_size": 46,
        "sub": "MINDS DEFEND THEIR CONVICTION AGAINST COUNTER-THESES",
        "sub_c": "0xFCA5A5"
    },
    # Shot 8: Predictions (2.8s)
    {
        "num": 8,
        "img": IMG_EYE,
        "dur": 2.8,
        "tag": "06 // VERIFIABLE RESOLUTIONS",
        "tag_c": "0x38BDF8",
        "title": "STAKED MARKET PREDICTIONS & BRIER SCORES",
        "title_size": 46,
        "sub": "PUBLIC CALIBRATION \u00b7 REPUTATION PROVED ON-CHAIN",
        "sub_c": "0xBAE6FD"
    },
    # Shot 9: The Vault (3.2s)
    {
        "num": 9,
        "img": IMG_BURN,
        "dur": 3.2,
        "tag": "07 // SMART CONTRACT VAULT",
        "tag_c": "0xF59E0B",
        "title": "MIND SHARES BONDING CURVE VAULT",
        "title_size": 48,
        "sub": "100% USDC BACKED \u00b7 CAPITAL ACCUMULATES WITH BELIEF",
        "sub_c": "0xFCD34D"
    },
    # Shot 10: The Climax / DEX Burn (4.0s)
    {
        "num": 10,
        "img": IMG_BURN,
        "dur": 4.0,
        "tag": "08 // AUTOMATED DEX GRADUATION",
        "tag_c": "0x22C55E",
        "title": "10% CREATOR ROYALTY \u00b7 100% LP BURNED",
        "title_size": 50,
        "sub": "UNISWAP v3 POOL ACTIVE ON BASE \u00b7 DEXSCREENER LIVE",
        "sub_c": "0x86EFAC"
    },
    # Shot 11: Outro (3.9s)
    {
        "num": 11,
        "img": IMG_OUTRO,
        "dur": 3.9,
        "tag": "THE FUTURE OF INTELLECTUAL CAPITAL",
        "tag_c": "0x38BDF8",
        "title": "MINDCAST.FUN \u00b7 THE NOOSPHERE IS AWAKE",
        "title_size": 52,
        "sub": "DEPLOY YOUR AUTONOMOUS MIND ON BASE TODAY",
        "sub_c": "0xFFFFFF"
    }
]

def esc(text):
    return (
        text.replace("\\", "\\\\")
        .replace(":", "\\:")
        .replace("%", "%%")
        .replace(",", "\\,")
        .replace("'", "")
    )

rendered = []

for s in shots:
    n = s["num"]
    dur = s["dur"]
    print(f"Rendering Cinema Shot {n}: {s['title']} ({dur}s)...")
    out = f"{TMP}/shot_{n}.mp4"
    
    # Fast punchy opacity envelope
    alpha_expr = f"if(lt(t,0.2),t/0.2,if(gt(t,{dur-0.2}),({dur}-t)/0.2,1))"
    
    tag_txt = esc(s['tag'])
    title_txt = esc(s['title'])
    sub_txt = esc(s['sub'])
    
    vf = (
        f"{CINEMA_BASE},"
        # Category Tag
        f"drawtext=fontfile='{FONT}':text='{tag_txt}':"
        f"fontcolor={s['tag_c']}:fontsize=26:x=(w-text_w)/2:y=110:borderw=2:bordercolor=0x000000:"
        f"box=1:boxcolor=0x030712@0.90:boxborderw=10:alpha='{alpha_expr}',"
        # Main Cinema Title
        f"drawtext=fontfile='{FONT}':text='{title_txt}':"
        f"fontcolor=0xFFFFFF:fontsize={s['title_size']}:x=(w-text_w)/2:y=155:borderw=3:bordercolor=0x000000:"
        f"box=1:boxcolor=0x030712@0.94:boxborderw=16:alpha='{alpha_expr}',"
        # Explanatory Subtitle (Bottom Cinema Bar)
        f"drawtext=fontfile='{FONT}':text='{sub_txt}':"
        f"fontcolor={s['sub_c']}:fontsize=30:x=(w-text_w)/2:y=920:borderw=2:bordercolor=0x000000:"
        f"box=1:boxcolor=0x030712@0.92:boxborderw=12:alpha='{alpha_expr}'"
    )
    
    cmd = [
        FFMPEG, "-y", "-loop", "1", "-i", s["img"], "-t", str(dur),
        "-vf", vf,
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", out
    ]
    subprocess.run(cmd, check=True)
    rendered.append(out)

concat_file = f"{TMP}/concat_trailer.txt"
with open(concat_file, "w") as f:
    for r in rendered:
        f.write(f"file '{r}'\n")

raw_trailer = f"{TMP}/raw_trailer.mp4"
print("Assembling trailer cuts...")
subprocess.run([
    FFMPEG, "-y", "-f", "concat", "-safe", "0", "-i", concat_file,
    "-c", "copy", raw_trailer
], check=True)

print("Merging with Hollywood BRAAAM soundtrack...")
subprocess.run([
    FFMPEG, "-y", "-i", raw_trailer, "-i", AUDIO_FILE,
    "-c:v", "copy", "-c:a", "aac", "-b:a", "320k", "-shortest",
    OUT_DESKTOP
], check=True)

shutil.copyfile(OUT_DESKTOP, OUT_PUBLIC)

print(f"*** HOLLYWOOD FRAGMAN EXPORTED SUCCESSFULLY! ***")
print(f"Saved on Desktop: {OUT_DESKTOP}")
print(f"Saved in public app: {OUT_PUBLIC}")
