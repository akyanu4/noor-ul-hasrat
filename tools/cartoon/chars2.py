"""Version 2 characters: proper faces (eye whites, irises, lids, lashes, brows, nose, lips, cheek shading),
hands with fingers and a thumb, bending elbows and knees, shoulders that lift, body lean and sway.
Ali is drawn after the user's son (round face, spiky black hair under a white topi, red T-shirt);
Nana after the elder's photo (grey hair, short white beard, aviator glasses, white kurta with buttons and a pocket).

Origin = between the feet; face +1 = right, -1 = left. Angles in degrees: 0 hangs down, 90 points forward, 180 up.
State keys (all optional except x, y):
  s, face, walk (phase), bob, lean, expr, talk (0..1 mouth), blink (0..1), look (-1..1 horizontal), look_y,
  arm_f / arm_b (shoulder angle), elb_f / elb_b (elbow bend), hand_f / hand_b ('relax','open','point','hold','wave','fist'),
  hold ('bottle'), hold_tilt."""
import math

INK = '#3b2a20'
STROKE = 5


def SW(w=STROKE): return f'stroke="{INK}" stroke-width="{w}" stroke-linejoin="round" stroke-linecap="round"'


def shade(hexc, f=0.82):
    h = hexc.lstrip('#'); r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    return '#%02x%02x%02x' % (min(255, int(r * f)), min(255, int(g * f)), min(255, int(b * f)))


DEFS = ('<defs>'
        '<radialGradient id="blush"><stop offset="0" stop-color="#ff7d7d" stop-opacity=".55"/><stop offset="1" stop-color="#ff7d7d" stop-opacity="0"/></radialGradient>'
        '<radialGradient id="glass" cx=".35" cy=".3"><stop offset="0" stop-color="#ffffff" stop-opacity=".55"/><stop offset="1" stop-color="#c9e6f5" stop-opacity=".18"/></radialGradient>'
        '</defs>')

# ------------------------------------------------------------------ expressions
# brow: raise (-1 low .. 1 high), tilt (+ inner ends up = sad/worried, - = cross/focused)
# open: eye openness, squint: lower lid up, mouth: curve (-1 frown .. 1 smile), mopen: base mouth opening, closed: ^^ eyes
EXPR = {
    'neutral':    dict(raise_=0.0, tilt=0.0, open=1.0, squint=0.0, curve=0.35, mopen=0.0),
    'happy':      dict(raise_=0.25, tilt=0.0, open=0.95, squint=0.35, curve=1.0, mopen=0.15),
    'gentle':     dict(raise_=0.15, tilt=0.15, open=0.9, squint=0.3, curve=0.7, mopen=0.0),
    'warm':       dict(raise_=0.15, tilt=0.1, open=0.85, squint=0.35, curve=0.8, mopen=0.0),
    'proud':      dict(raise_=0.3, tilt=0.0, open=0.8, squint=0.45, curve=0.9, mopen=0.05),
    'excited':    dict(raise_=0.6, tilt=0.0, open=1.1, squint=0.1, curve=1.0, mopen=0.35),
    'laugh':      dict(raise_=0.5, tilt=0.0, open=1.0, squint=0.0, curve=1.0, mopen=0.75, closed=True),
    'surprised':  dict(raise_=1.0, tilt=0.0, open=1.25, squint=0.0, curve=0.0, mopen=0.55, o=True),
    'sad':        dict(raise_=0.1, tilt=0.9, open=0.8, squint=0.0, curve=-0.8, mopen=0.0, look_y=0.5),
    'worried':    dict(raise_=0.35, tilt=0.8, open=1.0, squint=0.0, curve=-0.45, mopen=0.05, wavy=True),
    'tired':      dict(raise_=-0.2, tilt=0.35, open=0.55, squint=0.0, curve=-0.2, mopen=0.3),
    'thoughtful': dict(raise_=0.3, tilt=-0.2, open=0.9, squint=0.15, curve=0.15, mopen=0.0, look_y=-0.7, side=True),
}


def ex(name):
    e = dict(EXPR['neutral']); e.update(EXPR.get(name or 'neutral', {})); return e


