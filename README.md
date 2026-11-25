# Peekaboo Farm

A sunny cartoon farm for little ones. Animals hide behind bushes, a barn door, haystacks,
a pond, a tractor and a fence. They peek out now and then — tap a hiding place and the
animal pops out with its sound and a speech bubble, then ducks back and hides somewhere
else. Empty spots hide a surprise (a butterfly or a friendly "boo"). No menus, no game over,
just a star counter.

* `index.html` – the whole game in one offline file (open in any browser).
* `apk/PeekabooFarm.apk` – Android app (package `com.peekaboofarm.game`, Android 7+, portrait and landscape).
* `index.html?sheet=idle` / `?sheet=react` – contact sheet of all 12 animals.

Rebuild: `./build.sh` (HTML) then `android/build-apk.sh` (APK, plain SDK tools, no Gradle).
Sound and music sources and licences: `sounds/LICENSE.txt` and `music/LICENSE.txt`
(also in-game via the small "ⓘ sounds" button).
