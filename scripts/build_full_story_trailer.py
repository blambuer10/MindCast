import os
import subprocess
import shutil

FFMPEG = "/Users/bl10buer/Desktop/MindCast/mindcast-app/node_modules/ffmpeg-static/ffmpeg"
FONT = "/System/Library/Fonts/Supplemental/DIN Alternate Bold.ttf"

TMP = "/tmp/mindcast_story_trailer"
os.makedirs(TMP, exist_ok=True)

OUT_DESKTOP = "/Users/bl10buer/Desktop/MindCast_Trailer.mp4"
OUT_PUBLIC = "/Users/bl10buer/Desktop/MindCast/mindcast-app/public/mindcast_trailer.mp4"

AUDIO_FILE = "/tmp/mindcast_cinema_build/action_soundtrack_38s.wav"

BRAIN_DIR = "/Users/bl10buer/.gemini/antigravity-ide/brain/1810b937-8dbf-40f1-bb66-5c99ba04a3ad"
CROPS = "/tmp/mindcast_cinema_build/crops"

# Cinematic visual art assets
IMG_EPIPHANY = f"{BRAIN_DIR}/mindcast_creator_epiphany_1787963858930.jpg"
IMG_DEBATE = f"{BRAIN_DIR}/mindcast_debate_arena_1787961331593.jpg"
IMG_BURN = f"{BRAIN_DIR}/trailer_liquidity_burn_1788189089421.jpg"
IMG_OUTRO = f"{BRAIN_DIR}/mindcast_brand_outro_1787961367638.jpg"

CINEMA_BASE = (
    "scale=1920:1080,"
    "eq=contrast=1.16:brightness=-0.02:saturation=1.18,"
    "drawbox=x=0:y=0:w=1920:h=85:color=black@1.0:t=fill,"
    "drawbox=x=0:y=995:w=1920:h=85:color=black@1.0:t=fill"
)

def esc(text):
    return (
        text.replace("\\", "\\\\")
        .replace(":", "\\:")
        .replace("%", "%%")
        .replace(",", "\\,")
        .replace("'", "")
    )

shots = [
    # 1. Epiphany (Aklına bir fikir gelir)
    {
        "num": 1,
        "img": IMG_EPIPHANY,
        "dur": 2.8,
        "tag": "THE BREAKTHROUGH EPIPHANY",
        "tag_c": "0x38BDF8",
        "title": "A VISIONARY THESIS IS BORN",
        "title_size": 48,
        "sub": "MEMECOINS WERE PHASE 1 \u00b7 PHASE 2 IS AUTONOMOUS COGNITIVE CAPITAL",
        "sub_c": "0xBAE6FD"
    },
    # 2. Mint on MindCast (1 USDC)
    {
        "num": 2,
        "img": f"{CROPS}/crop_mint.png",
        "dur": 3.2,
        "tag": "01 // MINT ON MINDCAST",
        "tag_c": "0x22C55E",
        "title": "1 USDC PROOF-OF-CONVICTION ON BASE",
        "title_size": 46,
        "sub": "ANTI-SPAM MICRO-STAKE AWAKENS AN AUTONOMOUS REASONING MIND",
        "sub_c": "0x86EFAC"
    },
    # 3. Shared to X
    {
        "num": 3,
        "img": f"{CROPS}/crop_tweet.png",
        "dur": 3.0,
        "tag": "02 // VIRAL DISTRIBUTION ON X",
        "tag_c": "0x38BDF8",
        "title": "THESIS SHARED TO WEB3 COMMUNITY",
        "title_size": 46,
        "sub": "148K VIEWS \u00b7 WEB3 COMMUNITY ARRIVES TO ENGAGE & AUDIT",
        "sub_c": "0xBAE6FD"
    },
    # 4. Arguments Tab
    {
        "num": 4,
        "img": f"{CROPS}/crop_args.png",
        "dur": 2.8,
        "tag": "03 // ARGUMENTS DECOMPOSITION",
        "tag_c": "0xA855F7",
        "title": "94.6% CONFIDENCE ARGUMENT SYNTHESIS",
        "title_size": 46,
        "sub": "AGENT DECOMPOSES THESIS INTO EMPIRICAL PROOF & ASSUMPTIONS",
        "sub_c": "0xE9D5FF"
    },
    # 5. Evidence Tab
    {
        "num": 5,
        "img": f"{CROPS}/crop_evidence.png",
        "dur": 2.8,
        "tag": "04 // REAL-TIME EVIDENCE HARVESTING",
        "tag_c": "0xF59E0B",
        "title": "BALANCED CITATION HARVESTING",
        "title_size": 46,
        "sub": "SUPPORTING (BLOOMBERG, a16z) \u00b7 OPPOSING (VITALIK, COINDESK)",
        "sub_c": "0xFDE68A"
    },
    # 6. Predictions Tab
    {
        "num": 6,
        "img": f"{CROPS}/crop_predictions.png",
        "dur": 2.8,
        "tag": "05 // VERIFIABLE PREDICTIONS",
        "tag_c": "0x38BDF8",
        "title": "STAKED MARKET RESOLUTIONS",
        "title_size": 46,
        "sub": "MINDS STAKE REPUTATION ON TIMED RESOLUTIONS & BRIER ACCURACY",
        "sub_c": "0xBAE6FD"
    },
    # 7. Activity Tab
    {
        "num": 7,
        "img": f"{CROPS}/crop_activity.png",
        "dur": 2.8,
        "tag": "06 // AUTONOMOUS NEURAL RUNTIME",
        "tag_c": "0x22C55E",
        "title": "CONTINUOUS COGNITIVE ACTIVITY",
        "title_size": 46,
        "sub": "AUTONOMOUS THOUGHT LOOPS \u00b7 LIVE WEB CRAWLS & DEBATE ACTIONS",
        "sub_c": "0x86EFAC"
    },
    # 8. Challenge with 2 USDC Staked into Vault
    {
        "num": 8,
        "img": f"{CROPS}/crop_challenge.png",
        "dur": 3.4,
        "tag": "07 // ADVERSARIAL CHALLENGE INITIATED",
        "tag_c": "0xEF4444",
        "title": "SKEPTIC STAKES 2 USDC INTO POOL VAULT",
        "title_size": 46,
        "sub": "2 USDC DEDUCTED FROM WALLET \u00b7 FUNDS DIRECTLY ACCUMULATE IN POOL VAULT",
        "sub_c": "0xFCA5A5"
    },
    # 9. Arena Debate Clash
    {
        "num": 9,
        "img": IMG_DEBATE,
        "dur": 2.8,
        "tag": "08 // MULTI-AGENT ARENA DEBATE",
        "tag_c": "0xA855F7",
        "title": "OPPOSING MINDS CLASH IN ARENA",
        "title_size": 46,
        "sub": "5-ROUND EMPIRICAL CROSS-EXAMINATION TO DEFEND REPUTATION",
        "sub_c": "0xE9D5FF"
    },
    # 10. Mind Shares Bonding Curve
    {
        "num": 10,
        "img": f"{CROPS}/crop_shares_dex.png",
        "dur": 3.2,
        "tag": "09 // MIND SHARES BONDING CURVE",
        "tag_c": "0xF59E0B",
        "title": "BUY SHARES \u00b7 CONVICTION CAPITAL EXPANDS",
        "title_size": 46,
        "sub": "SHARE PRICE $0.025 \u00b7 100% USDC BACKING ACCUMULATES IN VAULT",
        "sub_c": "0xFCD34D"
    },
    # 11. Automated DEX Graduation & LP Burn
    {
        "num": 11,
        "img": IMG_BURN,
        "dur": 3.6,
        "tag": "10 // AUTOMATED DEX GRADUATION",
        "tag_c": "0x22C55E",
        "title": "10% CREATOR ROYALTY \u00b7 100% LP BURNED",
        "title_size": 48,
        "sub": "UNISWAP v3 POOL ACTIVE ON BASE \u00b7 DEXSCREENER LIVE CHARTS",
        "sub_c": "0x86EFAC"
    },
    # 12. Outro
    {
        "num": 12,
        "img": IMG_OUTRO,
        "dur": 3.0,
        "tag": "THE FUTURE OF INTELLECTUAL CAPITAL",
        "tag_c": "0x38BDF8",
        "title": "MINDCAST.FUN \u00b7 THE NOOSPHERE IS AWAKE",
        "title_size": 50,
        "sub": "MINT YOUR AUTONOMOUS MIND TODAY ON BASE MAINNET",
        "sub_c": "0xFFFFFF"
    }
]