def face(r, st, kind):
    """Face features centred on (0,0) of a head of radius r. kind: 'ali' | 'maryam' | 'nana'."""
    e = ex(st.get('expr')); talk = st.get('talk', 0); blink = st.get('blink', 0)
    look = st.get('look', 0.35); look_y = st.get('look_y', e.get('look_y', 0))
    fx = r * 0.14                    # features turned a little toward the facing side
    ey = -r * 0.06; exs = r * 0.36; ew, eh = r * 0.2, r * 0.17
    s = ''
    # cheek blush + soft shading on the far side
    s += f'<ellipse cx="{fx - exs - r*.08}" cy="{r*.3}" rx="{r*.24}" ry="{r*.16}" fill="url(#blush)"/>'
    s += f'<ellipse cx="{fx + exs + r*.08}" cy="{r*.3}" rx="{r*.24}" ry="{r*.16}" fill="url(#blush)"/>'
    openv = e['open'] * (1 - blink)
    for sx in (-1, 1):
        cx = fx + sx * exs * (0.92 if sx < 0 else 1.0)   # far eye a bit closer (3/4 view)
        wq = ew * (0.9 if sx < 0 else 1.0)
        if e.get('closed') or openv < 0.12:
            curve = -r * .09 if e.get('closed') else r * .03
            s += f'<path d="M{cx-wq},{ey} Q{cx},{ey+curve} {cx+wq},{ey}" fill="none" {SW(4.5)}/>'
            if kind == 'maryam':
                s += f'<path d="M{cx+wq*.7},{ey-2} l{wq*.35},{-r*.06} M{cx+wq*.95},{ey+2} l{wq*.4},{-r*.02}" {SW(3)}/>'
        else:
            h = eh * openv; cid = f'e{kind}{sx}'
            top = ey - h; bot = ey + h * (1 - 0.55 * e['squint'])
            eye = f'M{cx-wq},{ey} Q{cx-wq*.6},{top} {cx},{top} Q{cx+wq*.6},{top} {cx+wq},{ey} Q{cx+wq*.5},{bot} {cx},{bot} Q{cx-wq*.5},{bot} {cx-wq},{ey}Z'
            ix = cx + look * wq * 0.42; iy = ey + look_y * h * 0.35 + h * 0.08
            ir = eh * 0.72
            s += f'<clipPath id="{cid}"><path d="{eye}"/></clipPath><path d="{eye}" fill="#fff"/>'
            s += (f'<g clip-path="url(#{cid})"><circle cx="{ix}" cy="{iy}" r="{ir}" fill="#6b3d22"/><circle cx="{ix}" cy="{iy}" r="{ir*.62}" fill="#3a1f10"/>'
                  f'<circle cx="{ix}" cy="{iy}" r="{ir*.42}" fill="#120a06"/><circle cx="{ix+ir*.38}" cy="{iy-ir*.4}" r="{ir*.24}" fill="#fff"/>'
                  f'<circle cx="{ix-ir*.3}" cy="{iy+ir*.35}" r="{ir*.1}" fill="#fff" opacity=".8"/>'
                  f'<rect x="{cx-wq}" y="{top-2}" width="{2*wq}" height="{h*.32}" fill="#000" opacity=".1"/></g>')
            # upper lid (heavier line), lower lid (thin)
            s += f'<path d="M{cx-wq-2},{ey+1} Q{cx-wq*.6},{top-1} {cx},{top-1} Q{cx+wq*.6},{top-1} {cx+wq+2},{ey-1}" fill="none" {SW(5)}/>'
            s += f'<path d="M{cx-wq*.7},{bot-h*.15} Q{cx},{bot+1.5} {cx+wq*.7},{bot-h*.15}" fill="none" stroke="{INK}" stroke-width="2" opacity=".55"/>'
            if e['open'] < 0.7:   # tired: heavy lid fold
                s += f'<path d="M{cx-wq},{top-5} Q{cx},{top-10} {cx+wq},{top-5}" fill="none" stroke="{INK}" stroke-width="2.2" opacity=".6"/>'
            if kind == 'maryam':
                for k in range(3):
                    a0 = 0.45 + k * 0.25
                    px = cx + wq * a0; py = top + (ey - top) * (a0 - 0.2) ** 2
                    s += f'<path d="M{px},{py} l{wq*.32},{-r*.07 + k*2}" {SW(3)}/>'
        # eyebrows
        braise = e['raise_'] * r * 0.09
        inner = cx - sx * wq * 0.9 if False else None
        bx0, bx1 = cx - wq * 1.05, cx + wq * 1.05      # left -> right
        by = ey - eh * 1.9 - braise
        # inner end is the one toward the nose: for the left eye (sx=-1) that is bx1
        tilt = e['tilt'] * r * 0.1
        y0 = by + (0 if sx < 0 else -tilt); y1 = by + (-tilt if sx < 0 else 0)
        if e.get('side') and sx > 0: y0 -= r * .06; y1 -= r * .08
        col = '#2a1a12' if kind != 'nana' else '#8f8a85'
        bw = 7 if kind == 'ali' else (5.5 if kind == 'maryam' else 7)
        s += f'<path d="M{bx0},{y0} Q{(bx0+bx1)/2},{min(y0,y1) - r*.05} {bx1},{y1}" fill="none" stroke="{col}" stroke-width="{bw}" stroke-linecap="round"/>'
    # nose (soft)
    nx = fx + r * 0.04; ny = r * 0.16
    s += f'<path d="M{nx+2},{ey+r*.05} Q{nx+r*.1},{ny} {nx+r*.02},{ny+r*.06}" fill="none" stroke="{INK}" stroke-width="3.2" stroke-linecap="round" opacity=".75"/>'
    s += f'<ellipse cx="{nx-r*.03}" cy="{ny+r*.07}" rx="{r*.07}" ry="{r*.035}" fill="#000" opacity=".1"/>'
    # mouth
    my = r * 0.45; mw = r * (0.24 + 0.06 * max(0, e['curve']))
    op = max(e['mopen'], 0) * 0.55 + talk
    op = min(op, 1.15)
    if e.get('o') and talk < 0.35:
        op = max(op, 0.5)
        s += f'<ellipse cx="{fx}" cy="{my+r*.04}" rx="{r*.09}" ry="{r*(.07+.08*op)}" fill="#6e1f2a" {SW(4)}/>'
    elif op > 0.12:
        h = r * (0.06 + 0.24 * op); c = e['curve']
        top = my - r * 0.02 + (-c * r * .05)
        corner = my - c * r * 0.07
        bot = my + h + c * r * .05
        d = f'M{fx-mw},{corner} Q{fx},{top} {fx+mw},{corner} Q{fx+mw*.6},{bot} {fx},{bot} Q{fx-mw*.6},{bot} {fx-mw},{corner}Z'
        cid = f'm{kind}'
        s += f'<clipPath id="{cid}"><path d="{d}"/></clipPath><path d="{d}" fill="#6e1f2a"/>'
        s += f'<g clip-path="url(#{cid})"><rect x="{fx-mw}" y="{top-4}" width="{2*mw}" height="{r*.07}" fill="#fff"/><ellipse cx="{fx}" cy="{bot}" rx="{mw*.6}" ry="{h*.38}" fill="#e2727c"/></g>'
        s += f'<path d="{d}" fill="none" {SW(4)}/>'
        if kind != 'nana': s += f'<path d="M{fx-mw*.55},{bot+r*.05} Q{fx},{bot+r*.09} {fx+mw*.55},{bot+r*.05}" fill="none" stroke="#c26a6a" stroke-width="3" opacity=".6"/>'
    else:
        c = e['curve']
        if e.get('wavy'):
            s += f'<path d="M{fx-mw*.8},{my+2} q{mw*.4},{-r*.05} {mw*.8},0 t{mw*.8},0" fill="none" {SW(4)}/>'
        else:
            s += f'<path d="M{fx-mw},{my - c*r*.04} Q{fx},{my + c*r*.12} {fx+mw},{my - c*r*.04}" fill="none" {SW(4.5)}/>'
            # lower lip
            if kind != 'nana':
                s += f'<path d="M{fx-mw*.45},{my + c*r*.08 + r*.06} Q{fx},{my + c*r*.1 + r*.1} {fx+mw*.45},{my + c*r*.08 + r*.06}" fill="none" stroke="#c26a6a" stroke-width="4" stroke-linecap="round" opacity=".7"/>'
    if st.get('sweat'):
        k = st['sweat'] % 1
        s += f'<path d="M{-r*.85},{-r*.2 + k*r*.5} q-9,15 0,22 q9,-7 0,-22Z" fill="#8fd8ff" stroke="#3b7fb3" stroke-width="3" opacity="{1-k*.8}"/>'
    return s


