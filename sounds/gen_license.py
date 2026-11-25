import json,os
d=os.path.dirname(os.path.abspath(__file__))
cr=json.load(open(d+'/credits.json'))
L=["Peekaboo Farm - sound sources and licences","============================================","",
"Animal clips were trimmed to ~1-2.6 s, high-passed, loudness-normalised, some sped up/pitched up for a cartoon feel,",
"converted to mono 80 kbps MP3 and embedded (base64) in index.html. Processing: sounds/process.py. The rabbit hop/squeak",
"and the in-game surprise effects (butterfly flutter, boo, giggle, rustle) were synthesised for this game.","",
"Attribution required for: Pig (CC BY 3.0, Vinrax) and the background music (CC BY 4.0, Kevin MacLeod).",
"Everything else is CC0 / public domain; BigSoundBank credit given as a courtesy (\"Additional sounds: Joseph Sardin and DenisChardonnet - BigSoundBank.com\").",""]
for a,t,who,lic,url,kind in cr:
    L.append(f"{a:9s} | {kind}\n          \"{t}\" by {who}\n          Licence: {lic}" + (f"\n          Source: {url}" if url else "") + "\n")
L+=["Background music:","          \"Fluffing a Duck\" by Kevin MacLeod (incompetech.com)",
"          Licence: CC BY 4.0","          Source: https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100768","",
"Licence texts: CC0 https://creativecommons.org/publicdomain/zero/1.0/ ; CC BY 3.0 https://creativecommons.org/licenses/by/3.0/ ;",
"CC BY 4.0 https://creativecommons.org/licenses/by/4.0/ . Changes were made to recorded clips (trim, filter, normalise, speed/pitch)",
"and the music was faded and re-encoded at 80 kbps.","",
"Artwork and code: drawn procedurally in canvas for this game (no third-party art)."]
open(d+'/LICENSE.txt','w').write('\n'.join(L)+'\n')