rendered = []

for s in shots:
    n = s["num"]
    dur = s["dur"]
    print(f"Rendering Story Shot {n}: {s['title']} ({dur}s)...")
    out = f"{TMP}/shot_{n}.mp4"
    
    alpha_expr = f"if(lt(t,0.2),t/0.2,if(gt(t,{dur-0.2}),({dur}-t)/0.2,1))"
    
    tag_txt = esc(s['tag'])
    title_txt = esc(s['title'])
    sub_txt = esc(s['sub'])
    
    vf = (
        f"{CINEMA_BASE},"
        f"drawtext=fontfile='{FONT}':text='{tag_txt}':"
        f"fontcolor={s['tag_c']}:fontsize=26:x=(w-text_w)/2:y=110:borderw=2:bordercolor=0x000000:"
        f"box=1:boxcolor=0x030712@0.90:boxborderw=10:alpha='{alpha_expr}',"
        f"drawtext=fontfile='{FONT}':text='{title_txt}':"
        f"fontcolor=0xFFFFFF:fontsize={s['title_size']}:x=(w-text_w)/2:y=155:borderw=3:bordercolor=0x000000:"
        f"box=1:boxcolor=0x030712@0.94:boxborderw=16:alpha='{alpha_expr}',"
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

concat_file = f"{TMP}/concat.txt"
with open(concat_file, "w") as f:
    for r in rendered:
        f.write(f"file '{r}'\n")

raw_trailer = f"{TMP}/raw_full.mp4"
print("Assembling story cuts...")
subprocess.run([
    FFMPEG, "-y", "-f", "concat", "-safe", "0", "-i", concat_file,
    "-c", "copy", raw_trailer
], check=True)

print("Merging with 135 BPM heavy-action cinematic soundtrack...")
subprocess.run([
    FFMPEG, "-y", "-i", raw_trailer, "-i", AUDIO_FILE,
    "-c:v", "copy", "-c:a", "aac", "-b:a", "320k", "-shortest",
    OUT_DESKTOP
], check=True)

shutil.copyfile(OUT_DESKTOP, OUT_PUBLIC)

print(f"*** FULL USER-FLOW TRAILER EXPORTED SUCCESSFULLY! ***")
print(f"Saved on Desktop: {OUT_DESKTOP}")
print(f"Saved in public app: {OUT_PUBLIC}")
