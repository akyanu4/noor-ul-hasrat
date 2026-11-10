"""2D puppet characters as SVG groups. Origin = between the feet; facing +1 = right, -1 = left.
Arm angles in degrees: 0 hangs down, 90 points forward, 180 straight up. Mouth 0..1 open. Blink 0 open .. 1 shut."""
import math

INK = '#3b2a20'
SKIN = '#F2C29B'; SKIN_D = '#E2A97F'
SW = 'stroke="%s" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"' % INK


def _arm(sx, sy, ang, length, width, sleeve, hand=SKIN, back=False, holding=None, hold_tilt=0):
    col = sleeve if not back else _shade(sleeve)
    g = f'<g transform="translate({sx},{sy}) rotate({-ang})">'
    g += f'<rect x="{-width/2}" y="0" width="{width}" height="{length}" rx="{width/2}" fill="{col}" {SW}/>'
    if holding == 'bottle':
        g += f'<g transform="translate(0,{length+4}) rotate({hold_tilt})"><rect x="-13" y="-26" width="26" height="54" rx="8" fill="#9fd6f5" {SW}/>' \
             f'<rect x="-13" y="2" width="26" height="26" rx="6" fill="#4aa8e0" stroke="none"/><rect x="-8" y="-38" width="16" height="13" rx="3" fill="#2d6fb5" {SW}/></g>'
    g += f'<circle cx="0" cy="{length+4}" r="{width*0.62}" fill="{hand if not back else SKIN_D}" {SW}/>'
    return g + '</g>'


def _shade(hexc, f=0.82):
    h = hexc.lstrip('#'); r, g, b = (int(h[i:i+2], 16) for i in (0, 2, 4))
    return '#%02x%02x%02x' % (int(r*f), int(g*f), int(b*f))


def _leg(hx, hy, ang, length, width, pants, shoe):
    return (f'<g transform="translate({hx},{hy}) rotate({-ang})"><rect x="{-width/2}" y="0" width="{width}" height="{length}" rx="{width/2.2}" fill="{pants}" {SW}/>'
            f'<ellipse cx="{width*0.35}" cy="{length+2}" rx="{width*0.95}" ry="{width*0.5}" fill="{shoe}" {SW}/></g>')


def _face(cx, cy, r, mouth, blink, look=0, beard=False, glasses=False, happy=0):
    fx = r * 0.16 + look * 6          # features shifted toward the facing side
    ey = cy - r * 0.08; ex = r * 0.34
    s = ''
    # cheeks
    if not beard:
        s += f'<circle cx="{cx+fx-ex-10}" cy="{cy+r*0.22}" r="{r*0.15}" fill="#f29a9a" opacity=".45"/><circle cx="{cx+fx+ex+10}" cy="{cy+r*0.22}" r="{r*0.15}" fill="#f29a9a" opacity=".45"/>'
    for sx in (-1, 1):
        x = cx + fx + sx * ex
        if happy > 0.5 or blink > 0.85:     # closed / smiling eyes
            s += f'<path d="M{x-10},{ey+2} Q{x},{ey-9 if happy>0.5 else ey+4} {x+10},{ey+2}" fill="none" {SW}/>'
        else:
            ry = 13 * (1 - blink)
            s += f'<ellipse cx="{x+look*3}" cy="{ey}" rx="10" ry="{max(ry,1.5)}" fill="{INK}"/><circle cx="{x+look*3+3}" cy="{ey-4}" r="3.4" fill="#fff"/>'
        s += f'<path d="M{x-12},{ey-24} Q{x},{ey-31} {x+12},{ey-25}" fill="none" stroke="{INK}" stroke-width="5" stroke-linecap="round"/>'
    if glasses:
        for sx in (-1, 1):
            s += f'<circle cx="{cx+fx+sx*ex}" cy="{ey}" r="17" fill="none" stroke="#5b4636" stroke-width="4"/>'
        s += f'<path d="M{cx+fx-ex+17},{ey} L{cx+fx+ex-17},{ey}" stroke="#5b4636" stroke-width="4"/>'
    # nose
    s += f'<path d="M{cx+fx+4},{cy+r*0.02} q8,10 -2,14" fill="none" stroke="{INK}" stroke-width="4" stroke-linecap="round"/>'
    my = cy + r * 0.42
    if beard:
        s += (f'<path d="M{cx+fx-r*0.75},{cy+r*0.15} Q{cx+fx-r*0.8},{cy+r*1.55} {cx+fx},{cy+r*1.7} Q{cx+fx+r*0.8},{cy+r*1.55} {cx+fx+r*0.75},{cy+r*0.15} '
              f'Q{cx+fx},{cy+r*0.62} {cx+fx-r*0.75},{cy+r*0.15}Z" fill="#f4f4f0" {SW}/>')
        s += f'<path d="M{cx+fx-26},{cy+r*0.3} Q{cx+fx},{cy+r*0.16} {cx+fx+26},{cy+r*0.3}" fill="none" stroke="#e8e6df" stroke-width="12" stroke-linecap="round"/>'
        my = cy + r * 0.48
    if mouth > 0.12:
        h = 6 + 20 * mouth
        s += f'<ellipse cx="{cx+fx}" cy="{my+h*0.25}" rx="{13+4*mouth}" ry="{h/2}" fill="#7a2230" {SW}/><ellipse cx="{cx+fx}" cy="{my+h*0.45}" rx="{7+2*mouth}" ry="{h/5}" fill="#e2727c"/>'
    else:
        w = 16 + happy * 6
        s += f'<path d="M{cx+fx-w},{my-2} Q{cx+fx},{my+12+happy*6} {cx+fx+w},{my-2}" fill="{"#7a2230" if happy>0.5 else "none"}" {SW}/>'
    return s


