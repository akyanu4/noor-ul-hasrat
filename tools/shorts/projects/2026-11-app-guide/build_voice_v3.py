"""Version 3 narration: splice the new lines (AI Studio, voice Daro, style "Friendly"; audio/v3_lines/*.wav) into the
version 2 narration at the places script.md "# Version 3" gives, so the old lines keep their exact takes.
    python3 build_voice_v3.py      -> audio/voice_short_v3.wav, audio/voice_long_v3.wav, work/splice_<A|B>.json
Each new line is cut to its speech (10 ms RMS over -45 dBFS, 40 ms kept either side), gain-matched to the integrated
loudness of the version 2 file it goes into, and placed in the middle of a version 2 pause between lines with GAP s of
silence on each side (on top of what is left of the v2 pause). Removed: B2 line 14 (replaced by 14a-d). Cut points are mid-pause times of the v2 files
(ffmpeg silencedetect -38 dB, d 0.3)."""
import json, os, re, subprocess, wave
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); AU = os.path.join(HERE, 'audio'); SR = 24000
GAP = 0.3   # added to the ~0.35-0.4 s half-pause left each side of a cut: ~0.65-0.7 s v2-to-new, 0.6 s new-to-new

def read(p):
    with wave.open(p) as w:
        assert w.getframerate() == SR and w.getnchannels() == 1 and w.getsampwidth() == 2, p
        return np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(np.float32)
def write(p, x):
    with wave.open(p, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(np.clip(np.round(x), -32768, 32767).astype('<i2').tobytes())
def lufs(p):
    err = subprocess.run(['ffmpeg', '-hide_banner', '-i', p, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(re.findall(r'I:\s+(-?[\d.]+) LUFS', err)[-1])
def speech(x, db=-45, keep=0.04):
    n = int(0.01 * SR); r = np.sqrt(np.convolve(x ** 2, np.ones(n) / n, 'same')); on = np.where(r > 32768 * 10 ** (db / 20))[0]
    a, b = max(0, on[0] - int(keep * SR)), min(len(x), on[-1] + int(keep * SR)); return x[a:b]
def squeeze(x, maxp, db=-45):
    """Shorten pauses inside a line (runs under db, 10 ms RMS) to maxp seconds, cutting from their middle."""
    n = int(0.01 * SR); r = np.sqrt(np.convolve(x ** 2, np.ones(n) / n, 'same')) <= 32768 * 10 ** (db / 20)
    keep = np.ones(len(x), bool); i = 0; m = int(maxp * SR)
    while i < len(x):
        if r[i]:
            j = i
            while j < len(x) and r[j]: j += 1
            if j - i > m: c = (i + j) // 2; keep[c - (j - i - m) // 2: c + (j - i - m + 1) // 2] = False
            i = j
        else: i += 1
    return x[keep]
def line(name, target, maxp=None):
    p = os.path.join(AU, 'v3_lines', name + '.wav'); x = speech(read(p)); x = squeeze(x, maxp) if maxp else x; tmp = p + '.cut.wav'; write(tmp, x)
    g = target - lufs(tmp); os.remove(tmp); return x * 10 ** (g / 20), g
sil = lambda s: np.zeros(int(round(s * SR)), np.float32)
S = lambda t: int(round(t * SR))

def build(v2, cuts, out, maxp=None, gap=GAP):
    """cuts: list of (cut_time_in_v2, end_of_removed_part_or_None, [new line names]). New lines go in at cut_time."""
    x = read(os.path.join(AU, v2)); target = lufs(os.path.join(AU, v2)); parts, pos, t, log, keep = [], 0, 0.0, [], []
    for c, skip_to, names in cuts:
        seg = x[S(pos):S(c)]; parts.append(seg); keep.append([pos, c, round(t, 4)]); t += len(seg) / SR
        for nm in names:
            y, g = line(nm, target, maxp); parts += [sil(gap), y, sil(gap)]; log.append((nm, round(t + gap, 2), round(t + gap + len(y) / SR, 2), round(g, 1))); t += 2 * gap + len(y) / SR
        pos = skip_to if skip_to is not None else c
    seg = x[S(pos):]; parts.append(seg); keep.append([pos, len(x) / SR, round(t, 4)])
    y = np.concatenate(parts); write(os.path.join(AU, out), y)
    # for align.py / storyboard.js / captions.py: which v2 stretches were kept and where they now start, where the new lines are
    os.makedirs(os.path.join(HERE, 'work'), exist_ok=True)
    json.dump({'v2': v2, 'kept': keep, 'new': {l[0]: [l[1], l[2]] for l in log}}, open(os.path.join(HERE, 'work', 'splice_' + ('A' if 'short' in out else 'B') + '.json'), 'w'), indent=1)
    print(out, f'{len(y) / SR:.2f}s, target {target:.1f} LUFS'); [print('  ', *l) for l in log]

if __name__ == '__main__':
    # v2 pauses: Short line 5|6 21.57-22.39, 9|10 41.30-42.06; walkthrough 11|12 68.75-69.33, 13|14 79.95-80.39, 14|15 86.09-86.47
    build('voice_short_v2_daro.wav', [(21.98, None, ['A6', 'A7']), (41.68, None, ['A12'])], 'voice_short_v3.wav',
          maxp=0.42, gap=0.22)   # the Short: pauses inside new lines capped at 0.42 s and a little less added, to stay within 75 s with its cards
    build('voice_long_v2_daro.wav', [(69.04, None, ['B11b']), (80.17, 86.28, ['B14a', 'B14b', 'B14c', 'B14d'])], 'voice_long_v3.wav')
