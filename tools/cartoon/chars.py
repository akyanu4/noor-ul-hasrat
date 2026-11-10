"""2D puppet characters (SVG). Origin = between the feet; face +1 looks right, -1 left.
Limbs bend: arms have shoulder + elbow, legs hip + knee. Hands have fingers and a thumb.
Angles in degrees, measured from straight down toward the front: 0 hangs down, 90 points forward, 180 straight up.

State keys (all optional): x y s face t walk(phase) run lean tilt(body) head(tilt) nod
  arm_f arm_b (shoulder) el_f el_b (elbow bend) hand_f hand_b ('relax','open','point','fist','hold')
  hold ('bottle') hold_tilt, emo ('neutral','happy','laugh','sad','surprised','worried','tired','thinking','proud','excited')
  mouth (0..1 talking amount) blink (0..1) look (-1..1) bob"""
import math

INK = '#3b2a20'
SKIN = '#F2C29B'; SKIN_D = '#DDA27A'


def _dir(a):
    r = math.radians(a); return math.sin(r), math.cos(r)


def _shade(hexc, f=0.84):
    h = hexc.lstrip('#'); r, g, b = (int(h[i:i+2], 16) for i in (0, 2, 4))
    return '#%02x%02x%02x' % (int(r*f), int(g*f), int(b*f))


def _poly(pts):
    return 'M' + ' L'.join(f'{x:.1f},{y:.1f}' for x, y in pts)


def stroke2(d, w, col, ow=5):
    """an outlined tube along path d: dark stroke underneath, colour on top -> smooth joints, no cut-outs"""
    return (f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="{w+2*ow}" stroke-linecap="round" stroke-linejoin="round"/>'
            f'<path d="{d}" fill="none" stroke="{col}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>')


def hand(x, y, ang, pose='relax', s=1.0, col=SKIN, flip=False):
    """cartoon hand at wrist (x,y), pointing along the forearm angle. Outlines first, then fills, so fingers merge with the palm."""
    fingers = []
    if pose == 'open':
        for a, L in ((-34, 17), (-12, 20), (10, 20), (30, 16)): fingers.append(((0, 14), a, L))
        thumb = ((8, 8), 68, 14)
    elif pose == 'point':
        fingers.append(((-2, 14), -4, 24))
        for a in (18, 32, 44): fingers.append(((2, 18), a, 6))
        thumb = ((7, 9), 40, 9)
    elif pose in ('fist', 'hold'):
        for i, a in enumerate((-20, -6, 8, 22)): fingers.append(((0, 16), a, 5))
        thumb = ((8, 9), 35, 8)
    else:  # relax: fingers together, slightly curled
        for dx in (-7, -2.5, 2.5, 7): fingers.append(((dx, 15), dx * 0.8, 13))
        thumb = ((9, 7), 42, 11)
    sx = -1 if flip else 1
    out, fill = '', ''
    def seg(p, a, L, w):
        x0, y0 = p; dx, dy = _dir(-a) if False else (math.sin(math.radians(a)), math.cos(math.radians(a)))
        return f'M{x0*sx:.1f},{y0:.1f} L{(x0+dx*L)*sx:.1f},{(y0+dy*L):.1f}'
    for p, a, L in fingers + [thumb]:
        d = seg(p, a, L, 8)
        out += f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="16" stroke-linecap="round"/>'
        fill += f'<path d="{d}" fill="none" stroke="{col}" stroke-width="8" stroke-linecap="round"/>'
    out += f'<ellipse cx="0" cy="10" rx="17" ry="16" fill="{INK}"/>'
    fill += f'<ellipse cx="0" cy="10" rx="12" ry="11" fill="{col}"/>'
    if pose in ('fist', 'hold'):
        fill += f'<path d="M{-9*sx},18 q{4*sx},4 {8*sx},0 q{4*sx},4 {8*sx},0" fill="none" stroke="{INK}" stroke-width="2.5"/>'
    return f'<g transform="translate({x:.1f},{y:.1f}) rotate({-ang:.1f}) scale({s})">{out}{fill}</g>'


def arm(sx, sy, a_sh, a_el, L1, L2, w, sleeve, pose='relax', back=False, holding=None, hold_tilt=0, cuff=None, skin=SKIN):
    dx, dy = _dir(a_sh); ex, ey = sx + dx * L1, sy + dy * L1
    b = a_sh + a_el; fx, fy = _dir(b); wx, wy = ex + fx * L2, ey + fy * L2
    col = _shade(sleeve) if back else sleeve
    g = stroke2(_poly([(sx, sy), (ex, ey), (wx, wy)]), w, col)
    if cuff: g += f'<path d="M{wx-fx*6:.1f},{wy-fy*6:.1f} L{wx:.1f},{wy:.1f}" stroke="{cuff}" stroke-width="{w}" stroke-linecap="butt"/>'
    hx, hy = wx + fx * 4, wy + fy * 4
    if holding == 'bottle':
        g += (f'<g transform="translate({hx+fx*14:.1f},{hy+fy*14:.1f}) rotate({hold_tilt-b+90:.1f})"><rect x="-13" y="-30" width="26" height="58" rx="9" fill="#9fd6f5" stroke="{INK}" stroke-width="5"/>'
              f'<rect x="-11" y="2" width="22" height="24" rx="6" fill="#4aa8e0"/><rect x="-8" y="-42" width="16" height="13" rx="3" fill="#2d6fb5" stroke="{INK}" stroke-width="4"/></g>')
        pose = 'hold'
    g += hand(hx, hy, b, pose, 1.0, _shade(skin, .88) if back else skin)
    return g


