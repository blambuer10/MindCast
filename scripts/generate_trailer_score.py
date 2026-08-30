import math
import struct
import wave

SAMPLE_RATE = 44100
DURATION = 38.0
NUM_SAMPLES = int(SAMPLE_RATE * DURATION)
BPM = 132
BEAT_DUR = 60.0 / BPM
SIXTEENTH = BEAT_DUR / 4.0

left = [0.0] * NUM_SAMPLES
right = [0.0] * NUM_SAMPLES

def braaam(t, start_time, base_freq=38.0, duration=3.5):
    """Inception / Hans Zimmer style brass foghorn BRAAAM"""
    if t < start_time or t > (start_time + duration):
        return 0.0
    rel_t = t - start_time
    env = math.exp(-rel_t * 0.7) if rel_t > 0.2 else (rel_t / 0.2)
    # Sawtooth approximation with rich harmonics
    val = 0.0
    for h in range(1, 10):
        # Detune slightly for massive brass thickness
        val += (1.0 / h) * math.sin(2 * math.pi * base_freq * h * (1.0 + 0.003 * (h % 2)) * rel_t)
    return val * env * 0.25

def impact(t, start_time, freq=45.0, duration=2.5):
    """Deep thunderous cinematic sub drop"""
    if t < start_time or t > (start_time + duration):
        return 0.0
    rel_t = t - start_time
    env = math.exp(-rel_t * 1.8)
    return math.sin(2 * math.pi * (freq * math.exp(-rel_t * 2.0)) * rel_t) * env * 0.4

def clock_tick(t, start_time, bpm=132):
    """Ticking watch / timer sound for relentless tension"""
    if t < start_time or t > 30.0:
        return 0.0
    tick_interval = 60.0 / bpm
    rel_t = (t - start_time) % tick_interval
    if rel_t < 0.03:
        env = math.exp(-rel_t * 150.0)
        return math.sin(2 * math.pi * 1800.0 * rel_t) * env * 0.12
    return 0.0

for i in range(NUM_SAMPLES):
    t = i / SAMPLE_RATE
    
    # Master Envelope
    master_env = 1.0
    if t > 36.5:
        master_env = max(0.0, (38.0 - t) / 1.5)

    # 1. Iconic BRAAAM Hits (Start, Act 2, Act 3)
    b1 = braaam(t, 0.0, base_freq=36.0, duration=4.0)
    b2 = braaam(t, 12.0, base_freq=40.0, duration=3.5)
    b3 = braaam(t, 22.0, base_freq=45.0, duration=4.0)

    # 2. Thunderous Sub Impacts
    imp1 = impact(t, 0.0, freq=55.0)
    imp2 = impact(t, 6.5, freq=50.0)
    imp3 = impact(t, 12.0, freq=60.0)
    imp4 = impact(t, 18.0, freq=65.0)
    imp5 = impact(t, 22.0, freq=70.0)
    imp_finale1 = impact(t, 32.0, freq=48.0, duration=3.0)
    imp_finale2 = impact(t, 35.0, freq=42.0, duration=3.0)

    # 3. Relentless Ticking Clock (3.0s to 30.0s)
    tick = clock_tick(t, 3.0, bpm=BPM)

    # 4. Cinematic Driving Ostinato / 16th Synth Sequencer (12.0s to 30.0s)
    sequencer = 0.0
    if 12.0 <= t < 30.0:
        rel_seq = t - 12.0
        step = int(rel_seq / SIXTEENTH)
        note_t = rel_seq % SIXTEENTH
        notes = [73.42, 82.41, 98.00, 110.00, 73.42, 82.41, 123.47, 110.00]
        freq = notes[step % len(notes)]
        seq_env = math.exp(-note_t * 22.0)
        # Intensity builds towards 30s
        crescendo = min(1.0, 0.4 + 0.6 * (rel_seq / 18.0))
        sequencer = (
            0.20 * math.sin(2 * math.pi * freq * rel_seq) +
            0.10 * math.sin(2 * math.pi * freq * 2 * rel_seq)
        ) * seq_env * crescendo

    # 5. Rising Shepard Tone Riser (20.0s to 30.0s)
    riser = 0.0
    if 20.0 <= t < 30.0:
        rel_r = t - 20.0
        r_prog = rel_r / 10.0
        f_rise = 180.0 + r_prog * 750.0
        riser = 0.08 * math.sin(2 * math.pi * f_rise * rel_r) * (r_prog ** 1.8)

    # 6. Dead Silence before the Revelation (30.0s - 32.0s)
    if 30.0 <= t < 32.0:
        # Complete audio dropout with faint high frequency ear-ring
        ring_t = t - 30.0
        l_mix = 0.015 * math.sin(2 * math.pi * 3800.0 * ring_t) * math.exp(-ring_t * 1.5)
        r_mix = l_mix
    else:
        # General mix
        pan = 0.5 + 0.25 * math.sin(2 * math.pi * 0.8 * t)
        total_mono = b1 + b2 + b3 + imp1 + imp2 + imp3 + imp4 + imp5 + imp_finale1 + imp_finale2 + tick
        l_mix = (total_mono * 0.5 + sequencer * (1.0 - pan) + riser * 0.5) * master_env
        r_mix = (total_mono * 0.5 + sequencer * pan + riser * 0.5) * master_env

    left[i] = max(-0.96, min(0.96, l_mix))
    right[i] = max(-0.96, min(0.96, r_mix))

out_wav = "/tmp/mindcast_film_build/trailer_score.wav"
with wave.open(out_wav, "w") as wav_file:
    wav_file.setnchannels(2)
    wav_file.setsampwidth(2)
    wav_file.setframerate(SAMPLE_RATE)
    frames = bytearray()
    for l, r in zip(left, right):
        frames.extend(struct.pack("<hh", int(l * 32767.0), int(r * 32767.0)))
    wav_file.writeframes(frames)

print(f"Generated 38s Hollywood Trailer Score: {out_wav}")
