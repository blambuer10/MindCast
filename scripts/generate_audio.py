import math
import struct
import wave

SAMPLE_RATE = 44100
DURATION = 27.5
NUM_SAMPLES = int(SAMPLE_RATE * DURATION)
BPM = 126
BEAT_DUR = 60.0 / BPM
SIXTEENTH = BEAT_DUR / 4.0

# Driving melodic sequence in F# minor (dark, epic, driving)
# F#2, C#3, F#3, A3, B3, C#4, E4, F#4
ARP_NOTES = [185.00, 277.18, 369.99, 440.00, 493.88, 554.37, 493.88, 440.00]
BASS_NOTES = [92.50, 92.50, 82.41, 73.42] # F#, F#, E, D

left_samples = [0.0] * NUM_SAMPLES
right_samples = [0.0] * NUM_SAMPLES

for i in range(NUM_SAMPLES):
    t = i / SAMPLE_RATE
    
    # Master volume envelope
    env_master = 1.0
    if t < 0.8:
        env_master = t / 0.8
    elif t > (DURATION - 2.5):
        env_master = max(0.0, (DURATION - t) / 2.5)

    # 1. Hard Sidechained Synth Kick & Bass Pump (every quarter note)
    beat_time = t % BEAT_DUR
    pump = (math.sin(math.pi * (beat_time / BEAT_DUR))) ** 1.3
    bass_idx = int(t / (BEAT_DUR * 4)) % len(BASS_NOTES)
    fbass = BASS_NOTES[bass_idx]
    
    # Bass synth with resonant grit
    bass = (
        0.32 * math.sin(2 * math.pi * fbass * t) +
        0.18 * math.sin(2 * math.pi * fbass * 2 * t) +
        0.10 * math.sin(2 * math.pi * fbass * 3 * t)
    ) * pump

    # 2. Fast 16th-note Driving Arpeggiator with filter sweep
    step = int(t / SIXTEENTH)
    note_time = t % SIXTEENTH
    f_arp = ARP_NOTES[step % len(ARP_NOTES)]
    decay = math.exp(-note_time * 22.0)
    sweep = 1.0 + 0.5 * math.sin(2 * math.pi * 0.2 * t)
    arp = (
        0.20 * math.sin(2 * math.pi * f_arp * t) +
        0.12 * math.sin(2 * math.pi * f_arp * 2 * t * sweep) +
        0.06 * math.sin(2 * math.pi * f_arp * 3 * t)
    ) * decay

    # 3. Sub-bass Drone Floor
    sub = 0.16 * math.sin(2 * math.pi * 46.25 * t) + 0.08 * math.sin(2 * math.pi * 92.5 * t)

    # 4. Stereo Ping-Pong Panning
    pan = 0.5 + 0.38 * math.sin(2 * math.pi * 1.5 * t)
    
    # 5. Epic Cyberpunk Tension Riser
    riser_freq = 250 + (t / DURATION) * 800
    riser = 0.05 * math.sin(2 * math.pi * riser_freq * t) * (t / DURATION)

    # Combine channels
    l_val = (bass * 0.55 + sub * 0.45 + arp * (1.0 - pan) + riser * 0.7) * env_master
    r_val = (bass * 0.55 + sub * 0.45 + arp * pan + riser * 0.7) * env_master

    # Master limiter
    left_samples[i] = max(-0.95, min(0.95, l_val))
    right_samples[i] = max(-0.95, min(0.95, r_val))

# Write 16-bit stereo WAV
wav_path = "/tmp/mindcast_video_build/cyberpunk_synth.wav"
with wave.open(wav_path, "w") as wav_file:
    wav_file.setnchannels(2)
    wav_file.setsampwidth(2)
    wav_file.setframerate(SAMPLE_RATE)
    
    frames = bytearray()
    for l, r in zip(left_samples, right_samples):
        il = int(l * 32767.0)
        ir = int(r * 32767.0)
        frames.extend(struct.pack("<hh", il, ir))
    wav_file.writeframes(frames)

print(f"Synthesized new 27.5s epic stereo soundtrack: {wav_path}")
