"""Map script lines to narration times: ffmpeg silencedetect gives the pauses; a small DP puts each line boundary on a
pause so line durations follow line lengths (characters), preferring the longer pauses that end Urdu sentences (۔).
    python3 align.py A|B   -> prints and writes work/times_<A|B>.json  [[start, end], ...] per script line
Version 2 (script.md "## A2." / "## B2.", everyday Urdu with English words; voice "Daro") is the default; NOOR_V=1 for
the first version."""
import json, os, re, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
URL_UR = 'نورالحسرت ڈاٹ ورسل ڈاٹ ایپ'
V = os.environ.get('NOOR_V', '2')
WAV = {('1', 'A'): 'voice_short.wav', ('1', 'B'): 'voice_long.wav', ('2', 'A'): 'voice_short_v2_daro.wav', ('2', 'B'): 'voice_long_v2_daro.wav'}
def wav_path(sec): return os.path.join(HERE, 'audio', WAV[(V, sec)])

# Checked by ear-free arithmetic (speaking rate ~13 characters/s and where the pauses fall): line i ends at the pause
# that starts near this time, the next line starts when that pause ends. Version 2 walkthrough: line 1 also holds
# "chaliye dekhte hain..." (the DP ended it too early), and the pauses between Tawbah, Khatrat, Tasawwur, Sabr pulled
# line 6 past "har Short WhatsApp par share kijiye".
FIX = {('2', 'B'): {1: 5.41, 6: 38.78, 7: 40.63}}

def script_lines(sec):
    txt = open(os.path.join(HERE, 'script.md'), encoding='utf-8').read()
    if V == '2': part = txt.split('## A2.')[1].split('## B2.')[0] if sec == 'A' else txt.split('## B2.')[1]
    else: part = txt.split('## A.')[1].split('## B.')[0] if sec == 'A' else txt.split('## B.')[1].split('# Version 2')[0]
    return [m.group(1).strip() for m in re.finditer(r'^\d+\.\s+(.*)$', part, re.M)]

def gaps(wav, noise='-38dB', d=0.3):
    err = subprocess.run(['ffmpeg', '-hide_banner', '-i', wav, '-af', f'silencedetect=noise={noise}:d={d}', '-f', 'null', '-'], capture_output=True, text=True).stderr
    s = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', err)]; e = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', err)]
    return list(zip(s, e))

def duration(wav):
    return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav], capture_output=True, text=True).stdout)

def align(sec):
    wav = wav_path(sec)
    lines = script_lines(sec); D = duration(wav); G = gaps(wav)
    onset = G[0][1] if G and G[0][0] < 0.05 else 0.0
    G = [g for g in G if g[0] > 0.05 and g[1] < D - 0.05]
    tail = D
    gt = gaps(wav, d=0.05); 
    if gt and gt[-1][1] >= D - 0.05: tail = gt[-1][0]
    w = [len(re.sub(r'[\s—"،۔\-]', '', l.replace('noor-ul-hasrat.vercel.app', URL_UR).replace('noor-ul-hasrat dot vercel dot app', URL_UR))) for l in lines]
    n, m = len(lines), len(G)
    speech = (tail - onset) - sum(e - s for s, e in G)
    # DP over (line i ends at gap j); line i spans from end of previous boundary to start of gap j
    INF = 1e18; best = {}; best[(0, -1)] = (0.0, None)
    pts = [(onset, onset)] + G + [(tail, tail)]   # boundary k: line ends at pts[k][0], next starts at pts[k][1]
    cost = [[INF] * (m + 2) for _ in range(n + 1)]; back = [[None] * (m + 2) for _ in range(n + 1)]
    cost[0][0] = 0
    for i in range(1, n + 1):
        for k in range(1, m + 2):
            if i == n and k != m + 1: continue
            if i < n and k == m + 1: continue
            for p in range(0, k):
                if cost[i - 1][p] >= INF: continue
                a, b = pts[p][1], pts[k][0]
                inner = sum(e - s for s, e in G[p:k - 1])           # pauses inside the line
                dur = (b - a) - inner
                exp = speech * w[i - 1] / sum(w)
                c = ((dur - exp) / max(1.5, exp)) ** 2 * 10
                if k <= m: c -= 1.2 * (pts[k][1] - pts[k][0])     # reward ending on a long pause
                if cost[i - 1][p] + c < cost[i][k]: cost[i][k] = cost[i - 1][p] + c; back[i][k] = p
    ks = []; k = m + 1
    for i in range(n, 0, -1): ks.append(k); k = back[i][k]
    ks = ks[::-1]; out = []; prev = 0
    for k in ks: out.append([round(pts[prev][1], 2), round(pts[k][0], 2)]); prev = k
    fine = gaps(wav, noise='-36dB', d=0.15)
    for i, x in FIX.get((V, sec), {}).items():
        g = min(fine, key=lambda p: abs(p[0] - x)); out[i - 1][1] = round(g[0], 2); out[i][0] = round(g[1], 2)
    os.makedirs(os.path.join(HERE, 'work'), exist_ok=True)
    json.dump(out, open(os.path.join(HERE, 'work', f'times_{sec}.json'), 'w'))
    for i, (l, t) in enumerate(zip(lines, out)): print(f'{i+1:2d} {t[0]:7.2f}-{t[1]:7.2f}  {l[:60]}')
    return out

if __name__ == '__main__': align(sys.argv[1] if len(sys.argv) > 1 else 'A')
