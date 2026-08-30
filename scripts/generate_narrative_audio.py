import math
import struct
import wave

SAMPLE_RATE = 44100
DURATION = 34.0
NUM_SAMPLES = int(SAMPLE_RATE * DURATION)
BPM = 126
BEAT_DUR = 60.0 / BPM
SIXTEENTH = BEAT_DUR / 4.0

ARP_NOTES = [185.00, 277.18, 369.99, 440.00, 493.88, 554.37, 493.88, 440.00]
BASS_NOTES = [92.50, 92.50, 82.41, 73.42]

left = [0.0] * NUM_SAMPLES
right = [0.0] * NUM_SAMPLES

for i in range(NUM_SAMPLES):
    t = i / SAMPLE_RATE
    
    # Volume envelope
    env = 1.0
    if t < 0.6:
        env = t / 0.6
    elif t > (DURATION - 2.0):
        env = max(0.0, (DURATION - t) / 2.0)

    # 1. Pulsing Kick & Bass
    beat_time = t % BEAT_DUR
    pump = (math.sin(math.pi * (beat_time / BEAT_DUR))) ** 1.3
    bass_idx = int(t / (BEAT_DUR * 4)) % len(BASS_NOTES)
    fbass = BASS_NOTES[bass_idx]
    bass = (
        0.30 * math.sin(2 * math.pi * fbass * t) +
        0.15 * math.sin(2 * math.pi * fbass * 2 * t)
    ) * pump

    # 2. 16th-note Arpeggio
    step = int(t / SIXTEENTH)
    note_time = t % SIXTEENTH
    f_arp = ARP_NOTES[step % len(ARP_NOTES)]
    decay = math.exp(-note_time * 20.0)
    arp = (0.22 * math.sin(2 * math.pi * f_arp * t) + 0.10 * math.sin(2 * math.pi * f_arp * 2 * t)) * decay

    # 3. Sub-bass Drone
    sub = 0.16 * math.sin(2 * math.pi * 46.25 * t)

    # 4. Riser / Climax building towards Scene 6 (Coming Soon)
    riser = 0.05 * math.sin(2 * math.pi * (250 + (t / DURATION) * 600) * t) * (t / DURATION)
    pan = 0.5 + 0.35 * math.sin(2 * math.pi * 1.2 * t)

    # Final logo drop at t > 29.5s: deep cinematic gong impact
    if t >= 29.5:
        impact_t = t - 29.5
        impact = 0.25 * math.sin(2 * math.pi * 50.0 * impact_t) * math.exp(-impact_t * 0.8)
        bass = bass * 0.3
        arp = arp * 0.2
    else:
        impact = 0.0

    l_val = (bass * 0.5 + sub * 0.5 + arp * (1.0 - pan) + riser * 0.5 + impact) * env
    r_val = (bass * 0.5 + sub * 0.5 + arp * pan + riser * 0.5 + impact) * env

    left[i] = max(-0.95, min(0.95, l_val))
    right[i] = max(-0.95, min(0.95, r_val))

out_wav = "/tmp/mindcast_film_build/narrative_audio.wav"
with wave.open(out_wav, "w") as wav_file:
    wav_file.setnchannels(2)
    wav_file.setsampwidth(2)
    wav_file.setframerate(SAMPLE_RATE)
    frames = bytearray()
    for l, r in zip(left, right):
        frames.extend(struct.pack("<hh", int(l * 32767.0), int(r * 32767.0)))
    wav_file.writeframes(frames)

print(f"Generated 34s narrative audio: {out_wav}")
