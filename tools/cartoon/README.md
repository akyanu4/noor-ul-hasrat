# Kids cartoons (2D)
Free 2D cartoon pipeline: SVG puppet characters (chars.py), story beats (story.py), Kokoro TTS voices (voices.py), renderer (render.py).
Setup: pip install kokoro-onnx soundfile cairosvg; download kokoro-v1.0.int8.onnx and voices-v1.0.bin from
github.com/thewh1teagle/kokoro-onnx/releases (model-files-v1.0) into models/.
Run: python3 voices.py && python3 render.py frames 5,20,40 && python3 render.py video 2
First pilot: "Ali and the Thirsty Cat" (1:48).

## Urdu version ("علی اور پیاسی بلی", 2:06)
Files: story_ur.py (Urdu captions + the same lines in Devanagari for the voices, with an emotion per line),
voices_ur.py (Kokoro Hindi voices hf_alpha/hf_beta/hm_omega; emotion sets speed, pitch, loudness),
chars2.py (v2 characters: Ali and Nana drawn from family photos, real eyes/brows/lips, hands with fingers, bending
elbows/knees, expressions), render_ur.py (Nastaliq captions and cards via PIL+raqm).
Font: Noto Nastaliq Urdu (github.com/notofonts/nastaliq releases) in ~/.fonts, or set URDU_FONT / URDU_FONT_BOLD.
Run: python3 voices_ur.py && python3 render_ur.py frames 5,30,60 && python3 render_ur.py video 2
Output: build_ur/ali_aur_pyasi_billi_urdu.mp4. Nastaliq text can't go through cairosvg (no shaping), so all Urdu text is drawn with PIL.