def kid(st, girl=False):
    """st: x,y,s,face,walk(phase or None),arm_f,arm_b,mouth,blink,look,tilt,hold,hold_tilt,happy,bob"""
    x, y, s, f = st['x'], st['y'], st.get('s', 1), st.get('face', 1)
    ph = st.get('walk'); legA = legB = 0; bob = st.get('bob', 0)
    arm_f, arm_b = st.get('arm_f', 8), st.get('arm_b', 8)
    if ph is not None:
        a = math.sin(ph * 2 * math.pi); legA, legB = 24 * a, -24 * a; bob += -abs(a) * 7
        arm_f += -18 * a if st.get('hold') is None else 0; arm_b += 18 * a
    body = '#E86FA0' if girl else '#2E8B57'; pants = '#F7F2E6' if not girl else '#F6D7E6'
    shoe = '#6b3f2a' if not girl else '#c0396b'
    g = f'<g transform="translate({x},{y+bob*s}) scale({s*f},{s}) rotate({st.get("tilt",0)},0,-150)">'
    # back arm, legs
    g += _arm(-30, -262, arm_b, 112, 30, body, back=True)
    g += _leg(-16, -140, legB, 132, 34, _shade(pants, .9), shoe) + _leg(16, -140, legA, 132, 34, pants, shoe)
    # body
    if girl:
        g += f'<path d="M-50,-282 Q-58,-200 -78,-60 Q0,-46 78,-60 Q58,-200 50,-282 Q0,-296 -50,-282Z" fill="{body}" {SW}/>'
        g += '<path d="M-70,-110 Q0,-98 70,-110" fill="none" stroke="#fff" stroke-width="6" opacity=".7"/>'
    else:
        g += f'<path d="M-52,-284 Q-60,-200 -64,-112 Q0,-100 64,-112 Q60,-200 52,-284 Q0,-298 -52,-284Z" fill="{body}" {SW}/>'
        g += '<path d="M8,-280 L8,-200" stroke="#1f6b42" stroke-width="5"/><circle cx="8" cy="-262" r="4" fill="#f5e9b0"/><circle cx="8" cy="-238" r="4" fill="#f5e9b0"/>'
    # head
    hy = -352
    if girl:
        g += f'<path d="M-86,{hy} Q-92,{hy+90} -64,{hy+98} L64,{hy+98} Q92,{hy+90} 86,{hy} A86,86 0 0 0 -86,{hy}Z" fill="#8E7CC3" {SW}/>'
        g += f'<circle cx="0" cy="{hy+4}" r="64" fill="{SKIN}" {SW}/>'
        g += f'<path d="M-66,{hy-4} Q0,{hy-96} 66,{hy-4} Q60,{hy-56} 0,{hy-64} Q-60,{hy-56} -66,{hy-4}Z" fill="#8E7CC3" {SW}/>'
        g += _face(0, hy + 4, 64, st.get('mouth', 0), st.get('blink', 0), st.get('look', 0), happy=st.get('happy', 0))
    else:
        g += f'<circle cx="0" cy="{hy}" r="72" fill="{SKIN}" {SW}/>'
        g += f'<path d="M-66,{hy-26} Q-60,{hy-74} 0,{hy-78} Q60,{hy-74} 66,{hy-26} Q0,{hy-46} -66,{hy-26}Z" fill="#ffffff" {SW}/>'
        g += f'<path d="M-62,{hy-34} Q0,{hy-52} 62,{hy-34}" fill="none" stroke="#d9d4c3" stroke-width="5"/>'
        g += _face(0, hy, 72, st.get('mouth', 0), st.get('blink', 0), st.get('look', 0), happy=st.get('happy', 0))
    # front arm
    g += _arm(32, -262, arm_f, 112, 30, body, holding=st.get('hold'), hold_tilt=st.get('hold_tilt', 0))
    return g + '</g>'