# ------------------------------------------------------------------ limbs
def pt(x, y, ang, L):
    a = math.radians(ang); return x + L * math.sin(a), y + L * math.cos(a)


def capsule(pts, w, fill, outline=True):
    d = 'M' + ' L'.join(f'{x:.1f},{y:.1f}' for x, y in pts)
    s = f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="{w + 2*STROKE}" stroke-linecap="round" stroke-linejoin="round"/>' if outline else ''
    return s + f'<path d="{d}" fill="none" stroke="{fill}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'


def hand(x, y, ang, size, pose, skin, back=False):
    """Hand at wrist (x,y), pointing along angle `ang`. Fingers, thumb, palm."""
    col = shade(skin, .9) if back else skin
    s = f'<g transform="translate({x:.1f},{y:.1f}) rotate({-ang:.1f}) scale({size/30:.3f})">'
    fw = 7.5
    def finger(fx, fy, a, L, bend=0):
        x1, y1 = fx + L * .55 * math.sin(math.radians(a)), fy + L * .55 * math.cos(math.radians(a))
        x2, y2 = x1 + L * .45 * math.sin(math.radians(a + bend)), y1 + L * .45 * math.cos(math.radians(a + bend))
        return capsule([(fx, fy), (x1, y1), (x2, y2)], fw, col)
    if pose in ('open', 'wave'):
        spread = 1.4 if pose == 'wave' else 1.0
        for i, (fx, a, L) in enumerate(((-9, -16, 22), (-3, -5, 26), (3, 5, 25), (9, 15, 21))):
            s += finger(fx, 18, a * spread, L)
        s += finger(12, 6, 70, 18, -20)
        s += f'<ellipse cx="0" cy="12" rx="15" ry="15" fill="{col}" {SW(4)}/>'
        s += f'<path d="M-9,10 Q0,16 9,10" fill="none" stroke="{INK}" stroke-width="1.8" opacity=".35"/>'
    elif pose == 'point':
        s += f'<ellipse cx="0" cy="14" rx="14" ry="13" fill="{col}" {SW(4)}/>'
        s += finger(-4, 20, 12, 30)
        for fx in (2, 7, 11): s += f'<circle cx="{fx}" cy="25" r="5.5" fill="{col}" {SW(3)}/>'
        s += finger(11, 8, 40, 12, 30)
    elif pose in ('hold', 'fist'):
        s += f'<ellipse cx="0" cy="14" rx="15" ry="14" fill="{col}" {SW(4)}/>'
        for i, fx in enumerate((-9, -3, 3, 9)):
            s += f'<ellipse cx="{fx}" cy="24" rx="5.6" ry="6.5" fill="{col}" {SW(3)}/>'
        s += finger(13, 8, 35, 14, 25)
    else:  # relax: fingers together, slightly curled, thumb along the side
        s += f'<path d="M-13,4 Q-16,22 -8,32 Q2,38 11,30 Q16,20 13,4Z" fill="{col}" {SW(4)}/>'
        s += f'<path d="M-6,22 L-6,31 M0,23 L0,34 M6,22 L6,31" stroke="{INK}" stroke-width="2" opacity=".45" stroke-linecap="round"/>'
        s += finger(12, 6, 45, 15, 15)
    return s + '</g>'