def leg(hx, hy, a_hip, knee, L1, L2, w, pants, shoe, back=False):
    dx, dy = _dir(a_hip); kx, ky = hx + dx * L1, hy + dy * L1
    b = a_hip - knee; fx, fy = _dir(b); ax, ay = kx + fx * L2, ky + fy * L2
    col = _shade(pants) if back else pants
    g = stroke2(_poly([(hx, hy), (kx, ky), (ax, ay)]), w, col)
    sh = _shade(shoe) if back else shoe
    g += f'<g transform="translate({ax:.1f},{ay:.1f}) rotate({-(b)*0.35:.1f})"><path d="M-14,-6 Q-16,12 0,13 L30,13 Q40,12 36,0 Q30,-10 10,-10 Z" fill="{sh}" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/></g>'
    return g


# ---------------------------------------------------------------- faces
EMO = {  # brow tilt (inner end up +), brow raise, eye shape, mouth when silent
    'neutral': (0, 0, 'open', 'smile'), 'happy': (0, -3, 'open', 'grin'), 'laugh': (0, -6, 'closed', 'laugh'),
    'excited': (0, -8, 'wide', 'grin'), 'sad': (12, 2, 'sad', 'frown'), 'surprised': (0, -12, 'wide', 'o'),
    'worried': (14, -4, 'open', 'wavy'), 'tired': (6, 4, 'tired', 'flat'), 'thinking': (-8, -2, 'side', 'side'),
    'proud': (0, -2, 'soft', 'grin'), 'warm': (0, -2, 'soft', 'smile')}

KID_SKIN = '#D9A27C'; NANA_SKIN = '#C08A64'; GIRL_SKIN = '#E0AD87'


def skin_defs(skin):
    i = skin.lstrip('#')
    return (f'<defs><radialGradient id="sk{i}" cx="45%" cy="40%" r="62%"><stop offset="0" stop-color="{_shade(skin,1.07)}"/>'
            f'<stop offset=".72" stop-color="{skin}"/><stop offset="1" stop-color="{_shade(skin,.86)}"/></radialGradient></defs>'), f'url(#sk{i})'