def nana(st):
    x, y, s, f = st['x'], st['y'], st.get('s', 1), st.get('face', 1)
    ph = st.get('walk'); legA = legB = 0; bob = st.get('bob', 0)
    arm_f, arm_b = st.get('arm_f', 6), st.get('arm_b', 6)
    if ph is not None:
        a = math.sin(ph * 2 * math.pi); legA, legB = 18 * a, -18 * a; bob += -abs(a) * 5
    g = f'<g transform="translate({x},{y+bob*s}) scale({s*f},{s})">'
    g += _arm(-38, -392, arm_b, 160, 32, '#ece4d2', back=True)
    g += _leg(-18, -170, legB, 162, 36, '#d8d0bd', '#5a3b28') + _leg(18, -170, legA, 162, 36, '#ece4d2', '#5a3b28')
    g += f'<path d="M-62,-412 Q-72,-300 -80,-118 Q0,-104 80,-118 Q72,-300 62,-412 Q0,-428 -62,-412Z" fill="#ece4d2" {SW}/>'
    g += f'<path d="M-60,-406 L-40,-140 L-8,-140 L-8,-404Z" fill="#7b5a3c" {SW}/><path d="M60,-406 L40,-140 L12,-140 L12,-404Z" fill="#7b5a3c" {SW}/>'
    hy = -476
    g += f'<circle cx="0" cy="{hy}" r="62" fill="{SKIN}" {SW}/>'
    g += f'<path d="M-58,{hy-22} Q-52,{hy-70} 0,{hy-72} Q52,{hy-70} 58,{hy-22} Q0,{hy-38} -58,{hy-22}Z" fill="#fff" {SW}/>'
    g += _face(0, hy, 62, st.get('mouth', 0), st.get('blink', 0), st.get('look', 0), beard=True, glasses=True, happy=st.get('happy', 0))
    g += _arm(40, -392, arm_f, 160, 32, '#ece4d2')
    return g + '</g>'