def bottle(x, y, ang, tilt):
    return (f'<g transform="translate({x:.1f},{y:.1f}) rotate({tilt:.1f})"><g transform="translate(0,4)">'
            f'<rect x="-14" y="-30" width="28" height="60" rx="9" fill="#9fd6f5" {SW(4)}/>'
            f'<rect x="-14" y="6" width="28" height="24" rx="7" fill="#4aa8e0"/><rect x="-9" y="-44" width="18" height="15" rx="4" fill="#2d6fb5" {SW(4)}/>'
            f'<rect x="-9" y="-22" width="5" height="34" rx="2" fill="#fff" opacity=".6"/></g></g>')


def arm(sx, sy, ang, bend, L1, L2, w, sleeve, sleeve_len, skin, pose, back=False, holding=None, hold_tilt=0):
    """Upper arm from shoulder, forearm bent forward by `bend` degrees. sleeve_len: 0..1 of upper arm, or 2 = full sleeve."""
    ex_, ey_ = pt(sx, sy, ang, L1)
    fa = ang + bend
    wx, wy = pt(ex_, ey_, fa, L2)
    skin_c = shade(skin, .9) if back else skin
    sl = shade(sleeve, .85) if back else sleeve
    s = ''
    if sleeve_len >= 2:
        s += capsule([(sx, sy), (ex_, ey_), (wx, wy)], w, sl)
        s += f'<path d="M{wx:.1f},{wy:.1f}" />'
    else:
        s += capsule([(sx, sy), (ex_, ey_), (wx, wy)], w * 0.86, skin_c)
        mx, my = pt(sx, sy, ang, L1 * sleeve_len)
        s += capsule([(sx, sy), (mx, my)], w * 1.25, sl)
    if holding == 'bottle':
        s += bottle(wx, wy, fa, hold_tilt)
    s += hand(wx, wy, fa, w * 0.95, 'hold' if holding else pose, skin, back)
    return s