def face(cx, cy, r, st, skin=SKIN, beard=None, glasses=None, lashes=False, iris='#5a3a22', brow_w=6.5, brow_col=INK):
    emo = st.get('emo', 'neutral'); tilt_b, raise_b, eye, mshape = EMO.get(emo, EMO['neutral'])
    talk = st.get('mouth', 0); blink = st.get('blink', 0); look = st.get('look', 0); t = st.get('t', 0)
    if eye == 'closed' or blink > 0.85: eye = 'shut'
    fx = r * 0.15 + look * 5; ey = cy - r * 0.06; ex = r * 0.35; mx = cx + fx
    s = ''
    # cheeks
    for sx in (-1, 1): s += f'<ellipse cx="{mx+sx*(ex+10):.1f}" cy="{cy+r*0.28:.1f}" rx="{r*0.17:.1f}" ry="{r*0.11:.1f}" fill="#e9876f" opacity="{.32 if emo in ("happy","laugh","excited","proud") else .18}"/>'
    for sx in (-1, 1):
        x = mx + sx * ex
        open_ = (1 - blink) * (1.25 if eye == 'wide' else 1.0)
        if eye == 'shut':
            s += f'<path d="M{x-13:.1f},{ey+1:.1f} Q{x:.1f},{ey-10:.1f} {x+13:.1f},{ey+1:.1f}" fill="none" stroke="{INK}" stroke-width="4.5" stroke-linecap="round"/>'
            if lashes: s += f'<path d="M{x+sx*13:.1f},{ey+1:.1f} l{sx*6:.1f},-4" stroke="{INK}" stroke-width="3" stroke-linecap="round"/>'
        else:
            rx, ry = 16, max(14 * open_, 1.2)
            lx = look * 4 + (4 if eye == 'side' else 0)
            s += f'<ellipse cx="{x:.1f}" cy="{ey:.1f}" rx="{rx}" ry="{ry:.1f}" fill="#fffdf8" stroke="{_shade(skin,.6)}" stroke-width="1.5"/>'
            ir = min(10, ry + 1)
            s += f'<clipPath id="e{int(x*10)}{int(ey*10)}"><ellipse cx="{x:.1f}" cy="{ey:.1f}" rx="{rx}" ry="{ry:.1f}"/></clipPath>'
            s += f'<g clip-path="url(#e{int(x*10)}{int(ey*10)})"><circle cx="{x+lx:.1f}" cy="{ey+0.5:.1f}" r="{ir:.1f}" fill="{iris}"/><circle cx="{x+lx:.1f}" cy="{ey+0.5:.1f}" r="{ir*0.5:.1f}" fill="#160d08"/>'
            s += f'<circle cx="{x+lx+3:.1f}" cy="{ey-3:.1f}" r="2.6" fill="#fff"/></g>'
            # upper lid / lash line
            top = ey - ry
            s += f'<path d="M{x-rx-1:.1f},{ey+1:.1f} Q{x:.1f},{top-3:.1f} {x+rx+1:.1f},{ey+1:.1f}" fill="none" stroke="{INK}" stroke-width="{4.5 if lashes else 3.5}" stroke-linecap="round"/>'
            if lashes: s += f'<path d="M{x+sx*(rx+1):.1f},{ey:.1f} l{sx*7:.1f},-5" stroke="{INK}" stroke-width="3.5" stroke-linecap="round"/>'
            if eye in ('sad', 'tired', 'soft'):
                drop = {'sad': 0.45, 'tired': 0.55, 'soft': 0.25}[eye]
                ly = ey - ry + 2 * ry * drop
                o_y = ly + (5 if eye == 'sad' else 0); i_y = ly - (4 if eye == 'sad' else 0)
                xl, xr = x - rx - 2, x + rx + 2
                yl, yr = (o_y, i_y) if sx < 0 else (i_y, o_y)
                s += f'<path d="M{xl:.1f},{yl:.1f} L{xr:.1f},{yr:.1f} L{xr:.1f},{ey-ry-6:.1f} L{xl:.1f},{ey-ry-6:.1f}Z" fill="{skin}"/>'
                s += f'<path d="M{xl:.1f},{yl:.1f} L{xr:.1f},{yr:.1f}" stroke="{INK}" stroke-width="4" stroke-linecap="round"/>'
            s += f'<path d="M{x-9:.1f},{ey+ry+4:.1f} Q{x:.1f},{ey+ry+7:.1f} {x+9:.1f},{ey+ry+4:.1f}" fill="none" stroke="{_shade(skin,.8)}" stroke-width="2"/>'
        # eyebrow (thick, shaped); inner end raised for sad/worried
        by = ey - r * 0.36 + raise_b
        xi, xo = (x + sx * -14, x + sx * 15)
        yi = by - tilt_b; yo = by + (2 if tilt_b > 0 else 0)
        if emo == 'thinking' and sx == 1: yi -= 7; yo -= 9
        s += f'<path d="M{xi:.1f},{yi:.1f} Q{x:.1f},{min(yi,yo)-7:.1f} {xo:.1f},{yo:.1f}" fill="none" stroke="{brow_col}" stroke-width="{brow_w}" stroke-linecap="round"/>'
    if glasses == 'aviator':
        for sx in (-1, 1):
            x = mx + sx * ex
            s += f'<path d="M{x-21:.1f},{ey-14:.1f} L{x+21:.1f},{ey-14:.1f} Q{x+23:.1f},{ey+8:.1f} {x+10:.1f},{ey+18:.1f} Q{x:.1f},{ey+22:.1f} {x-12:.1f},{ey+17:.1f} Q{x-23:.1f},{ey+8:.1f} {x-21:.1f},{ey-14:.1f}Z" fill="#cfe6f2" fill-opacity=".22" stroke="#3a2618" stroke-width="5" stroke-linejoin="round"/>'
        s += f'<path d="M{mx-ex+21:.1f},{ey-13:.1f} L{mx+ex-21:.1f},{ey-13:.1f}" stroke="#a88a50" stroke-width="3.5"/><path d="M{mx-ex+20:.1f},{ey-6:.1f} Q{mx:.1f},{ey-10:.1f} {mx+ex-20:.1f},{ey-6:.1f}" fill="none" stroke="#3a2618" stroke-width="3.5"/>'
    # nose: one soft cartoon curve with a nostril, light shadow under the tip
    nx, ny = mx + 4, cy + r * 0.22
    s += f'<path d="M{nx-12:.1f},{ny+4:.1f} Q{nx:.1f},{ny+10:.1f} {nx+10:.1f},{ny+3:.1f}" fill="none" stroke="{_shade(skin,.8)}" stroke-width="7" stroke-linecap="round" opacity=".55"/>'
    s += f'<path d="M{nx+2:.1f},{ey+10:.1f} Q{nx+12:.1f},{ny-8:.1f} {nx+11:.1f},{ny:.1f} Q{nx+9:.1f},{ny+7:.1f} {nx-2:.1f},{ny+5:.1f}" fill="none" stroke="{_shade(skin,.55)}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>'
    s += f'<path d="M{nx-9:.1f},{ny+2:.1f} q2,3 5,3" fill="none" stroke="{_shade(skin,.5)}" stroke-width="3" stroke-linecap="round"/>'
    my = cy + r * 0.47
    lip = _shade(skin, .74); lipin = '#6e1f2a'
    if beard == 'short':
        bc = '#e7e5df'
        s += (f'<path d="M{mx-r*0.92:.1f},{cy-r*0.05:.1f} Q{mx-r*0.95:.1f},{cy+r*0.75:.1f} {mx-r*0.55:.1f},{cy+r*1.02:.1f} Q{mx:.1f},{cy+r*1.28:.1f} {mx+r*0.55:.1f},{cy+r*1.02:.1f} '
              f'Q{mx+r*0.95:.1f},{cy+r*0.75:.1f} {mx+r*0.92:.1f},{cy-r*0.05:.1f} Q{mx+r*0.62:.1f},{cy+r*0.62:.1f} {mx+r*0.26:.1f},{cy+r*0.36:.1f} '
              f'Q{mx:.1f},{cy+r*0.3:.1f} {mx-r*0.26:.1f},{cy+r*0.36:.1f} Q{mx-r*0.62:.1f},{cy+r*0.62:.1f} {mx-r*0.92:.1f},{cy-r*0.05:.1f}Z" fill="{bc}" stroke="#9c958a" stroke-width="3"/>')
        for i in range(14):
            px = mx - r * 0.7 + i * r * 0.1; py = cy + r * (0.75 + 0.25 * math.sin(i * 1.7))
            s += f'<path d="M{px:.1f},{py:.1f} l2,7" stroke="#b9b3a8" stroke-width="2"/>'
        s += f'<path d="M{mx-22:.1f},{cy+r*0.38:.1f} Q{mx:.1f},{cy+r*0.26:.1f} {mx+22:.1f},{cy+r*0.38:.1f}" fill="none" stroke="{bc}" stroke-width="9" stroke-linecap="round"/>'
        my = cy + r * 0.5
    if talk > 0.1:
        wv = 0.5 + 0.5 * math.sin(t * 17.0)
        h = 5 + 20 * talk; w = 12 + 6 * wv + (4 if emo in ('happy', 'excited', 'laugh', 'proud') else 0)
        top = my - 2
        s += f'<path d="M{mx-w:.1f},{top:.1f} Q{mx:.1f},{top-4:.1f} {mx+w:.1f},{top:.1f} Q{mx+w*0.8:.1f},{top+h:.1f} {mx:.1f},{top+h+1:.1f} Q{mx-w*0.8:.1f},{top+h:.1f} {mx-w:.1f},{top:.1f}Z" fill="{lipin}" stroke="{lip}" stroke-width="4.5" stroke-linejoin="round"/>'
        if h > 10: s += f'<path d="M{mx-w*0.68:.1f},{top+2:.1f} Q{mx:.1f},{top+5:.1f} {mx+w*0.68:.1f},{top+2:.1f}" stroke="#fff" stroke-width="4.5" fill="none"/>'
        if h > 14: s += f'<ellipse cx="{mx:.1f}" cy="{top+h*0.78:.1f}" rx="{w*0.45:.1f}" ry="{h*0.18:.1f}" fill="#d9707a"/>'
    else:
        if mshape in ('grin', 'laugh'):
            hh = 17 if mshape == 'laugh' else 11
            s += f'<path d="M{mx-20:.1f},{my-3:.1f} Q{mx:.1f},{my:.1f} {mx+20:.1f},{my-3:.1f} Q{mx+14:.1f},{my+hh:.1f} {mx:.1f},{my+hh+2:.1f} Q{mx-14:.1f},{my+hh:.1f} {mx-20:.1f},{my-3:.1f}Z" fill="{lipin}" stroke="{lip}" stroke-width="4.5" stroke-linejoin="round"/>'
            s += f'<path d="M{mx-14:.1f},{my:.1f} Q{mx:.1f},{my+3:.1f} {mx+14:.1f},{my:.1f}" fill="none" stroke="#fff" stroke-width="4.5"/>'
            if mshape == 'laugh': s += f'<ellipse cx="{mx:.1f}" cy="{my+hh-3:.1f}" rx="8" ry="4" fill="#d9707a"/>'
        elif mshape == 'frown':
            s += f'<path d="M{mx-15:.1f},{my+8:.1f} Q{mx:.1f},{my-3:.1f} {mx+15:.1f},{my+8:.1f}" fill="none" stroke="{lip}" stroke-width="5.5" stroke-linecap="round"/>'
        elif mshape == 'o':
            s += f'<ellipse cx="{mx:.1f}" cy="{my+4:.1f}" rx="9" ry="12" fill="{lipin}" stroke="{lip}" stroke-width="4.5"/>'
        elif mshape == 'wavy':
            s += f'<path d="M{mx-15:.1f},{my+4:.1f} q5,-5 10,0 q5,5 10,0 q5,-5 10,0" fill="none" stroke="{lip}" stroke-width="5" stroke-linecap="round"/>'
        elif mshape == 'flat':
            s += f'<path d="M{mx-13:.1f},{my+3:.1f} Q{mx:.1f},{my+5:.1f} {mx+13:.1f},{my+3:.1f}" fill="none" stroke="{lip}" stroke-width="5" stroke-linecap="round"/>'
        elif mshape == 'side':
            s += f'<path d="M{mx-7:.1f},{my+4:.1f} Q{mx+6:.1f},{my+3:.1f} {mx+15:.1f},{my-3:.1f}" fill="none" stroke="{lip}" stroke-width="5" stroke-linecap="round"/>'
        else:   # gentle closed smile with a soft lower lip
            s += f'<path d="M{mx-16:.1f},{my:.1f} Q{mx:.1f},{my+9:.1f} {mx+16:.1f},{my:.1f}" fill="none" stroke="{lip}" stroke-width="5" stroke-linecap="round"/>'
            s += f'<path d="M{mx-8:.1f},{my+9:.1f} Q{mx:.1f},{my+14:.1f} {mx+8:.1f},{my+9:.1f}" fill="none" stroke="{_shade(skin,.86)}" stroke-width="4" stroke-linecap="round"/>'
    if emo == 'sad' and st.get('tear'):
        k = (t * 0.6) % 1
        s += f'<path d="M{mx+ex:.1f},{ey+14+k*30:.1f} q-6,10 0,15 q6,-5 0,-15Z" fill="#7fd0ff" stroke="#3b7fb3" stroke-width="2" opacity="{1-k:.2f}"/>'
    return s


