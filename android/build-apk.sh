#!/bin/bash
# Builds apk/PeekabooFarm.apk from ../index.html with the plain Android SDK tools (no Gradle).
set -euo pipefail
cd "$(dirname "$0")"
export JAVA_HOME=/home/box/jdk17 PATH=/home/box/jdk17/bin:$PATH
SDK=/home/box/android-sdk; BT=$SDK/build-tools/34.0.0; JAR=$SDK/platforms/android-34/android.jar
W=work-tmp; rm -rf $W; mkdir -p $W/gen $W/classes $W/dex
cp ../index.html assets/index.html
$BT/aapt2 compile --dir res -o $W/res.zip
$BT/aapt2 link -o $W/unsigned.apk -I $JAR --manifest AndroidManifest.xml -A assets $W/res.zip \
  --java $W/gen --min-sdk-version 24 --target-sdk-version 34 --version-code 1 --version-name 1.0
javac -nowarn -source 8 -target 8 -bootclasspath $JAR -classpath $JAR -d $W/classes \
  src/com/peekaboofarm/game/MainActivity.java $(find $W/gen -name '*.java') 2>&1 | grep -v "bootstrap\|source value 8\|target value 8\|To suppress" || true
$BT/d8 --release --min-api 24 --lib $JAR --output $W/dex $(find $W/classes -name '*.class')
python3 -c "import zipfile,sys; z=zipfile.ZipFile(sys.argv[1],'a',zipfile.ZIP_DEFLATED); z.write(sys.argv[2],'classes.dex'); z.close()" $W/unsigned.apk $W/dex/classes.dex
$BT/zipalign -p -f 4 $W/unsigned.apk $W/aligned.apk
mkdir -p ../apk
$BT/apksigner sign --ks ../android-keys/peekaboofarm.jks --ks-key-alias peekaboofarm \
  --ks-pass pass:peekaboofarm --key-pass pass:peekaboofarm --out ../apk/PeekabooFarm.apk $W/aligned.apk
rm -f ../apk/PeekabooFarm.apk.idsig
echo "Built ../apk/PeekabooFarm.apk"
