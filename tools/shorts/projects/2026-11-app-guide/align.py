"""Map script lines to narration times: ffmpeg silencedetect gives the pauses; a small DP puts each line boundary on a
pause so line durations follow line lengths (characters), preferring the longer pauses that end Urdu sentences (۔).
    python3 align.py A|B   -> prints and writes work/times_<A|B>.json  [[start, end], ...] per script line
Version 3 (script.md "# Version 3": version 2 with new lines spliced in by build_voice_v3.py) is the default; NOOR_V=2 for
version 2 (script.md "## A2." / "## B2.", everyday Urdu with English words; voice "Daro"), NOOR_V=1 for the first version.
Version 3 needs no new guessing: the old lines keep their version 2 times (the DP below plus the hand fixes), moved by
the splice (work/splice_<A|B>.json), and the new lines sit where build_voice_v3.py put them (their speech, cut at -45 dB).
It also writes work/times_v2_<A|B>.json (the version 2 times) and work/order_<A|B>.json (ORDER3), which storyboard.js and
captions.py use to move the version 2 actions and caption cues with their lines."""
import json, os, re, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
URL_UR = 'نورالحسرت ڈاٹ ورسل ڈاٹ ایپ'
V = os.environ.get('NOOR_V', '3')
WAV = {('1', 'A'): 'voice_short.wav', ('1', 'B'): 'voice_long.wav', ('2', 'A'): 'voice_short_v2_daro.wav', ('2', 'B'): 'voice_long_v2_daro.wav',
       ('3', 'A'): 'voice_short_v3.wav', ('3', 'B'): 'voice_long_v3.wav'}
def wav_path(sec, v=None): return os.path.join(HERE, 'audio', WAV[(v or V, sec)])
# Version 3 line order: a number is a version 2 line, a name is a new line (audio/v3_lines/<name>.wav)
ORDER3 = {'A': [1, 2, 3, 4, 5, 'A6', 'A7', 6, 7, 8, 9, 'A12', 10, 11],
          'B': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 'B11b', 12, 13, 'B14a', 'B14b', 'B14c', 'B14d', 15, 16]}

def splice(sec):
    return json.load(open(os.path.join(HERE, 'work', f'splice_{sec}.json')))
def v2_to_v3(sec, t, sp=None):
    """Where version 2 narration time t sits in the version 3 narration (None if that stretch was cut out)."""
    for a, b, at in (sp or splice(sec))['kept']:
        if a - 1e-6 <= t <= b + 1e-6: return round(at + t - a, 2)
    return None

# Checked by ear-free arithmetic (speaking rate ~13 characters/s and where the pauses fall): line i ends at the pause
# that starts near this time, the next line starts when that pause ends. Version 2 walkthrough: line 1 also holds
# "chaliye dekhte hain..." (the DP ended it too early), and the pauses between Tawbah, Khatrat, Tasawwur, Sabr pulled
# line 6 past "har Short WhatsApp par share kijiye".
FIX = {('2', 'B'): {1: 5.41, 6: 38.78, 7: 40.63}}

def script_lines(sec, v=None):
    v = v or V
    txt = open(os.path.join(HERE, 'script.md'), encoding='utf-8').read()
    if v == '3':
        v2 = script_lines(sec, '2'); new = {}
        part = txt.split('# Version 3')[1]
        for m in re.finditer(r'^.*?(?:(\d+)\. NEW|NEW (\d+[a-d]))\s*:\s*(.*)$', part, re.M):
            new[(('A' if m.group(1) else 'B') + (m.group(1) or m.group(2)))] = m.group(3).strip()
        return [v2[x - 1] if isinstance(x, int) else new[x] for x in ORDER3[sec]]
    if v == '2': part = txt.split('## A2.')[1].split('## B2.')[0] if sec == 'A' else txt.split('## B2.')[1].split('# Version 3')[0]
    else: part = txt.split('## A.')[1].split('## B.')[0] if sec == 'A' else txt.split('## B.')[1].split('# Version 2')[0]
    return [m.group(1).strip() for m in re.finditer(r'^\d+\.\s+(.*)$', part, re.M)]

def gaps(wav, noise='-38dB', d=0.3):
    err = subprocess.run(['ffmpeg', '-hide_banner', '-i', wav, '-af', f'silencedetect=noise={noise}:d={d}', '-f', 'null', '-'], capture_output=True, text=True).stderr
    s = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', err)]; e = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', err)]
    return list(zip(s, e))

def duration(wav):
    return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav], capture_output=True, text=True).stdout)

def align(sec, v=None, quiet=False):
    v = v or V
    if v == '3': return align3(sec)
    wav = wav_path(sec, v)
    lines = script_lines(sec, v); D = duration(wav); G = gaps(wav)
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
    for i, x in FIX.get((v, sec), {}).items():
        g = min(fine, key=lambda p: abs(p[0] - x)); out[i - 1][1] = round(g[0], 2); out[i][0] = round(g[1], 2)
    os.makedirs(os.path.join(HERE, 'work'), exist_ok=True)
    if v == V: json.dump(out, open(os.path.join(HERE, 'work', f'times_{sec}.json'), 'w'))
    if not quiet:
        for i, (l, t) in enumerate(zip(lines, out)): print(f'{i+1:2d} {t[0]:7.2f}-{t[1]:7.2f}  {l[:60]}')
    return out

def align3(sec):
    t2 = align(sec, '2', quiet=True); sp = splice(sec); out = []
    json.dump(t2, open(os.path.join(HERE, 'work', f'times_v2_{sec}.json'), 'w'))
    for x in ORDER3[sec]:
        out.append([v2_to_v3(sec, t2[x - 1][0], sp), v2_to_v3(sec, t2[x - 1][1], sp)] if isinstance(x, int) else list(sp['new'][x]))
    json.dump(out, open(os.path.join(HERE, 'work', f'times_{sec}.json'), 'w'))
    json.dump(ORDER3[sec], open(os.path.join(HERE, 'work', f'order_{sec}.json'), 'w'))   # for storyboard.js / captions.py
    for i, (x, l, t) in enumerate(zip(ORDER3[sec], script_lines(sec), out)): print(f'{i+1:2d} {str(x):>5} {t[0]:7.2f}-{t[1]:7.2f}  {l[:60]}')
    return out

if __name__ == '__main__': align(sys.argv[1] if len(sys.argv) > 1 else 'A')
