"""Where things are. A project folder (NOOR_PROJECT, default: current folder) holds captions.py, timeline.py and
project.json: {"audio": "...", "music": "...", "photo": "...", "header_name": "..."}; paths may be relative to it.
Renders go to <project>/out, scratch files to <project>/work. Fonts come from tools/shorts/.fonts (setup.sh)."""
import os, json
ENGINE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(ENGINE)
PROJECT = os.path.abspath(os.environ.get("NOOR_PROJECT") or os.getcwd())
ASSETS = os.path.join(ROOT, "assets")
FONTS = os.environ.get("NOOR_FONTS") or os.path.join(ROOT, ".fonts")
try: P = json.load(open(os.path.join(PROJECT, "project.json")))
except FileNotFoundError: P = {}
def path(key, default=None):
    v = P.get(key) or default
    return v if not v or os.path.isabs(v) else os.path.join(PROJECT, v)
OUT = os.path.join(PROJECT, "out"); WORK = os.path.join(PROJECT, "work")
os.makedirs(OUT, exist_ok=True); os.makedirs(WORK, exist_ok=True)
AUDIO = path("audio"); MUSIC = path("music"); PHOTO = path("photo") or os.path.join(ASSETS, "shaykh_azam_pasha.jpg")
