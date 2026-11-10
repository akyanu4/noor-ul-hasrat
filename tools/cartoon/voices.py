"""Make every line's audio with Kokoro (free, offline), pitch the children up, and build simple sound effects."""
import os, json, subprocess, numpy as np, soundfile as sf, hashlib
from kokoro_onnx import Kokoro
import story
SR = 24000
OUT = 'build/audio'; os.makedirs(OUT, exist_ok=True)
VOICE = {  # who: (kokoro voice, pitch factor, speed)
    'N': ('af_heart', 1.0, 0.95), 'ALI': ('af_sky', 1.16, 1.0), 'MARYAM': ('af_bella', 1.28, 1.0),
    'NANA': ('bm_george', 0.92, 0.9), 'KID_LAUGH': ('af_bella', 1.3, 1.0)}
_k = None
def tts(who, text):
    global _k
    v, p, sp = VOICE[who]
    key = hashlib.md5(f'{v}|{p}|{sp}|{text}'.encode()).hexdigest()[:12]
    f = f'{OUT}/{who}_{key}.wav'
    if not os.path.exists(f):
        if _k is None: _k = Kokoro('models/kokoro-v1.0.int8.onnx', 'models/voices-v1.0.bin')
        s, sr = _k.create(text, voice=v, speed=sp, lang='en-gb' if v.startswith('b') else 'en-us')
        raw = f + '.raw.wav'; sf.write(raw, s, sr)
        af = f'asetrate={sr}*{p},aresample={SR},atempo={1/p:.4f}' if p != 1.0 else f'aresample={SR}'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', raw, '-af', af + ',loudnorm=I=-17:TP=-2', '-ar', str(SR), '-ac', '1', f], check=True)
        os.remove(raw)
    return f

def sfx(name):
    f = f'{OUT}/sfx_{name}.wav'
    if os.path.exists(f): return f
    rng = np.random.default_rng(1)
    if name.startswith('meow'):
        txt = 'Meeow...' if name == 'meow_weak' else 'Meow!'
        s, _ = sf.read(tts_raw('af_kore', txt, 1.0))
        p = 1.55 if name == 'meow_happy' else 1.45
        tmp = f + '.t.wav'; sf.write(tmp, s, SR)
        vol = '0.55' if name == 'meow_weak' else '1.0'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-af', f'asetrate={SR}*{p},aresample={SR},atempo={1/p:.3f},volume={vol}', f], check=True); os.remove(tmp)
        return f
    if name == 'lap':        # little lapping clicks
        d = 2.6; x = np.zeros(int(SR * d))
        for i in range(14):
            t0 = int(SR * (0.1 + i * 0.18 + rng.uniform(-0.02, 0.02))); n = int(SR * 0.05)
            env = np.exp(-np.linspace(0, 9, n)); x[t0:t0 + n] += 0.35 * env * np.sin(2 * np.pi * rng.uniform(900, 1400) * np.arange(n) / SR) * rng.uniform(.6, 1)
        sf.write(f, x, SR); return f
    if name == 'purr':
        d = 2.2; t = np.arange(int(SR * d)) / SR
        noise = rng.normal(0, 1, len(t)); lp = np.convolve(noise, np.ones(60) / 60, 'same')
        x = 0.5 * lp * (0.55 + 0.45 * np.sin(2 * np.pi * 24 * t)) * np.minimum(1, np.minimum(t, d - t) * 3)
        sf.write(f, x / (np.abs(x).max() + 1e-9) * 0.25, SR); return f
    if name == 'laugh':
        return tts('KID_LAUGH', 'Hee hee hee!')
    raise KeyError(name)

def tts_raw(v, text, sp):
    global _k
    if _k is None: _k = Kokoro('models/kokoro-v1.0.int8.onnx', 'models/voices-v1.0.bin')
    s, sr = _k.create(text, voice=v, speed=sp, lang='en-us')
    f = f'{OUT}/raw_{hashlib.md5((v+text).encode()).hexdigest()[:8]}.wav'; sf.write(f, s, sr); return f

def dur(f): return sf.info(f).duration

def envelope(f, fps=24):
    s, sr = sf.read(f); s = s if s.ndim == 1 else s.mean(1)
    hop = sr // fps; n = len(s) // hop + 1
    e = np.array([np.sqrt(np.mean(s[i * hop:(i + 1) * hop] ** 2)) if i * hop < len(s) else 0 for i in range(n)])
    m = np.percentile(e, 95) + 1e-9
    return np.clip(e / m, 0, 1).tolist()

def build():
    """Timeline: for each shot, beats with absolute start times. Returns (shots, total)."""
    t = 0.0; shots = []
    for name, beats in story.SHOTS:
        st = t; bl = []
        for b in beats:
            if b[0] == 'wait': t += b[1]; continue
            if b[0] == 'say':
                f = tts(b[1], b[2]); d = dur(f)
                bl.append({'kind': 'say', 'who': b[1], 'text': b[2], 'file': f, 't': t, 'd': d, 'env': envelope(f)}); t += d + 0.25
            elif b[0] == 'sfx':
                f = sfx(b[1]); d = dur(f)
                bl.append({'kind': 'sfx', 'name': b[1], 'file': f, 't': t, 'd': d, 'env': envelope(f)})
                t += min(d, 1.0) if b[1] != 'lap' else 0.2
        shots.append({'name': name, 't0': st, 't1': t, 'beats': bl})
    json.dump({'shots': shots, 'total': t}, open('build/timeline.json', 'w'))
    return shots, t

if __name__ == '__main__':
    shots, total = build()
    for s in shots: print(f"{s['name']:8s} {s['t0']:6.1f}-{s['t1']:6.1f}  {len(s['beats'])} beats")
    print('total', round(total, 1))