def leg(hx, hy, ang, knee, L1, L2, w, pants, shoe, back=False):
    kx, ky = pt(hx, hy, ang, L1)
    sa = ang - knee                              # shin bends backward
    ax, ay = pt(kx, ky, sa, L2)
    p = shade(pants, .88) if back else pants
    s = capsule([(hx, hy), (kx, ky), (ax, ay)], w, p)
    sh = shade(shoe, .85) if back else shoe
    s += f'<g transform="translate({ax:.1f},{ay:.1f}) rotate({-sa*0.35:.1f})"><path d="M{-w*.55},-4 Q{-w*.6},{w*.45} {-w*.2},{w*.5} L{w*1.15},{w*.5} Q{w*1.35},{w*.1} {w*.6},-6Z" fill="{sh}" {SW(4)}/></g>'
    return s


def gait(st, swing=24):
    """Returns legA, kneeA, legB, kneeB, armswing, bob."""
    ph = st.get('walk')
    if ph is None: return 0, 3, 0, 3, 0, 0
    a = math.sin(ph * 2 * math.pi)
    kA = 8 + 34 * max(0, math.sin(ph * 2 * math.pi + 1.6))
    kB = 8 + 34 * max(0, math.sin(ph * 2 * math.pi + 1.6 + math.pi))
    return swing * a, kA, -swing * a, kB, a, -abs(math.cos(ph * 2 * math.pi)) * 6


# ------------------------------------------------------------------ characters
ALI_SKIN = '#E7B48C'; MAR_SKIN = '#EDC09A'; NANA_SKIN = '#C9906A'


def _arms_state(st, swing_a, holding_front):
    af, ab = st.get('arm_f', 6), st.get('arm_b', 6)
    if st.get('walk') is not None:
        if holding_front is None and 'arm_f' not in st: af = 6 - 20 * swing_a
        if 'arm_b' not in st: ab = 6 + 20 * swing_a
    def default_bend(a): return 12 if a < 40 else (25 if a < 120 else 30)
    return (af, st.get('elb_f', default_bend(af)), ab, st.get('elb_b', default_bend(ab)))


def _shoulder_lift(a): return -max(0, (a - 80)) / 100 * 10


