const { chromium } = require('/workspace/fruit-test/node_modules/playwright-core');
const fs = require('fs');
const { execFileSync } = require('child_process');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/icon.html');
  const save = (name, d) => fs.writeFileSync(__dirname + '/' + name, Buffer.from(d.split(',')[1], 'base64'));
  save('icon-512.png', await p.evaluate(() => render(512, true, 0.10)));
  save('foreground-432.png', await p.evaluate(() => render(432, false, 0.18)));
  console.log('errors', errs);
  await b.close();
  const res = __dirname + '/../res';
  const sizes = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
  const fgs = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };
  for (const [d, n] of Object.entries(sizes)) {
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', __dirname + '/icon-512.png', '-vf', `scale=${n}:${n}`, res + `/mipmap-${d}/ic_launcher.png`]);
  }
  for (const [d, n] of Object.entries(fgs)) {
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', __dirname + '/foreground-432.png', '-vf', `scale=${n}:${n}`, res + `/mipmap-${d}/ic_launcher_foreground.png`]);
  }
  fs.copyFileSync(__dirname + '/icon-512.png', '/workspace/peekaboo-farm/shots/app-icon.png');
  console.log('mipmaps written');
})();
