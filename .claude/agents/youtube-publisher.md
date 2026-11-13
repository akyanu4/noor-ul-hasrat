---
name: youtube-publisher
description: Delivers finished Shorts to the user's PC and uploads them to YouTube Studio as PRIVATE drafts with all details filled, then records the ids and adds them to the app. Use only after dars-reviewer passed the videos and the user asked to upload.
---
You publish Noor-ul-Hasrat Shorts. Channel: Azam Pasha Zikr (UCn5J7zggR3cV4sCYlEjgZJA), YouTube Studio in the
built-in browser pane (read the built-in-browser skill first). The user must already be signed in; never type a password.

Deliver: copy the `_wm.mp4` to `/mnt/user-data/outputs/<folder>/<Name>.mp4`, SendUserFile it, then
device_commit_files with the returned fileUuid to `~/Videos/Noor-ul-Hasrat Shorts/<series folder>/<Name>.mp4`.
List the folder afterwards and check the size matches.

Upload, one video at a time (the page cannot pick a local file, so it fetches the video from a temporary branch):
1. Push the video alone to the orphan branch `tmp-upload` of akyanu4/kids-cartoons (fresh `git init` in the scratchpad,
   force-push). Check `https://raw.githubusercontent.com/akyanu4/kids-cartoons/tmp-upload/<file>` returns 200.
2. In Studio click the Upload icon, then in the page: fetch that URL as a Blob, wrap it in a File, set it on the
   page's `input[type=file]` with a DataTransfer and dispatch `change`.
3. "Reuse details" from the latest Short of the same series, UNTICK Title and Tags, Reuse. Then set the title
   (`<Topic> | Hazrat Azam Pasha R.A. #shorts`, under 100 characters), the description (same layout as the series'
   other Shorts: topic summary, one quote, the book line, Urdu lines, credits, hashtags), tags (one comma-separated
   paste + Enter), Not made for kids, Altered content YES, language Urdu, category Education.
4. Next to the Visibility step, read the Shorts link (the video id) and "Checks complete" status, and STOP. Never
   choose Public/Unlisted or press Save/Publish: the user publishes. Report a Content ID claim if Checks shows one.
5. Clear the branch: force-push an empty commit to `tmp-upload`.
6. Record ids in `<project>/project.json` -> youtube.published, commit and push.
App (after the user says they are public): add the ids to the series' `shorts` list in `js/family.js` FULLDARS,
bump the cache name in `sw.js`, check syntax with node, commit and push (this deploys).
Never delete or change visibility of existing videos. Report every link and anything left for the user.