# ---------------------------------------------------------------- bodies
def _pose(st, walk_amp=1.0):
    """walk/talk/idle motion -> limb angles, body bob/lean, head tilt"""
    t = st.get('t', 0); ph = st.get('walk')
    P = dict(af=st.get('arm_f', 8), ab=st.get('arm_b', 8), ef=st.get('el_f', 14), eb=st.get('el_b', 14),
             hf=st.get('hand_f', 'relax'), hb=st.get('hand_b', 'relax'), lf=0, lb=0, kf=4, kb=4,
             bob=st.get('bob', 0), lean=st.get('tilt', 0), head=st.get('head', 0))
    P['bob'] += math.sin(t * 2.1 + st.get('x', 0) * 0.01) * 1.5
    if ph is not None:
        a = math.sin(ph * 2 * math.pi); c = math.cos(ph * 2 * math.pi)
        P['lf'], P['lb'] = 26 * a * walk_amp, -26 * a * walk_amp
        P['kf'] = 6 + 38 * max(0, -c) ** 1.2 * walk_amp
        P['kb'] = 6 + 38 * max(0, c) ** 1.2 * walk_amp
        P['bob'] += -abs(a) * 8 * walk_amp
        P['lean'] += 4 * walk_amp
        P['head'] += -2 * a
        lag = math.sin(ph * 2 * math.pi - 0.6)                       # forearm follows a little behind
        if 'arm_f' not in st and st.get('hold') is None: P['af'] = 6 - 22 * a * walk_amp; P['ef'] = 20 + 16 * max(0, -lag)
        if 'arm_b' not in st: P['ab'] = 6 + 22 * a * walk_amp; P['eb'] = 20 + 16 * max(0, lag)
        P['lean'] += 1.5 * a
    m = st.get('mouth', 0)
    if m > 0.05:
        P['head'] += 4 * math.sin(t * 5.3)
        if st.get('gesture', True) and 'arm_f' not in st and st.get('hold') is None and ph is None:
            P['af'] = 42 + 16 * math.sin(t * 2.7); P['ef'] = 55 + 18 * math.sin(t * 3.9); P['hf'] = 'open'
    emo = st.get('emo')
    P['shf'] = -9 * max(0.0, min(1.0, (P['af'] - 50) / 90))      # shoulder rises when the arm goes up
    if emo in ('sad', 'tired'): P['head'] += 6; P['lean'] += 3
    if emo in ('surprised', 'excited'): P['head'] -= 4; P['bob'] -= 4
    if emo == 'laugh': P['bob'] += -6 * abs(math.sin(t * 9)); P['head'] += -6 + 3 * math.sin(t * 9)
    if emo == 'thinking' and 'arm_f' not in st:
        P['af'], P['ef'], P['hf'] = 30, 120, 'point'
    if st.get('wave'):
        P['af'], P['ef'], P['hf'] = 95, 60 + 16 * math.sin(t * 7), 'open'
    return P


