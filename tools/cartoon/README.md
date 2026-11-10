# Kids cartoons (2D)
Free 2D cartoon pipeline: SVG puppet characters (chars.py), story beats (story.py), Kokoro TTS voices (voices.py), renderer (render.py).
Setup: pip install kokoro-onnx soundfile cairosvg; download kokoro-v1.0.int8.onnx and voices-v1.0.bin from
github.com/thewh1teagle/kokoro-onnx/releases (model-files-v1.0) into models/.
Run: python3 voices.py && python3 render.py frames 5,20,40 && python3 render.py video 2
First pilot: "Ali and the Thirsty Cat" (1:48).
