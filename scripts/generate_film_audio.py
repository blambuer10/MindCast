import math
import struct
import wave

SAMPLE_RATE = 44100
DURATION = 42.0
NUM_SAMPLES = int(SAMPLE_RATE * DURATION)

left = [0.0] * NUM_SAMPLES
right = [0.0] * NUM_SAMPLES

for i in range(NUM_SAMPLES):
    t = i / SAMPLE_RATE
    
    # -------------------------------------------------------------
    # SECTION 1: THE VOID (0.0s - 4.5s)
    # Subtle biological heartbeat pulse in silence
    # -------------------------------------------------------------
    if t < 4.5:
        # Heartbeat pulse every 1.2 seconds
        beat_t = t % 1.2
        pulse = math.exp(-beat_t * 12.0) * math.sin(2 * math.pi * 48.0 * beat_t)
        drone = 0.04 * math.sin(2 * math.pi * 55.0 * t) * (t / 4.5)
        val = pulse * 0.18 + drone
        left[i] = val
        right[i] = val

    # -------------------------------------------------------------
    # SECTION 2: BIRTH & AWAKENING (4.5s - 10.5s)
    # Heartbeat fades into delicate crystalline textures & warm sub
    # -------------------------------------------------------------
    elif t < 10.5:
        rel_t = t - 4.5
        sub = 0.12 * math.sin(2 * math.pi * 55.0 * t) + 0.06 * math.sin(2 * math.pi * 110.0 * t)
        # Delicate crystalline glass harmonics
        chime1 = 0.04 * math.sin(2 * math.pi * 587.33 * t) * (0.5 + 0.5 * math.sin(2 * math.pi * 0.8 * rel_t))
        chime2 = 0.03 * math.sin(2 * math.pi * 880.00 * t) * (0.5 + 0.5 * math.cos(2 * math.pi * 0.6 * rel_t))
        val_l = sub + chime1
        val_r = sub + chime2
        left[i] = val_l
        right[i] = val_r

    # -------------------------------------------------------------
    # SECTION 3: OBSERVING THE WORLD (10.5s - 17.0s)
    # Flowing ethereal data ribbons, fluid harmonic pads
    # -------------------------------------------------------------
    elif t < 17.0:
        rel_t = t - 10.5
        sub = 0.14 * math.sin(2 * math.pi * 65.41 * t) # C2
        pad = (
            0.08 * math.sin(2 * math.pi * 130.81 * t) +
            0.05 * math.sin(2 * math.pi * 196.00 * t) +
            0.04 * math.sin(2 * math.pi * 261.63 * t)
        )
        sweep = 0.03 * math.sin(2 * math.pi * (300 + 100 * math.sin(2 * math.pi * 0.3 * rel_t)) * t)
        pan = 0.5 + 0.3 * math.sin(2 * math.pi * 0.4 * rel_t)
        left[i] = sub + pad * (1.0 - pan) + sweep * 0.5
        right[i] = sub + pad * pan + sweep * 0.5

    # -------------------------------------------------------------
    # SECTION 4: CONFLICT / DEBATE (17.0s - 24.5s)
    # Layered tension, two alternating harmonic frequencies testing each other
    # -------------------------------------------------------------
    elif t < 24.5:
        rel_t = t - 17.0
        tension_build = min(1.0, rel_t / 7.0)
        sub = 0.16 * math.sin(2 * math.pi * 48.99 * t) # G1
        # Interrogating harmonic pulses
        f1_pulse = (math.sin(2 * math.pi * 1.5 * rel_t) > 0.3) * 0.07 * math.sin(2 * math.pi * 220.0 * t)
        f2_pulse = (math.cos(2 * math.pi * 1.5 * rel_t) > 0.3) * 0.07 * math.sin(2 * math.pi * 293.66 * t)
        riser = 0.04 * math.sin(2 * math.pi * (200 + rel_t * 60) * t) * tension_build
        left[i] = sub + f1_pulse + riser * 0.6
        right[i] = sub + f2_pulse + riser * 0.6

    # -------------------------------------------------------------
    # SECTION 5: EMERGENCE & VALUE (24.5s - 32.5s)
    # Expansive cinematic soundscape, resonant beauty, building to peak
    # -------------------------------------------------------------
    elif t < 32.5:
        rel_t = t - 24.5
        fade_out = 1.0 if rel_t < 6.5 else max(0.0, (8.0 - rel_t) / 1.5)
        # Deep cathedral chord in D
        chord = (
            0.18 * math.sin(2 * math.pi * 73.42 * t) +   # D2
            0.10 * math.sin(2 * math.pi * 146.83 * t) +  # D3
            0.08 * math.sin(2 * math.pi * 220.00 * t) +  # A3
            0.06 * math.sin(2 * math.pi * 370.00 * t) +  # F#4
            0.04 * math.sin(2 * math.pi * 440.00 * t)    # A4
        ) * fade_out
        left[i] = chord
        right[i] = chord

    # -------------------------------------------------------------
    # SECTION 6: THE SILENCE (32.5s - 35.5s)
    # Complete, profound silence before the revelation
    # -------------------------------------------------------------
    elif t < 35.5:
        left[i] = 0.0
        right[i] = 0.0

    # -------------------------------------------------------------
    # SECTION 7: FINAL REVEAL (35.5s - 42.0s)
    # Single elegant, crystalline sub-bass impact blooming and decaying
    # -------------------------------------------------------------
    else:
        impact_t = t - 35.5
        # Deep low impact transient + crystalline bell shimmer
        decay = math.exp(-impact_t * 0.75)
        sub_bloom = 0.22 * math.sin(2 * math.pi * 43.65 * impact_t) * decay
        harmonic_bloom = 0.08 * math.sin(2 * math.pi * 130.81 * impact_t) * decay
        chime_bloom = 0.04 * math.sin(2 * math.pi * 523.25 * impact_t) * math.exp(-impact_t * 1.5)
        val = sub_bloom + harmonic_bloom + chime_bloom
        left[i] = val
        right[i] = val

# Normalize and write WAV
out_wav = "/tmp/mindcast_video_build/film_score.wav"
with wave.open(out_wav, "w") as wav_file:
    wav_file.setnchannels(2)
    wav_file.setsampwidth(2)
    wav_file.setframerate(SAMPLE_RATE)
    frames = bytearray()
    for l, r in zip(left, right):
        cl = max(-0.95, min(0.95, l))
        cr = max(-0.95, min(0.95, r))
        frames.extend(struct.pack("<hh", int(cl * 32767.0), int(cr * 32767.0)))
    wav_file.writeframes(frames)

print(f"Master cinematic score synthesized: {out_wav} ({DURATION}s)")