def kid(st, girl=False):
    x, y, s, f = st['x'], st['y'], st.get('s', 1), st.get('face', 1)
    P = _pose(st)
    skin = GIRL_SKIN if girl else KID_SKIN
    defs, sk = skin_defs(skin)
    if girl: body, pants, shoe, sleeve = '#E86FA0', '#F6D7E6', '#c0396b', '#E86FA0'
    else: body, pants, shoe, sleeve = '#d63a32', '#34405e', '#3a3a44', '#d63a32'
    g = f'{defs}<g transform="translate({x:.1f},{y+P["bob"]*s:.1f}) scale({s*f:.3f},{s:.3f})">'
    g += '<ellipse cx="6" cy="6" rx="62" ry="10" fill="#000" opacity=".12"/>'
    g += f'<g transform="rotate({P["lean"]:.1f},0,-150)">'
    if girl:
        g += arm(-28, -258, P['ab'], P['eb'], 58, 56, 26, sleeve, P['hb'], back=True, skin=skin)
    else:   # T-shirt: short sleeve, bare forearm
        g += arm(-28, -258, P['ab'], P['eb'], 58, 56, 24, skin, P['hb'], back=True, skin=skin)
        g += _sleeve(-28, -258, P['ab'], body, back=True)
    g += leg(-14, -150, P['lb'], P['kb'], 74, 66, 32, pants, shoe, back=True)
    g += leg(14, -150, P['lf'], P['kf'], 74, 66, 32, pants, shoe)
    if girl:
        g += f'<path d="M-46,-286 Q-56,-200 -76,-66 Q0,-50 76,-66 Q56,-200 46,-286 Q0,-300 -46,-286Z" fill="{body}" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>'
        g += '<path d="M-70,-112 Q0,-100 70,-112" fill="none" stroke="#fff" stroke-width="6" opacity=".7"/><circle cx="-30" cy="-180" r="6" fill="#fff" opacity=".6"/><circle cx="20" cy="-150" r="6" fill="#fff" opacity=".6"/><circle cx="34" cy="-215" r="6" fill="#fff" opacity=".6"/>'
    else:   # red T-shirt with a round neck
        g += f'<path d="M-50,-288 Q-56,-210 -58,-140 Q0,-128 58,-140 Q56,-210 50,-288 Q0,-302 -50,-288Z" fill="{body}" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>'
        g += f'<path d="M-58,-150 Q0,-138 58,-150 L60,-128 Q0,-116 -60,-128Z" fill="{pants}" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>'
        g += '<path d="M-18,-292 Q0,-276 18,-292" fill="none" stroke="#a82820" stroke-width="7"/>'
    hy = -356
    g += f'<g transform="rotate({P["head"]:.1f},0,-292)">'
    g += f'<path d="M-15,-300 L-15,-278 L15,-278 L15,-300" fill="{_shade(skin,.86)}" stroke="{INK}" stroke-width="5"/>'
    if girl:
        g += f'<path d="M-88,{hy} Q-94,{hy+92} -60,{hy+96} L60,{hy+96} Q94,{hy+92} 88,{hy} A88,88 0 0 0 -88,{hy}Z" fill="#8E7CC3" stroke="{INK}" stroke-width="5"/>'
        g += f'<ellipse cx="0" cy="{hy+6}" rx="62" ry="66" fill="{sk}" stroke="{INK}" stroke-width="5"/>'
        g += f'<path d="M-66,{hy-2} Q0,{hy-98} 66,{hy-2} Q60,{hy-54} 0,{hy-62} Q-60,{hy-54} -66,{hy-2}Z" fill="#8E7CC3" stroke="{INK}" stroke-width="5"/>'
        g += face(0, hy + 8, 62, st, skin, lashes=True, brow_w=5)
    else:
        # ears (stick out a little), round full face, short black hair with fringe
        g += f'<ellipse cx="-74" cy="{hy+6}" rx="13" ry="20" fill="{skin}" stroke="{INK}" stroke-width="5"/><path d="M-76,{hy-2} q-5,8 1,16" fill="none" stroke="{_shade(skin,.75)}" stroke-width="3"/>'
        g += f'<path d="M-72,{hy-6} Q-76,{hy+50} -40,{hy+70} Q0,{hy+86} 44,{hy+68} Q78,{hy+48} 74,{hy-6} Q70,{hy-74} 0,{hy-78} Q-68,{hy-74} -72,{hy-6}Z" fill="{sk}" stroke="{INK}" stroke-width="5"/>'
        # short hair only at the temples (by the ears) and a spiky fringe; the topi covers the rest of the head
        g += f'<path d="M-76,{hy-26} Q-80,{hy-6} -70,{hy+8} L-62,{hy-6} L-60,{hy-30}Z" fill="#1d1a1c" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/>'
        g += f'<path d="M74,{hy-26} Q78,{hy-8} 70,{hy+4} L62,{hy-8} L60,{hy-30}Z" fill="#1d1a1c" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/>'
        g += f'<path d="M-40,{hy-46} L-34,{hy-24} L-24,{hy-42} L-14,{hy-22} L-4,{hy-42} L6,{hy-23} L16,{hy-42} L26,{hy-25} L36,{hy-42} L44,{hy-30} L46,{hy-46}Z" fill="#1d1a1c" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/>'
        g += f'<path d="M-77,{hy-24} Q-78,{hy-92} 0,{hy-95} Q78,{hy-92} 77,{hy-24} Q40,{hy-44} 0,{hy-46} Q-40,{hy-44} -77,{hy-24}Z" fill="#fbfaf6" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>'
        g += f'<path d="M-72,{hy-36} Q0,{hy-60} 72,{hy-36}" fill="none" stroke="#dcd7c8" stroke-width="5"/>' + ''.join(f'<circle cx="{cx}" cy="{hy-72+abs(cx)*0.1:.0f}" r="3" fill="#dcd7c8"/>' for cx in (-42, -14, 14, 42))
        g += face(0, hy + 4, 70, st, skin, brow_w=8, brow_col='#1d1a1c')
    g += '</g>'
    if girl:
        g += arm(30, -258 + P['shf'], P['af'], P['ef'], 58, 56, 26, sleeve, P['hf'], holding=st.get('hold'), hold_tilt=st.get('hold_tilt', 0), skin=skin) + cap(30, -258 + P['shf'], P['af'], sleeve, 18)
    else:
        g += arm(30, -258 + P['shf'], P['af'], P['ef'], 58, 56, 24, skin, P['hf'], holding=st.get('hold'), hold_tilt=st.get('hold_tilt', 0), skin=skin)
        g += _sleeve(30, -258 + P['shf'], P['af'], body)
    return g + '</g></g>'