def ali(st):
    x, y, s, f = st['x'], st['y'], st.get('s', 1), st.get('face', 1)
    lA, kA, lB, kB, sw, bob = gait(st)
    bob += st.get('bob', 0)
    lean = st.get('lean', 0) + (4 if st.get('walk') is not None else 0)
    af, ebf, ab, ebb = _arms_state(st, sw, st.get('hold'))
    RED, PANTS, SHOE = '#D52B31', '#3d4f75', '#f2f2f2'
    g = f'<g transform="translate({x},{y + bob*s}) scale({s*f},{s})">'
    # legs (hip at -150)
    g += leg(-15, -150, lB, kB, 70, 68, 36, PANTS, '#d9d9d9', back=True)
    g += f'<g transform="rotate({lean},0,-150)">'
    g += arm(-40, -280 + _shoulder_lift(ab), ab, ebb, 60, 56, 27, RED, .45, ALI_SKIN, st.get('hand_b', 'relax'), back=True)
    g += '</g>'
    g += leg(15, -150, lA, kA, 70, 68, 36, PANTS, SHOE)
    g += f'<g transform="rotate({lean},0,-150)">'
    # torso: chubby kid, red T-shirt
    g += f'<path d="M-50,-292 Q-70,-240 -62,-170 Q-60,-138 -48,-130 L48,-130 Q60,-138 62,-170 Q70,-240 50,-292 Q0,-306 -50,-292Z" fill="{RED}" {SW()}/>'
    g += f'<path d="M-48,-136 Q0,-124 48,-136 L46,-128 Q0,-118 -46,-128Z" fill="{shade(RED,.8)}"/>'
    g += f'<path d="M-24,-298 Q0,-282 24,-298" fill="none" stroke="{shade(RED,.75)}" stroke-width="7" stroke-linecap="round"/>'
    g += f'<path d="M30,-230 Q50,-200 46,-150" fill="none" stroke="{shade(RED,.8)}" stroke-width="4" opacity=".6"/>'
    # neck + head
    hy = -366
    g += f'<rect x="-15" y="-312" width="30" height="24" fill="{shade(ALI_SKIN,.88)}"/>'
    g += f'<g transform="rotate({st.get("head_tilt",0)},0,-300)">'
    g += f'<ellipse cx="-70" cy="{hy+8}" rx="15" ry="19" fill="{shade(ALI_SKIN,.94)}" {SW(4)}/>'
    g += f'<ellipse cx="74" cy="{hy+8}" rx="13" ry="18" fill="{ALI_SKIN}" {SW(4)}/>'
    # round face, full cheeks
    g += f'<path d="M-70,{hy-20} Q-74,{hy+50} -38,{hy+70} Q0,{hy+86} 40,{hy+70} Q76,{hy+50} 72,{hy-20} Q66,{hy-80} 0,{hy-82} Q-64,{hy-80} -70,{hy-20}Z" fill="{ALI_SKIN}" {SW()}/>'
    g += f'<path d="M-62,{hy+20} Q-60,{hy+56} -30,{hy+70}" fill="none" stroke="{shade(ALI_SKIN,.85)}" stroke-width="10" opacity=".5"/>'
    # spiky black hair below the topi (sides + short fringe spikes)
    H = '#1c1714'
    spikes = (f'M-72,{hy-14} L-80,{hy-34} L-66,{hy-30} L-70,{hy-54} L-54,{hy-42} L-50,{hy-62} L-36,{hy-46} L-26,{hy-60} L-18,{hy-42} '
              f'L-6,{hy-58} L4,{hy-40} L16,{hy-56} L24,{hy-40} L38,{hy-54} L42,{hy-38} L58,{hy-50} L56,{hy-32} L74,{hy-38} L70,{hy-14} '
              f'Q60,{hy-30} 46,{hy-26} Q20,{hy-38} 0,{hy-30} Q-24,{hy-38} -46,{hy-26} Q-62,{hy-30} -72,{hy-14}Z')
    g += f'<path d="{spikes}" fill="{H}" {SW(4)}/>'
    g += f'<path d="M-66,{hy-18} L-74,{hy+6} L-62,{hy-2}Z M66,{hy-18} L74,{hy+4} L62,{hy-2}Z" fill="{H}" {SW(3)}/>'
    # white topi (round cap) on top
    g += f'<path d="M-60,{hy-50} Q-58,{hy-108} 0,{hy-112} Q58,{hy-108} 60,{hy-50} Q0,{hy-64} -60,{hy-50}Z" fill="#fbfbf7" {SW()}/>'
    g += f'<path d="M-56,{hy-60} Q0,{hy-74} 56,{hy-60}" fill="none" stroke="#d8d4c4" stroke-width="4"/>'
    for i in range(-3, 4):
        g += f'<path d="M{i*15},{hy-108+abs(i)*2} L{i*17},{hy-70}" stroke="#e3dfd0" stroke-width="2"/>'
    g += f'<g transform="translate(0,{hy+6})">' + face(70, st, 'ali') + '</g>'
    g += '</g>'
    # front arm
    g += arm(42, -280 + _shoulder_lift(af), af, ebf, 60, 56, 27, RED, .45, ALI_SKIN, st.get('hand_f', 'relax'),
             holding=st.get('hold'), hold_tilt=st.get('hold_tilt', 0))
    g += f'<ellipse cx="38" cy="{-276 + _shoulder_lift(af)}" rx="18" ry="16" fill="{RED}"/>'
    g += '</g></g>'
    return g