def cat(st):
    """pose: lie | sit | walk | drink. eyes: 0 open..1 shut (tired = .55). mouth 0..1 (meow). tail phase t."""
    x, y, s, f = st['x'], st['y'], st.get('s', 1), st.get('face', 1)
    pose = st.get('pose', 'sit'); t = st.get('t', 0); OR = '#F4A340'; ORD = '#d9822b'
    g = f'<g transform="translate({x},{y}) scale({s*f},{s})">'
    wag = math.sin(t * (5 if st.get('happy') else 2)) * (26 if st.get('happy') else 10)
    if pose == 'lie':
        g += f'<path d="M-80,-30 Q-150,{-40+wag*0.3} -140,-6" fill="none" stroke="{INK}" stroke-width="22" stroke-linecap="round"/><path d="M-80,-30 Q-150,{-40+wag*0.3} -140,-6" fill="none" stroke="{OR}" stroke-width="13" stroke-linecap="round"/>'
        g += f'<ellipse cx="0" cy="-30" rx="92" ry="34" fill="{OR}" {SW}/>'
        for i in (-40, -10, 20): g += f'<path d="M{i},-62 q8,14 0,26" stroke="{ORD}" stroke-width="7" fill="none" stroke-linecap="round"/>'
        hx, hy, tilt = 88, -40, 18
    else:
        bodyc = (0, -62) if pose in ('sit', 'drink') else (0, -58)
        tail = f'M-58,-46 Q{-120},{-110+wag} {-96+wag*0.6},{-170}' if st.get('happy') or pose == 'walk' else f'M-58,-30 Q-120,-20 -110,{-70+wag*0.4}'
        g += f'<path d="{tail}" fill="none" stroke="{INK}" stroke-width="22" stroke-linecap="round"/><path d="{tail}" fill="none" stroke="{OR}" stroke-width="13" stroke-linecap="round"/>'
        if pose == 'walk':
            a = math.sin(st.get('walk', 0) * 2 * math.pi)
            for lx, sgn in ((-40, 1), (-22, -1), (34, -1), (52, 1)):
                g += f'<g transform="translate({lx},-40) rotate({sgn*a*22})"><rect x="-10" y="0" width="20" height="44" rx="9" fill="{OR if sgn>0 else ORD}" {SW}/></g>'
            g += f'<ellipse cx="6" cy="-62" rx="78" ry="36" fill="{OR}" {SW}/>'
            hx, hy, tilt = 82, -96, 0
        else:
            g += f'<ellipse cx="-6" cy="-58" rx="62" ry="54" fill="{OR}" {SW}/>'
            g += f'<rect x="10" y="-40" width="20" height="42" rx="9" fill="{OR}" {SW}/><rect x="34" y="-40" width="20" height="42" rx="9" fill="{OR}" {SW}/>'
            g += f'<ellipse cx="10" cy="-62" rx="26" ry="30" fill="#fbe6c8" stroke="none"/>'
            hx, hy, tilt = 34, -128, 0
            if pose == 'drink':
                dip = (math.sin(t * 2 * math.pi * 2.6) + 1) / 2
                hx, hy, tilt = 70, -60 + dip * 8, 34
        for i in (-30, -6): g += f'<path d="M{i},-104 q8,12 0,22" stroke="{ORD}" stroke-width="7" fill="none" stroke-linecap="round"/>'
    # head
    g += f'<g transform="translate({hx},{hy}) rotate({tilt})">'
    g += f'<path d="M-34,-18 L-30,-62 L-6,-34Z" fill="{OR}" {SW}/><path d="M34,-18 L30,-62 L6,-34Z" fill="{OR}" {SW}/>'
    g += '<path d="M-27,-28 L-26,-50 L-12,-34Z" fill="#f7b6b6"/><path d="M27,-28 L26,-50 L12,-34Z" fill="#f7b6b6"/>'
    g += f'<ellipse cx="0" cy="0" rx="44" ry="38" fill="{OR}" {SW}/><path d="M-8,-36 l8,10 l8,-10" stroke="{ORD}" stroke-width="5" fill="none"/>'
    e = st.get('eyes', 0)
    for sx in (-1, 1):
        if st.get('happy') and e < 0.5:
            g += f'<path d="M{sx*16-9},-4 Q{sx*16},-14 {sx*16+9},-4" fill="none" {SW}/>'
        else:
            g += f'<ellipse cx="{sx*16}" cy="-4" rx="8" ry="{max(11*(1-e),1.5)}" fill="#2f5b2a" stroke="{INK}" stroke-width="3"/><ellipse cx="{sx*16}" cy="-4" rx="3" ry="{max(8*(1-e),1)}" fill="{INK}"/>'
            if e > 0.3: g += f'<path d="M{sx*16-11},{-4-11*(1-e)} L{sx*16+11},{-4-11*(1-e)}" stroke="{ORD}" stroke-width="6"/>'
    g += '<path d="M-5,8 L5,8 L0,14Z" fill="#e57a8a" stroke="#3b2a20" stroke-width="3"/>'
    m = st.get('mouth', 0)
    if m > 0.1: g += f'<ellipse cx="0" cy="{22+m*5}" rx="{8+m*4}" ry="{4+m*9}" fill="#7a2230" {SW}/>'
    else: g += f'<path d="M-10,18 Q-4,24 0,16 Q4,24 10,18" fill="none" stroke="{INK}" stroke-width="3"/>'
    if st.get('tongue'): g += f'<ellipse cx="2" cy="28" rx="7" ry="10" fill="#e57a8a" {SW}/>'
    for sx in (-1, 1):
        for dy in (-3, 5): g += f'<path d="M{sx*24},{12+dy} L{sx*52},{8+dy*2}" stroke="{INK}" stroke-width="2"/>'
    g += '</g></g>'
    return g