def cap(sx, sy, a, col, r, back=False):
    """blend an arm root into the body: fill over the seam, then redraw just the outer shoulder contour"""
    c = _shade(col) if back else col
    dx, dy = _dir(a); ang = math.degrees(math.atan2(dy, dx))      # arm direction in screen degrees
    a0, a1 = math.radians(-160), math.radians(-20)               # contour over the top of the shoulder
    p0 = (sx + r * math.cos(a0), sy + r * math.sin(a0)); p1 = (sx + r * math.cos(a1), sy + r * math.sin(a1))
    return f'<circle cx="{sx}" cy="{sy}" r="{r-3:.1f}" fill="{c}"/>'



def _sleeve(sx, sy, a, col, back=False):
    dx, dy = _dir(a); ex, ey = sx + dx * 30, sy + dy * 30
    c = _shade(col) if back else col
    return stroke2(f'M{sx},{sy} L{ex:.1f},{ey:.1f}', 34, c) + cap(sx, sy, a, col, 20, back)


def nana(st):
    x, y, s, f = st['x'], st['y'], st.get('s', 1), st.get('face', 1)
    P = _pose(st, 0.7)
    skin = NANA_SKIN; defs, sk = skin_defs(skin); kurta = '#f6f5f0'
    g = f'{defs}<g transform="translate({x:.1f},{y+P["bob"]*s:.1f}) scale({s*f:.3f},{s:.3f})">'
    g += '<ellipse cx="6" cy="6" rx="70" ry="11" fill="#000" opacity=".12"/>'
    g += f'<g transform="rotate({P["lean"]:.1f},0,-170)">'
    g += arm(-36, -388, P['ab'], P['eb'], 84, 80, 30, kurta, P['hb'], back=True, skin=skin)
    g += leg(-16, -170, P['lb'], P['kb'], 86, 80, 34, '#ecebe4', '#5a3b28', back=True)
    g += leg(16, -170, P['lf'], P['kf'], 86, 80, 34, '#ecebe4', '#5a3b28')
    g += f'<path d="M-64,-416 Q-74,-300 -82,-122 Q0,-106 82,-122 Q74,-300 64,-416 Q0,-432 -64,-416Z" fill="{kurta}" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>'
    g += f'<path d="M8,-412 L8,-250" stroke="#d8d6cc" stroke-width="4"/>' + ''.join(f'<circle cx="8" cy="{yy}" r="4.5" fill="#e9e6da" stroke="#9c958a" stroke-width="1.5"/>' for yy in (-392, -354, -316, -278))
    g += f'<rect x="22" y="-330" width="34" height="38" rx="4" fill="none" stroke="#d2d0c6" stroke-width="3.5"/>'
    hy = -484
    g += f'<g transform="rotate({P["head"]:.1f},0,-426)">'
    g += f'<path d="M-24,-432 L-26,-412 Q0,-404 26,-412 L24,-432Z" fill="{kurta}" stroke="{INK}" stroke-width="4"/>'
    g += f'<path d="M-15,-438 L-15,-424 L15,-424 L15,-438" fill="{_shade(skin,.86)}" stroke="{INK}" stroke-width="4"/>'
    g += f'<ellipse cx="-62" cy="{hy+6}" rx="11" ry="17" fill="{skin}" stroke="{INK}" stroke-width="5"/>'
    g += f'<path d="M-60,{hy-14} Q-62,{hy+52} -30,{hy+70} Q0,{hy+82} 32,{hy+70} Q64,{hy+52} 62,{hy-14} Q58,{hy-78} 0,{hy-80} Q-58,{hy-78} -60,{hy-14}Z" fill="{sk}" stroke="{INK}" stroke-width="5"/>'
    # short grey hair: thin on top, fuller at the sides
    g += f'<path d="M-62,{hy+2} Q-70,{hy-58} -30,{hy-78} Q0,{hy-88} 34,{hy-78} Q70,{hy-58} 62,{hy+2} L56,{hy-14} Q50,{hy-58} 0,{hy-66} Q-50,{hy-58} -56,{hy-14}Z" fill="#c9c6c0" stroke="#8d877d" stroke-width="3.5"/>'
    g += f'<path d="M-24,{hy-76} q10,-6 22,-2 M6,{hy-80} q12,-4 22,2" fill="none" stroke="#e8e6e1" stroke-width="4" stroke-linecap="round"/>'
    g += face(0, hy, 62, st, skin, beard='short', glasses='aviator', brow_w=6, brow_col='#8a8379')
    g += '</g>'
    g += arm(38, -388 + P['shf'], P['af'], P['ef'], 84, 80, 30, kurta, P['hf'], skin=skin) + cap(38, -388 + P['shf'], P['af'], kurta, 21)
    return g + '</g></g>'


