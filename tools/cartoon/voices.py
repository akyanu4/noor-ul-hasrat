"""Make every line's audio with Kokoro (free, offline), pitch the children up, and build simple sound effects."""
import os, json, subprocess, numpy as np, soundfile as sf, hashlib
from kokoro_onnx import Kokoro
import story
SR = 24000
OUT = 'build/audio'; os.makedirs(OUT, exist_ok=True)
VOICE = {  # who: (kokoro voice, pitch factor, speed) -- Hindi voices speak Hindustani/Urdu from Devanagari
    'N': ('hf_beta', 1.0, 0.92), 'ALI': ('hf_alpha', 1.15, 1.0), 'MARYAM': ('hf_beta', 1.3, 1.02),
    'NANA': ('hm_omega', 0.95, 0.88), 'KID_LAUGH': ('hf_beta', 1.3, 1.0)}
EMO_VOICE = {  # emotion: (speed x, pitch x, volume)
    'excited': (1.08, 1.05, 1.0), 'happy': (1.03, 1.02, 1.0), 'surprised': (1.05, 1.06, 1.0), 'laugh': (1.05, 1.04, 1.0),
    'sad': (0.86, 0.97, 0.85), 'worried': (0.92, 1.0, 0.9), 'tired': (0.88, 0.97, 0.9), 'warm': (0.96, 1.0, 1.0), 'proud': (0.97, 1.0, 1.0)}
_k = None
def tts(who, text, emo='neutral'):
    global _k
    v, p, sp = VOICE[who]; es, ep, ev = EMO_VOICE.get(emo, (1, 1, 1)); sp *= es; p *= ep
    key = hashlib.md5(f'{v}|{p}|{sp}|{ev}|{text}'.encode()).hexdigest()[:12]
    f = f'{OUT}/{who}_{key}.wav'
    if not os.path.exists(f):
        if _k is None: _k = Kokoro('models/kokoro-v1.0.int8.onnx', 'models/voices-v1.0.bin')
        lang = 'hi' if v[0] == 'h' else ('en-gb' if v.startswith('b') else 'en-us')
        s, sr = _k.create(text, voice=v, speed=sp, lang=lang)
        raw = f + '.raw.wav'; sf.write(raw, s, sr)
        af = f'asetrate={sr}*{p:.4f},aresample={SR},atempo={1/p:.4f}' if p != 1.0 else f'aresample={SR}'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', raw, '-af', af + f',loudnorm=I=-17:TP=-2,volume={ev}', '-ar', str(SR), '-ac', '1', f], check=True)
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
        return tts('KID_LAUGH', 'ही ही ही!', 'laugh')
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
    t = 0.0; shots = []; ri = 0
    for name, beats in story.SHOTS:
        st = t; bl = []
        for b in beats:
            if b[0] == 'wait': t += b[1]; continue
            if b[0] == 'say':
                who, emo, cap, spoken = b[1], b[2], b[3], b[4]
                if getattr(story, 'CAPTIONS', '') == 'roman': cap = story.ROMAN[ri]
                ri += 1
                f = tts(who, spoken, emo); d = dur(f)
                bl.append({'kind': 'say', 'who': who, 'emo': emo, 'text': cap, 'file': f, 't': t, 'd': d, 'env': envelope(f)}); t += d + 0.3
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
