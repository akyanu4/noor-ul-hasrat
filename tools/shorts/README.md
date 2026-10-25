# Noor-ul-Hasrat Shorts pipeline

Turns one Urdu dars recording into a full video (16:9) and several YouTube Shorts (9:16): his voice with English
captions, animated scenes that follow the words, calm nasheed **only in the pauses** (never under his voice), and his
glowing photo on the opening and closing cards. Nothing here is uploaded to Vercel (`.vercelignore`).

```
tools/shorts/
  setup.sh                 fonts (npm) + python packages, once per fresh session
  engine/                  the renderer (shared by every dars)
    cfg.py                 paths: NOOR_PROJECT=<project folder>
    lib.py                 drawing kit: gradients, glow, Urdu text, captions, figures, domes
    scenes_a..f.py         scene library (see below)
    render.py              render a timeline: full | short <Name> | frames (preview stills)
    audio.py               soundtrack: voice segments + nasheed in pauses
    patch_shorts.py        adds the 3.5 s opening photo card + closing card, then the soundtrack
    srt_to_captions.py     SRT -> captions.py
  assets/                  shaykh photo, scene images
  projects/<date>-<name>/  one folder per dars: project.json, captions.py, timeline.py (+ audio/, music/, out/ not in git)
```

## Steps for a new dars

1. **Transcribe.** This session can't run speech-to-text models (their downloads are blocked). Use TurboScribe
   (or similar): Urdu audio -> English translation -> export **SRT**. Attach the audio and the SRT.
2. **Project folder.** `projects/<yyyy-mm>-<short-name>/` with `audio/dars.mp3` (the recording), `music/nasheed.mp3`
   (a calm nasheed you have the right to use, e.g. from Pixabay), and `project.json` (copy the example).
3. **Captions.** `python3 engine/srt_to_captions.py file.srt projects/X/captions.py`, then edit by hand: fix
   mistranslations (Sarkar = the Prophet ﷺ), drop garbled lines, mark key words with `*stars*`, and remove any part
   the family wants left out. Keep ﷺ attached to the previous word.
4. **Timeline.** Write `projects/X/timeline.py`: `FULL` (the whole dars) and `SHORTS` (40–170 s self-contained
   moments, each with a header line). Entries: `("voice", a, b, scene)`, `("pause", secs, scene, args)`,
   `("title", secs)`, `("endcard", secs)`. Find natural pauses with `ffmpeg -af silencedetect=n=-32dB:d=0.6`.
   Reuse scenes where the meaning fits; write a new scene (in a new `scenes_*.py`, registered in `render.py`
   `SCENES`) when it doesn't.
5. **Preview.** `NOOR_PROJECT=projects/X python3 engine/render.py frames short:<Name> 2,10,20 /tmp/sheet.png`.
   Check every scene against the words; show the sheet to the user before a full render.
6. **Render.** `NOOR_PROJECT=projects/X python3 engine/render.py short <Name> projects/X/out/<Name>_video.mp4 2`
   then `NOOR_PROJECT=projects/X python3 engine/patch_shorts.py <Name>` -> `out/<Name>.mp4`.
   Full video: `render.py full out/Full_video.mp4 2` then `python3 engine/audio.py out/Full_video.mp4 out/Full.mp4`.
   Two workers on 2 CPUs: a 1-minute Short takes ~6–8 min, the 14-minute full dars ~1 h.
7. **Check** frames from the finished file (start, every scene, end card) and the audio level.
8. **Deliver** to the user's PC folder (`Videos/Noor-ul-Hasrat Shorts/...`; files over 30 MB in 26 MB parts + a .bat).
9. **Upload** (needs the user): YouTube Studio in the built-in browser; the user picks the file; fill title,
   description, tags, Not made for kids, No paid promotion, AI use (No for drawn animation; **Yes** if realistic AI
   images of a real person are used), Urdu, Education; publish only after the user says so. ~10 uploads/day on an
   unverified channel. Replacing a Short = upload the new one, then set the old one Private (ask first).
10. The app lists new public Shorts by itself; `/api/new-shorts` pushes a notification once a day.

## Scene library (scene name -> what it shows)
soul, arsh, creation (Kun), misal, womb, weight_time, sand_body (soul of light, body of sand, time and family threads),
death_barzakh, graves, window, sins, hashr, scales, intercession, jannah (Sufi lifting believers to the door of Jannah),
grace, masjid, shahada, iman (believer, family and wealth streaming to the Green Dome), book, malida_prep,
malida_feast, glory, calm (pauses: stars, lanterns, garden, dome).

## Rules the family set
- Never draw the Prophet ﷺ: only light, the Green Dome, or calligraphy.
- Souls are light in human shape with no features; only a body of soil/sand has a face.
- A Sufi or saint is shown with his face hidden in light.
- Music only in pauses, never under his voice.
- His photo (glowing gold oval) on the opening and closing cards.

## YouTube description template
```
<2–3 lines on the topic>

“<one quote from the dars>”

From a dars of Hazrat Azam Pasha Rahmatullah Alaih, in Urdu with English captions.

<Urdu title line>
حضرت اعظم پاشا رحمۃ اللہ علیہ کا درس

🔔 Subscribe for more dars, tafseer, naat and poetry.
📿 Noor-ul-Hasrat

Background nasheed: “<track>” by <artist> (Pixabay)

#<Topic> ... #Sufism #IslamicReminder #Dars #Urdu #Hyderabad #NoorUlHasrat #Shorts
```
Title: `<Topic> | Hazrat Azam Pasha R.A. #shorts`