def cat(st):
    """pose: lie | sit | walk | drink. eyes: 0 open..1 shut (tired = .55). mouth 0..1 (meow)."""
    x, y, s, f = st['x'], st['y'], st.get('s', 1), st.get('face', 1)
    pose = st.get('pose', 'sit'); t = st.get('t', 0); OR = '#F4A340'; ORD = '#d9822b'
    SW = f'stroke="{INK}" stroke-width="5" stroke-linejoin="round"'
    g = f'<g transform="translate({x:.1f},{y:.1f}) scale({s*f:.3f},{s:.3f})"><ellipse cx="0" cy="4" rx="80" ry="10" fill="#000" opacity=".12"/>'
    happy = st.get('happy'); wag = math.sin(t * (5 if happy else 2)) * (26 if happy else 10)
    breath = math.sin(t * 2.4) * 2
    if pose == 'lie':
        tail = f'M-80,-30 Q-150,{-40+wag*0.3:.1f} -140,-6'
        g += stroke2(tail, 13, OR)
        g += f'<ellipse cx="0" cy="{-30-breath*0.5:.1f}" rx="92" ry="{34+breath:.1f}" fill="{OR}" {SW}/>'
        for i in (-40, -10, 20): g += f'<path d="M{i},-62 q8,14 0,26" stroke="{ORD}" stroke-width="7" fill="none" stroke-linecap="round"/>'
        hx, hy, tilt = 88, -40, 18
    else:
        tail = f'M-58,-46 Q-120,{-110+wag:.1f} {-96+wag*0.6:.1f},-170' if happy or pose == 'walk' else f'M-58,-30 Q-120,-20 -110,{-70+wag*0.4:.1f}'
        g += stroke2(tail, 13, OR)
        if pose == 'walk':
            a = math.sin(st.get('walk', 0) * 2 * math.pi)
            for lx, sgn in ((-40, 1), (-22, -1), (34, -1), (52, 1)):
                g += stroke2(f'M{lx},-44 L{lx+sgn*a*14:.1f},-4', 18, OR if sgn > 0 else ORD, 4)
            g += f'<ellipse cx="6" cy="{-62+abs(a)*3:.1f}" rx="78" ry="36" fill="{OR}" {SW}/>'
            hx, hy, tilt = 82, -96 + abs(a) * 3, 0
        else:
            g += f'<ellipse cx="-6" cy="{-58-breath*0.5:.1f}" rx="62" ry="{54+breath:.1f}" fill="{OR}" {SW}/>'
            g += stroke2('M20,-36 L20,-4', 18, OR, 4) + stroke2('M44,-36 L44,-4', 18, OR, 4)
            g += f'<ellipse cx="10" cy="-62" rx="26" ry="30" fill="#fbe6c8"/>'
            hx, hy, tilt = 34, -128, 0
            if pose == 'drink':
                dip = (math.sin(t * 2 * math.pi * 2.6) + 1) / 2
                hx, hy, tilt = 70, -60 + dip * 8, 34
        for i in (-30, -6): g += f'<path d="M{i},-104 q8,12 0,22" stroke="{ORD}" stroke-width="7" fill="none" stroke-linecap="round"/>'
    tilt += st.get('head', 0) + (6 * math.sin(t * 3) if happy else 0)
    g += f'<g transform="translate({hx:.1f},{hy:.1f}) rotate({tilt:.1f})">'
    g += f'<path d="M-34,-18 L-30,-62 L-6,-34Z" fill="{OR}" {SW}/><path d="M34,-18 L30,-62 L6,-34Z" fill="{OR}" {SW}/>'
    g += '<path d="M-27,-28 L-26,-50 L-12,-34Z" fill="#f7b6b6"/><path d="M27,-28 L26,-50 L12,-34Z" fill="#f7b6b6"/>'
    g += f'<ellipse cx="0" cy="0" rx="44" ry="38" fill="{OR}" {SW}/><path d="M-8,-36 l8,10 l8,-10" stroke="{ORD}" stroke-width="5" fill="none"/>'
    e = st.get('eyes', 0)
    for sx in (-1, 1):
        if happy and e < 0.5:
            g += f'<path d="M{sx*16-9},-4 Q{sx*16},-14 {sx*16+9},-4" fill="none" stroke="{INK}" stroke-width="5" stroke-linecap="round"/>'
        else:
            g += f'<ellipse cx="{sx*16}" cy="-4" rx="8.5" ry="{max(11*(1-e),1.5):.1f}" fill="#7cc36a" stroke="{INK}" stroke-width="3"/><ellipse cx="{sx*16}" cy="-4" rx="3" ry="{max(8*(1-e),1):.1f}" fill="{INK}"/>'
            if e > 0.3: g += f'<path d="M{sx*16-11},{-4-11*(1-e):.1f} L{sx*16+11},{-4-11*(1-e):.1f}" stroke="{ORD}" stroke-width="6"/>'
    g += f'<path d="M-5,8 L5,8 L0,14Z" fill="#e57a8a" stroke="{INK}" stroke-width="3"/>'
    m = st.get('mouth', 0)
    if m > 0.1: g += f'<ellipse cx="0" cy="{22+m*5:.1f}" rx="{8+m*4:.1f}" ry="{4+m*9:.1f}" fill="#7a2230" {SW}/>'
    else: g += f'<path d="M-10,18 Q-4,24 0,16 Q4,24 10,18" fill="none" stroke="{INK}" stroke-width="3"/>'
    if st.get('tongue'): g += f'<ellipse cx="2" cy="28" rx="7" ry="10" fill="#e57a8a" {SW}/>'
    for sx in (-1, 1):
        for dy in (-3, 5): g += f'<path d="M{sx*24},{12+dy} L{sx*52},{8+dy*2}" stroke="{INK}" stroke-width="2"/>'
    return g + '</g></g>'