def maryam(st):
    x, y, s, f = st['x'], st['y'], st.get('s', 1), st.get('face', 1)
    lA, kA, lB, kB, sw, bob = gait(st, 20)
    bob += st.get('bob', 0)
    lean = st.get('lean', 0) + (3 if st.get('walk') is not None else 0)
    af, ebf, ab, ebb = _arms_state(st, sw, None)
    DRESS, SCARF = '#E86FA0', '#8E7CC3'
    g = f'<g transform="translate({x},{y + bob*s}) scale({s*f},{s})">'
    g += leg(-13, -140, lB, kB, 66, 64, 30, '#f6d7e6', '#b8325f', back=True)
    g += f'<g transform="rotate({lean},0,-140)">' + arm(-36, -272 + _shoulder_lift(ab), ab, ebb, 56, 52, 24, DRESS, 2, MAR_SKIN, st.get('hand_b', 'relax'), back=True) + '</g>'
    g += leg(13, -140, lA, kA, 66, 64, 30, '#f6d7e6', '#c0396b')
    g += f'<g transform="rotate({lean},0,-140)">'
    g += f'<path d="M-44,-286 Q-56,-200 -80,-92 Q0,-74 80,-92 Q56,-200 44,-286 Q0,-298 -44,-286Z" fill="{DRESS}" {SW()}/>'
    g += '<path d="M-74,-112 Q0,-98 74,-112" fill="none" stroke="#fff" stroke-width="7" opacity=".75"/>'
    for i in (-40, 0, 40): g += f'<circle cx="{i}" cy="-150" r="7" fill="#ffd6e8"/>'
    hy = -352
    g += f'<g transform="rotate({st.get("head_tilt",0)},0,-290)">'
    # scarf behind
    g += f'<path d="M-84,{hy} Q-92,{hy+92} -60,{hy+104} L62,{hy+104} Q94,{hy+92} 86,{hy} A86,86 0 0 0 -84,{hy}Z" fill="{SCARF}" {SW()}/>'
    g += f'<ellipse cx="0" cy="{hy+6}" rx="62" ry="64" fill="{MAR_SKIN}" {SW()}/>'
    g += f'<path d="M-66,{hy-2} Q-60,{hy-60} 0,{hy-66} Q60,{hy-60} 66,{hy-2} Q50,{hy-46} 0,{hy-50} Q-50,{hy-46} -66,{hy-2}Z" fill="{SCARF}" {SW(4)}/>'
    g += f'<path d="M-40,{hy-40} Q0,{hy-52} 40,{hy-40}" fill="none" stroke="#2a1a12" stroke-width="8" stroke-linecap="round"/>'
    g += f'<g transform="translate(0,{hy+10})">' + face(60, st, 'maryam') + '</g></g>'
    g += arm(38, -272 + _shoulder_lift(af), af, ebf, 56, 52, 24, DRESS, 2, MAR_SKIN, st.get('hand_f', 'relax'))
    g += f'<ellipse cx="34" cy="{-268 + _shoulder_lift(af)}" rx="16" ry="15" fill="{DRESS}"/>'
    g += '</g></g>'
    return g


