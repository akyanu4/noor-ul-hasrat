"""Urdu voices: Kokoro Hindi voices read the Devanagari line; each line's emotion sets speed, pitch and loudness.
Writes build_ur/audio/*.wav and build_ur/timeline.json (same format as voices.py)."""
import os, json, subprocess, hashlib
import soundfile as sf
import voices as V          # reuse sfx(), envelope(), dur()
import story_ur as story

SR = 24000
OUT = 'build_ur/audio'; os.makedirs(OUT, exist_ok=True)
V.OUT = 'build/audio'; os.makedirs(V.OUT, exist_ok=True)   # sfx cache shared with the English pilot
VOICE = {  # who: (voice, pitch, speed)
    'N': ('hf_alpha', 1.0, 0.94), 'ALI': ('hf_beta', 1.16, 1.0), 'MARYAM': ('hf_alpha', 1.30, 1.0),
    'NANA': ('hm_omega', 0.94, 0.88)}
EMO = {  # emotion: (speed x, pitch x, volume)
    'neutral': (1.0, 1.0, 1.0), 'warm': (0.96, 1.0, 1.0), 'gentle': (0.92, 1.01, 0.9),
    'excited': (1.1, 1.05, 1.08), 'surprised': (1.12, 1.07, 1.1), 'happy': (1.04, 1.03, 1.0),
    'laugh': (1.06, 1.05, 1.05), 'proud': (0.97, 1.01, 1.0),
    'sad': (0.86, 0.97, 0.85), 'worried': (0.88, 0.98, 0.82), 'tired': (0.88, 0.98, 0.9),
    'thoughtful': (0.92, 1.0, 0.95)}
_k = None


def tts(who, speech, emo):
    global _k
    v, p, sp = VOICE[who]; es, ep, ev = EMO[emo]
    p, sp = p * ep, sp * es
    key = hashlib.md5(f'{v}|{p:.3f}|{sp:.3f}|{ev}|{speech}'.encode()).hexdigest()[:12]
    f = f'{OUT}/{who}_{key}.wav'
    if not os.path.exists(f):
        if _k is None:
            from kokoro_onnx import Kokoro
            _k = Kokoro('models/kokoro-v1.0.int8.onnx', 'models/voices-v1.0.bin')
        s, sr = _k.create(speech, voice=v, speed=sp, lang='hi')
        raw = f + '.raw.wav'; sf.write(raw, s, sr)
        af = f'asetrate={sr}*{p:.4f},aresample={SR},atempo={1/p:.4f}' if abs(p - 1) > 1e-3 else f'aresample={SR}'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', raw, '-af',
                        af + f',silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,'
                        f'loudnorm=I=-17:TP=-2,volume={ev}', '-ar', str(SR), '-ac', '1', f], check=True)
        os.remove(raw)
    return f


def laugh():
    return tts('MARYAM', 'ही ही ही!', 'laugh')


def build():
    t = 0.0; shots = []
    for name, beats in story.SHOTS:
        st = t; bl = []
        for b in beats:
            if b[0] == 'wait': t += b[1]; continue
            if b[0] == 'say':
                _, who, text, speech, emo = b
                f = tts(who, speech, emo); d = V.dur(f)
                bl.append({'kind': 'say', 'who': who, 'text': text, 'emo': emo, 'file': f, 't': t, 'd': d, 'env': V.envelope(f)})
                t += d + 0.25
            elif b[0] == 'sfx':
                f = laugh() if b[1] == 'laugh' else V.sfx(b[1]); d = V.dur(f)
                bl.append({'kind': 'sfx', 'name': b[1], 'file': f, 't': t, 'd': d, 'env': V.envelope(f)})
                t += min(d, 1.0) if b[1] != 'lap' else 0.2
        shots.append({'name': name, 't0': st, 't1': t, 'beats': bl})
    json.dump({'shots': shots, 'total': t}, open('build_ur/timeline.json', 'w'), ensure_ascii=False)
    return shots, t


if __name__ == '__main__':
    shots, total = build()
    for s in shots: print(f"{s['name']:8s} {s['t0']:6.1f}-{s['t1']:6.1f}  {len(s['beats'])} beats")
    print('total', round(total, 1))
