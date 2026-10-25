#!/bin/bash
# One-time setup in a fresh session: fonts (from npm, the only reliable source here) and Python packages.
set -e; cd "$(dirname "$0")"; mkdir -p .fonts; cd .fonts
for p in @fontsource/noto-nastaliq-urdu@5.3.0 @fontsource/cormorant-garamond@5.3.0 @fontsource/montserrat@5.3.0; do
  n=$(echo $p | sed 's#@fontsource/##; s#@.*##'); [ -d "fontsource-$n-5.3.0" ] || [ "$n" = montserrat -a -d montserrat ] && continue
  npm pack "$p" --silent >/dev/null; t=$(ls fontsource-$n-*.tgz | head -1)
  if [ "$n" = montserrat ]; then mkdir -p montserrat && tar xzf "$t" -C montserrat; else mkdir -p "fontsource-$n-5.3.0" && tar xzf "$t" -C "fontsource-$n-5.3.0"; fi
done
python3 -c "import PIL, numpy" 2>/dev/null || pip install --break-system-packages -q pillow numpy
python3 -c "from PIL import features; print('raqm (needed for Urdu):', features.check('raqm'))"
which ffmpeg >/dev/null && echo "ffmpeg ok" || echo "ffmpeg missing: apt-get install -y ffmpeg"