def nana(st):
    x, y, s, f = st['x'], st['y'], st.get('s', 1), st.get('face', 1)
    lA, kA, lB, kB, sw, bob = gait(st, 16)
    bob += st.get('bob', 0)
    lean = st.get('lean', 0) + (2 if st.get('walk') is not None else 0)
    af, ebf, ab, ebb = _arms_state(st, sw, None)
    KURTA, KD = '#f8f8f4', '#dcdcd2'
    g = f'<g transform="translate({x},{y + bob*s}) scale({s*f},{s})">'
    g += leg(-17, -175, lB, kB, 84, 84, 38, '#ecebe3', '#6b4a30', back=True)
    g += f'<g transform="rotate({lean},0,-175)">' + arm(-50, -392 + _shoulder_lift(ab), ab, ebb, 86, 80, 32, KURTA, 2, NANA_SKIN, st.get('hand_b', 'relax'), back=True) + '</g>'
    g += leg(17, -175, lA, kA, 84, 84, 38, '#f3f2ea', '#6b4a30')
    g += f'<g transform="rotate({lean},0,-175)">'
    # long white kurta: band collar, button placket, chest pocket
    g += f'<path d="M-62,-410 Q-80,-300 -84,-120 Q0,-104 84,-120 Q80,-300 62,-410 Q0,-426 -62,-410Z" fill="{KURTA}" {SW()}/>'
    g += f'<path d="M-70,-300 Q-76,-220 -78,-130" fill="none" stroke="{KD}" stroke-width="6"/>'
    g += f'<rect x="-6" y="-406" width="16" height="170" rx="4" fill="#f1f1ea" stroke="{KD}" stroke-width="3"/>'
    for by in (-384, -350, -316, -282, -252): g += f'<circle cx="2" cy="{by}" r="5.5" fill="#fff" stroke="#b9b6a8" stroke-width="2.5"/>'
    g += f'<path d="M24,-330 L58,-330 L57,-288 Q41,-282 25,-288Z" fill="none" stroke="{KD}" stroke-width="4"/>'
    g += f'<path d="M-30,-424 Q0,-412 30,-424 L30,-410 Q0,-400 -30,-410Z" fill="#fff" {SW(3.5)}/>'
    hy = -488
    g += f'<rect x="-17" y="-438" width="34" height="26" fill="{shade(NANA_SKIN,.88)}"/>'
    g += f'<g transform="rotate({st.get("head_tilt",0)},0,-420)">'
    g += f'<ellipse cx="-58" cy="{hy+6}" rx="13" ry="18" fill="{shade(NANA_SKIN,.94)}" {SW(4)}/><ellipse cx="62" cy="{hy+6}" rx="12" ry="17" fill="{NANA_SKIN}" {SW(4)}/>'
    g += f'<path d="M-60,{hy-10} Q-62,{hy+56} -30,{hy+74} Q0,{hy+86} 32,{hy+74} Q64,{hy+56} 62,{hy-10} Q58,{hy-74} 0,{hy-76} Q-58,{hy-74} -60,{hy-10}Z" fill="{NANA_SKIN}" {SW()}/>'
    # grey hair: short, combed, receding at the temples
    g += (f'<path d="M-62,{hy-6} Q-70,{hy-56} -36,{hy-74} Q0,{hy-90} 38,{hy-74} Q70,{hy-56} 62,{hy-6} Q56,{hy-40} 40,{hy-50} Q8,{hy-66} -20,{hy-58} '
          f'Q-44,{hy-50} -56,{hy-30}Z" fill="#a9a6a2" {SW(4)}/>')
    for i in range(-3, 4): g += f'<path d="M{i*13-4},{hy-80+abs(i)*3} Q{i*14},{hy-66} {i*15+6},{hy-56}" fill="none" stroke="#d7d5d1" stroke-width="3" opacity=".9"/>'
    g += f'<g transform="translate(0,{hy+2})">' + face(62, st, 'nana')
    # short white beard (jaw + chin) and moustache
    talk = st.get('talk', 0) + ex(st.get('expr'))['mopen'] * .55
    jaw = min(talk, 1) * 10
    fx = 62 * 0.14
    g += (f'<path d="M-58,4 Q-58,{60+jaw} -22,{80+jaw} Q{fx},{92+jaw} 34,{80+jaw} Q62,{60+jaw} 60,4 Q54,40 40,46 Q{fx},{36} -24,46 Q-50,40 -58,4Z" '
          f'fill="#eeeeea" {SW(4)}/>')
    for i in range(7): g += f'<path d="M{-40+i*13},{50+jaw} q2,12 0,22" stroke="#c9c7c1" stroke-width="2.4" fill="none"/>'
    g += f'<path d="M{fx-26},22 Q{fx-12},14 {fx},20 Q{fx+12},14 {fx+26},22 Q{fx+14},28 {fx},24 Q{fx-14},28 {fx-26},22Z" fill="#dcdad4" {SW(3)}/>'
    # aviator glasses: teardrop lenses, thin metal double bridge, dark tortoise rims
    for sx in (-1, 1):
        cx = fx + sx * 62 * .36 * (0.92 if sx < 0 else 1)
        lens = f'M{cx-21},{-22} Q{cx},{-27} {cx+21},{-22} Q{cx+24},{2} {cx+12},{12} Q{cx},{18} {cx-12},{12} Q{cx-24},{2} {cx-21},{-22}Z'
        g += f'<path d="{lens}" fill="url(#glass)" stroke="#3a2a22" stroke-width="5"/>'
        g += f'<path d="M{cx-17},{-20} Q{cx},{-24} {cx+17},{-20}" fill="none" stroke="#c9b48a" stroke-width="2"/>'
    l, r_ = fx - 62 * .36 * .92 + 21, fx + 62 * .36 - 21
    g += f'<path d="M{l},-20 Q{(l+r_)/2},-28 {r_},-20 M{l+1},-12 L{r_-1},-12" fill="none" stroke="#c9b48a" stroke-width="3"/>'
    g += f'<path d="M{fx + 62*.36 + 21},-20 L60,-14" stroke="#3a2a22" stroke-width="4"/>'
    g += '</g></g>'
    g += arm(52, -392 + _shoulder_lift(af), af, ebf, 86, 80, 32, KURTA, 2, NANA_SKIN, st.get('hand_f', 'relax'))
    g += f'<ellipse cx="47" cy="{-386 + _shoulder_lift(af)}" rx="20" ry="18" fill="{KURTA}"/>'
    g += '</g></g>'
    return g


def kid(st, girl=False):
    return maryam(st) if girl else ali(st)
