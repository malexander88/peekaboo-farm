#!/bin/sh
# Rebuilds index.html from src/ plus embedded sound clips and music.
set -e
cd "$(dirname "$0")"
python3 sounds/gen_license.py
python3 - <<'PY'
import json,base64,html
cr=json.load(open('sounds/credits.json'))
snd={a:base64.b64encode(open(f'sounds/clips/{a}.mp3','rb').read()).decode() for a,*_ in cr}
music=base64.b64encode(open('music/fluffing-a-duck-loop.mp3','rb').read()).decode()
rows=''.join(f'<p><b>{a.title()}</b>: “{html.escape(t)}” by {html.escape(w)} ({html.escape(l)}){" – "+html.escape(k) if k!="recording" else ""}</p>' for a,t,w,l,u,k in cr)
music_c='<p><b>Music</b>: “Fluffing a Duck” by Kevin MacLeod (incompetech.com) (CC BY 4.0)</p>'
credits='<h3>Peekaboo Farm – sound &amp; music credits</h3>'+rows+music_c+'<p>Recorded clips trimmed, normalised and lightly pitched up. Surprise effects synthesised. Tap to close.</p>'
open('src/00_sounds.part','w').write('<script>window.__SND='+json.dumps(snd)+';window.__MUSIC='+json.dumps(music)+';window.__CREDITS='+json.dumps(credits)+';</script>\n')
print('embedded sounds', len(snd), 'music_kb', len(music)//1024)
PY
{ cat src/01_head.html src/00_sounds.part; echo '<script>'; cat src/02_draw.js src/03_animals.js src/04_scene.js src/05_audio.js src/06_main.js; echo '</script>'; echo '</body></html>'; } > index.html
ls -la index.html
