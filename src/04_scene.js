/* ================= farm background + hiding spots ================= */
let W = 0, H = 0, DPR = 1, horizon = 0;
const bg = document.createElement('canvas');
const clouds = [];
let spots = [];

function hillPath(g, y0, amp, waves, phase, W, H) {
  g.beginPath(); g.moveTo(0, H);
  for (let x = 0; x <= W + 10; x += 10) {
    const y = y0 - amp * (0.55 * Math.sin(x / W * TAU * waves + phase) + 0.3 * Math.sin(x / W * TAU * waves * 2.3 + phase * 1.7) + 0.15 * Math.sin(x / W * TAU * waves * 5.1));
    g.lineTo(x, y);
  }
  g.lineTo(W, H); g.closePath();
}
function hillY(y0, amp, waves, phase, x) { return y0 - amp * (0.55 * Math.sin(x / W * TAU * waves + phase) + 0.3 * Math.sin(x / W * TAU * waves * 2.3 + phase * 1.7) + 0.15 * Math.sin(x / W * TAU * waves * 5.1)); }

function drawBackground() {
  bg.width = Math.round(W * DPR); bg.height = Math.round(H * DPR);
  const g = bg.getContext('2d'); g.setTransform(DPR, 0, 0, DPR, 0, 0);
  const sky = g.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, '#5ec2ff'); sky.addColorStop(0.7, '#a9e3ff'); sky.addColorStop(1, '#dff6ff');
  g.fillStyle = sky; g.fillRect(0, 0, W, horizon + 40);
  const u = Math.min(W, H);
  // far hills
  const far = [[horizon - u * 0.04, u * 0.07, 1.3, 0.8, '#9fdc7a'], [horizon + u * 0.02, u * 0.05, 1.8, 2.4, '#86cf62']];
  for (const [y0, amp, wv, ph, col] of far) { hillPath(g, y0, amp, wv, ph, W, H); const gr = g.createLinearGradient(0, y0 - amp, 0, y0 + u * 0.2); gr.addColorStop(0, col); gr.addColorStop(1, shade(col, -0.15)); g.fillStyle = gr; g.fill(); }
  // distant trees + a little windmill (not interactive)
  const wx = W * (H > W * 1.05 ? 0.14 : 0.82), wy = hillY(horizon - u * 0.04, u * 0.07, 1.3, 0.8, wx), ws = u * 0.055;
  g.save(); g.translate(wx, wy);
  g.fillStyle = '#d8dde4'; g.fillRect(-ws * 0.1, -ws * 1.6, ws * 0.2, ws * 1.6);
  g.beginPath(); g.moveTo(-ws * 0.22, -ws * 1.55); g.lineTo(0, -ws * 1.95); g.lineTo(ws * 0.22, -ws * 1.55); g.closePath(); g.fillStyle = '#8a2f2a'; g.fill();
  g.restore();
  for (const tx of [0.08, 0.22, 0.62, 0.9]) {
    const x = W * tx, y = hillY(horizon + u * 0.02, u * 0.05, 1.8, 2.4, x) + 3, s = u * (0.03 + (tx % 0.3) * 0.04);
    g.fillStyle = '#7a5434'; g.fillRect(x - s * 0.12, y - s * 0.9, s * 0.24, s * 0.9);
    for (const [ox, oy, r] of [[0, -1.25, 0.62], [-0.35, -0.95, 0.45], [0.38, -0.95, 0.45]]) { g.beginPath(); g.arc(x + ox * s, y + oy * s, r * s, 0, TAU); const tg = g.createRadialGradient(x + ox * s - r * s * 0.3, y + oy * s - r * s * 0.4, 1, x + ox * s, y + oy * s, r * s); tg.addColorStop(0, '#7fd85a'); tg.addColorStop(1, '#3f9a3a'); g.fillStyle = tg; g.fill(); }
  }
  // meadow
  hillPath(g, horizon + u * 0.05, u * 0.03, 0.9, 4.0, W, H);
  const mg = g.createLinearGradient(0, horizon, 0, H); mg.addColorStop(0, '#78d158'); mg.addColorStop(0.55, '#62c44c'); mg.addColorStop(1, '#4fae3e');
  g.fillStyle = mg; g.fill();
  // dirt path meandering down
  g.save();
  g.beginPath();
  const pathY0 = horizon + u * 0.02;
  g.moveTo(W * 0.42, pathY0);
  g.bezierCurveTo(W * 0.55, horizon + (H - horizon) * 0.35, W * 0.28, horizon + (H - horizon) * 0.6, W * 0.5, H + 4);
  g.bezierCurveTo(W * 0.62, horizon + (H - horizon) * 0.6, W * 0.72, horizon + (H - horizon) * 0.35, W * 0.58, pathY0);
  g.closePath();
  const dg = g.createLinearGradient(0, horizon, 0, H);
  dg.addColorStop(0, 'rgba(196,154,96,.45)'); dg.addColorStop(1, 'rgba(176,130,74,.7)');
  g.fillStyle = dg; g.fill();
  g.restore();
  // mown stripes
  g.save(); g.globalAlpha = 0.06; g.fillStyle = '#fff';
  for (let i = 0; i < 8; i++) { const y = horizon + u * 0.08 + i * (H - horizon) / 7; g.fillRect(0, y, W, (H - horizon) / 14); }
  g.restore();
  // flowers + grass tufts (seeded)
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const area = W * (H - horizon); const nF = Math.min(160, Math.round(area / 4800));
  const fcols = ['#ffffff', '#ffd23f', '#ff8fb1', '#b28dff', '#ff6b6b'];
  for (let i = 0; i < nF; i++) {
    const x = rnd() * W, y = horizon + u * 0.07 + rnd() * (H - horizon - u * 0.07), sc = 0.5 + (y - horizon) / (H - horizon) * 0.9, r = u * 0.008 * sc;
    if (rnd() < 0.45) { g.strokeStyle = 'rgba(40,120,40,.55)'; g.lineWidth = Math.max(1, r * 0.4); g.beginPath(); for (const a of [-0.5, 0, 0.5]) { g.moveTo(x, y); g.quadraticCurveTo(x + a * r * 2, y - r * 2, x + a * r * 3, y - r * 3.5); } g.stroke(); continue; }
    const col = fcols[Math.floor(rnd() * fcols.length)];
    g.fillStyle = col; for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; g.beginPath(); g.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.75, 0, TAU); g.fill(); }
    g.fillStyle = '#ffcc33'; g.beginPath(); g.arc(x, y, r * 0.6, 0, TAU); g.fill();
  }
  if (!clouds.length) for (let i = 0; i < 5; i++) clouds.push({ x: Math.random(), y: 0.08 + Math.random() * 0.6, s: 0.7 + Math.random() * 0.6, v: 0.004 + Math.random() * 0.006 });
}

function drawSky(ctx, t, dt) {
  const u = Math.min(W, H);
  const sx = W - u * 0.13, sy = Math.min(horizon * 0.32, u * 0.14), sr = u * 0.065;
  ctx.save(); ctx.translate(sx, sy); ctx.rotate(t * 0.15);
  ctx.fillStyle = 'rgba(255,236,120,.45)';
  for (let i = 0; i < 12; i++) { ctx.rotate(TAU / 12); ctx.beginPath(); ctx.moveTo(sr * 1.15, -sr * 0.16); ctx.lineTo(sr * 1.75, 0); ctx.lineTo(sr * 1.15, sr * 0.16); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  const sg = ctx.createRadialGradient(sx - sr * 0.3, sy - sr * 0.3, sr * 0.1, sx, sy, sr);
  sg.addColorStop(0, '#fff7b0'); sg.addColorStop(1, '#ffd23a');
  ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TAU); ctx.fill();
  ctx.fillStyle = '#c77d12'; ctx.beginPath(); ctx.arc(sx - sr * 0.3, sy - sr * 0.1, sr * 0.08, 0, TAU); ctx.arc(sx + sr * 0.3, sy - sr * 0.1, sr * 0.08, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#c77d12'; ctx.lineWidth = sr * 0.07; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(sx, sy + sr * 0.05, sr * 0.35, 0.3, Math.PI - 0.3); ctx.stroke();
  ctx.fillStyle = 'rgba(255,120,120,.35)'; ctx.beginPath(); ctx.arc(sx - sr * 0.52, sy + sr * 0.18, sr * 0.13, 0, TAU); ctx.arc(sx + sr * 0.52, sy + sr * 0.18, sr * 0.13, 0, TAU); ctx.fill();
  // windmill sails (turn slowly)
  const wx = W * (H > W * 1.05 ? 0.14 : 0.82), wy = hillY(horizon - u * 0.04, u * 0.07, 1.3, 0.8, wx) - u * 0.055 * 1.6, ws = u * 0.055;
  ctx.save(); ctx.translate(wx, wy); ctx.rotate(t * 0.4);
  ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.strokeStyle = 'rgba(80,50,40,.45)'; ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) { ctx.rotate(TAU / 4); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(ws * 0.12, -ws * 0.15); ctx.lineTo(ws * 0.12, -ws * 0.85); ctx.lineTo(-ws * 0.08, -ws * 0.85); ctx.lineTo(-ws * 0.08, -ws * 0.15); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = '#c45a3a'; ctx.beginPath(); ctx.arc(0, 0, ws * 0.1, 0, TAU); ctx.fill();
  ctx.restore();
  for (const cl of clouds) {
    cl.x += cl.v * dt; if (cl.x > 1.25) { cl.x = -0.25; cl.y = 0.08 + Math.random() * 0.6; }
    const x = cl.x * W, y = cl.y * horizon * 0.9, s = u * 0.06 * cl.s;
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = 'rgba(170,210,240,.5)';
    ctx.beginPath(); for (const [ox, oy, r] of [[-1.1, 0.3, 0.6], [-0.4, -0.15, 0.85], [0.5, 0, 0.75], [1.2, 0.35, 0.5]]) { ctx.moveTo(ox * s + r * s, oy * s + s * 0.12); ctx.arc(ox * s, oy * s + s * 0.12, r * s, 0, TAU); } ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); for (const [ox, oy, r] of [[-1.1, 0.3, 0.6], [-0.4, -0.15, 0.85], [0.5, 0, 0.75], [1.2, 0.35, 0.5]]) { ctx.moveTo(ox * s + r * s, oy * s); ctx.arc(ox * s, oy * s, r * s, 0, TAU); } ctx.fill();
    ctx.restore();
  }
}

function layoutSpots() {
  const portrait = H > W * 1.05;
  const u = Math.min(W, H);
  horizon = portrait ? H * 0.30 : H * 0.40;
  const defs = portrait ? [
    { id: 'barn', type: 'barn', xf: 0.72, yf: 0.40, sf: 0.21, z: 1 },
    { id: 'hayL', type: 'hay', xf: 0.34, yf: 0.50, sf: 0.155, z: 3 },
    { id: 'pond', type: 'pond', xf: 0.20, yf: 0.61, sf: 0.19, z: 4 },
    { id: 'tractor', type: 'tractor', xf: 0.80, yf: 0.58, sf: 0.17, z: 4 },
    { id: 'hayR', type: 'hay', xf: 0.52, yf: 0.70, sf: 0.165, z: 5 },
    { id: 'bushL', type: 'bush', xf: 0.14, yf: 0.81, sf: 0.165, z: 7, flowers: 1 },
    { id: 'fence', type: 'fence', xf: 0.48, yf: 0.87, sf: 0.18, z: 6 },
    { id: 'bushR', type: 'bush', xf: 0.88, yf: 0.79, sf: 0.16, z: 7, flowers: 0 }
  ] : [
    { id: 'barn', type: 'barn', xf: 0.17, yf: 0.60, sf: 0.175, z: 1 },
    { id: 'hayL', type: 'hay', xf: 0.55, yf: 0.58, sf: 0.155, z: 3 },
    { id: 'tractor', type: 'tractor', xf: 0.38, yf: 0.66, sf: 0.17, z: 4 },
    { id: 'pond', type: 'pond', xf: 0.88, yf: 0.70, sf: 0.18, z: 4 },
    { id: 'hayR', type: 'hay', xf: 0.70, yf: 0.73, sf: 0.155, z: 5 },
    { id: 'bushL', type: 'bush', xf: 0.07, yf: 0.88, sf: 0.155, z: 7, flowers: 1 },
    { id: 'fence', type: 'fence', xf: 0.28, yf: 0.90, sf: 0.17, z: 6 },
    { id: 'bushR', type: 'bush', xf: 0.58, yf: 0.92, sf: 0.145, z: 7, flowers: 0 }
  ];
  const old = {};
  for (const s of spots) old[s.id] = s;
  spots = defs.map(d => {
    const s = u * d.sf;
    const x = d.xf * W;
    const y = d.y === 'h' ? horizon + s * 0.08 : d.yf * H;
    const prev = old[d.id] || {};
    return Object.assign(prev, {
      id: d.id, type: d.type, x, y, s, z: d.z, flowers: d.flowers || 0,
      // lip is the top edge of the front cover, in world y (smaller y = higher)
      lip: y - (d.type === 'barn' ? s * 0.95 : d.type === 'pond' ? s * 0.55 : d.type === 'tractor' ? s * 0.7 : d.type === 'fence' ? s * 0.85 : s * 0.95),
      hitW: s * (d.type === 'barn' ? 0.9 : d.type === 'pond' ? 1.5 : d.type === 'fence' ? 1.4 : 1.25),
      hitH: s * (d.type === 'barn' ? 1.15 : d.type === 'pond' ? 1.15 : 1.45)
    });
  });
}

/* ----- hide-object drawing (unit: s = radius-ish size) ----- */
function drawBarn(ctx, sp, t, front) {
  const s = sp.s, x = sp.x, y = sp.y, shake = sp.shake || 0, door = sp.door || 0;
  ctx.save(); ctx.translate(x + Math.sin(t * 40) * shake * 3, y);
  if (!front) {
    // body + roof + loft (static-looking, behind the doorway animal)
    const bw = s * 1.7, bh = s * 1.35;
    ctx.fillStyle = '#c43b32';
    ctx.beginPath(); ctx.roundRect(-bw / 2, -bh, bw, bh, s * 0.04); ctx.fill();
    ctx.strokeStyle = '#fff8f0'; ctx.lineWidth = Math.max(2, s * 0.045); ctx.stroke();
    // roof
    ctx.beginPath(); ctx.moveTo(-bw / 2 - s * 0.18, -bh + s * 0.08); ctx.lineTo(0, -bh - s * 0.55); ctx.lineTo(bw / 2 + s * 0.18, -bh + s * 0.08); ctx.closePath();
    const rg = ctx.createLinearGradient(0, -bh - s * 0.55, 0, -bh);
    rg.addColorStop(0, '#6a2a24'); rg.addColorStop(1, '#8a3830'); ctx.fillStyle = rg; ctx.fill();
    ctx.strokeStyle = '#4a1c18'; ctx.lineWidth = Math.max(1.5, s * 0.03); ctx.stroke();
    // loft window
    ctx.fillStyle = '#7ec8ff'; ctx.beginPath(); ctx.arc(0, -bh - s * 0.12, s * 0.16, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1.5, s * 0.03); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-s * 0.16, -bh - s * 0.12); ctx.lineTo(s * 0.16, -bh - s * 0.12); ctx.moveTo(0, -bh - s * 0.28); ctx.lineTo(0, -bh + s * 0.04); ctx.stroke();
    // hay in loft
    ctx.fillStyle = '#e8c14a'; ctx.beginPath(); ctx.arc(-s * 0.04, -bh - s * 0.08, s * 0.07, 0, TAU); ctx.arc(s * 0.05, -bh - s * 0.06, s * 0.06, 0, TAU); ctx.fill();
    // weathervane
    ctx.strokeStyle = '#5a3a20'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -bh - s * 0.55); ctx.lineTo(0, -bh - s * 0.78); ctx.stroke();
    ctx.fillStyle = '#e24a3a'; ctx.beginPath(); ctx.moveTo(s * 0.02, -bh - s * 0.70); ctx.lineTo(s * 0.22, -bh - s * 0.74); ctx.lineTo(s * 0.02, -bh - s * 0.78); ctx.closePath(); ctx.fill();
    // side window
    ctx.fillStyle = '#7ec8ff'; ctx.fillRect(-bw / 2 + s * 0.12, -bh + s * 0.28, s * 0.28, s * 0.28);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1.5, s * 0.03); ctx.strokeRect(-bw / 2 + s * 0.12, -bh + s * 0.28, s * 0.28, s * 0.28);
    ctx.beginPath(); ctx.moveTo(-bw / 2 + s * 0.12, -bh + s * 0.42); ctx.lineTo(-bw / 2 + s * 0.4, -bh + s * 0.42);
    ctx.moveTo(-bw / 2 + s * 0.26, -bh + s * 0.28); ctx.lineTo(-bw / 2 + s * 0.26, -bh + s * 0.56); ctx.stroke();
    // doorway opening (dark)
    const dw = s * 0.72, dh = s * 0.95;
    ctx.fillStyle = '#3a2018'; ctx.fillRect(-dw / 2, -dh, dw, dh + 1);
    // a little hay on the threshold
    ctx.fillStyle = '#e0b84a'; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.28, s * 0.06, 0, 0, TAU); ctx.fill();
  } else {
    // swinging door (hinged on the left) — planks, modest cross-brace
    const dw = s * 0.72, dh = s * 0.95;
    const open = 0.12 + door * 0.55;
    ctx.save(); ctx.translate(-dw / 2, 0); ctx.rotate(-open * 0.85);
    ctx.fillStyle = '#a4332c'; ctx.fillRect(0, -dh, dw, dh);
    ctx.strokeStyle = 'rgba(255,244,232,.85)'; ctx.lineWidth = Math.max(1.5, s * 0.028);
    // vertical planks
    for (let i = 1; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(dw * i / 4, -dh); ctx.lineTo(dw * i / 4, 0); ctx.stroke(); }
    ctx.strokeRect(0, -dh, dw, dh);
    // small cross-brace
    ctx.lineWidth = Math.max(2, s * 0.035);
    ctx.beginPath(); ctx.moveTo(dw * 0.12, -dh + s * 0.1); ctx.lineTo(dw * 0.88, -s * 0.12); ctx.stroke();
    ctx.fillStyle = '#e8c14a'; ctx.beginPath(); ctx.arc(dw * 0.82, -dh * 0.48, s * 0.055, 0, TAU); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawHay(ctx, sp, t, front) {
  const s = sp.s, x = sp.x, y = sp.y, shake = sp.shake || 0, rustle = sp.rustle || 0;
  ctx.save(); ctx.translate(x + Math.sin(t * 35) * shake * 2, y);
  const wob = Math.sin(t * 2 + (sp.ph || 0)) * 0.02 + rustle * Math.sin(t * 18) * 0.04;
  ctx.rotate(wob);
  const stack = (yy, sc, col) => {
    ctx.save(); ctx.translate(0, yy); ctx.scale(sc, sc);
    ctx.beginPath();
    ctx.moveTo(-s, 0);
    ctx.bezierCurveTo(-s * 1.05, -s * 0.5, -s * 0.7, -s * 1.35, 0, -s * 1.45);
    ctx.bezierCurveTo(s * 0.7, -s * 1.35, s * 1.05, -s * 0.5, s, 0);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, -s * 1.45, 0, 0);
    g.addColorStop(0, shade(col, 0.18)); g.addColorStop(0.6, col); g.addColorStop(1, shade(col, -0.18));
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = shade(col, -0.45); ctx.lineWidth = Math.max(1.5, s * 0.04); ctx.stroke();
    // straw strokes
    ctx.strokeStyle = 'rgba(120,80,20,.28)'; ctx.lineWidth = 1.2;
    for (let i = 0; i < 8; i++) {
      const a = -0.9 + i * 0.22; ctx.beginPath();
      ctx.moveTo(Math.sin(a) * s * 0.15, -s * 0.1); ctx.quadraticCurveTo(Math.sin(a) * s * 0.5, -s * 0.7, Math.sin(a * 1.1) * s * 0.35, -s * 1.2);
      ctx.stroke();
    }
    ctx.restore();
  };
  if (!front) {
    // shadow + back mound
    ctx.fillStyle = 'rgba(40,80,20,.18)'; ctx.beginPath(); ctx.ellipse(0, s * 0.05, s * 0.95, s * 0.16, 0, 0, TAU); ctx.fill();
    stack(0, 1, '#e8c14a');
  } else {
    // a little tuft in front
    stack(s * 0.02, 0.55, '#d9b03e');
    // pitchfork
    ctx.save(); ctx.translate(s * 0.7, 0); ctx.rotate(0.35);
    ctx.fillStyle = '#8a5a2a'; ctx.fillRect(-s * 0.03, -s * 1.15, s * 0.06, s * 1.15);
    ctx.strokeStyle = '#c0c8d0'; ctx.lineWidth = Math.max(2, s * 0.035); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-s * 0.16, -s * 1.15); ctx.lineTo(-s * 0.16, -s * 1.45);
    ctx.moveTo(0, -s * 1.15); ctx.lineTo(0, -s * 1.5);
    ctx.moveTo(s * 0.16, -s * 1.15); ctx.lineTo(s * 0.16, -s * 1.45);
    ctx.moveTo(-s * 0.16, -s * 1.15); ctx.lineTo(s * 0.16, -s * 1.15); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function drawBush(ctx, sp, t, front) {
  const s = sp.s, x = sp.x, y = sp.y, shake = sp.shake || 0, rustle = sp.rustle || 0;
  ctx.save(); ctx.translate(x + Math.sin(t * 30) * shake * 2, y);
  const blobs = front
    ? [[-0.15, -0.25, 0.55, '#4fb83a'], [0.25, -0.15, 0.5, '#3ea332'], [0, -0.05, 0.48, '#5cc94a']]
    : [[0, -0.55, 0.72, '#4caf3a'], [-0.55, -0.3, 0.6, '#3d9a30'], [0.55, -0.32, 0.62, '#58c046'], [-0.25, -0.7, 0.48, '#6ed456'], [0.3, -0.68, 0.5, '#46a836']];
  const wiggle = rustle * Math.sin(t * 16);
  for (const [ox, oy, r, col] of blobs) {
    const px = ox * s + wiggle * s * 0.06 * (oy < -0.4 ? 1 : 0.3), py = oy * s, rr = r * s;
    ctx.beginPath(); ctx.arc(px, py, rr, 0, TAU);
    const g = ctx.createRadialGradient(px - rr * 0.3, py - rr * 0.4, rr * 0.1, px, py, rr);
    g.addColorStop(0, shade(col, 0.28)); g.addColorStop(1, shade(col, -0.2));
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = shade(col, -0.45); ctx.lineWidth = Math.max(1.2, s * 0.03); ctx.stroke();
  }
  if (sp.flowers && !front) {
    const fcols = ['#ff7eb3', '#fff07a', '#ff6b6b', '#ffffff'];
    for (const [ox, oy, ci] of [[-0.45, -0.75, 0], [0.15, -0.95, 1], [0.55, -0.7, 2], [-0.1, -0.5, 3]]) {
      const px = ox * s, py = oy * s, r = s * 0.08;
      ctx.fillStyle = fcols[ci];
      for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; ctx.beginPath(); ctx.arc(px + Math.cos(a) * r, py + Math.sin(a) * r, r * 0.7, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#ffcc33'; ctx.beginPath(); ctx.arc(px, py, r * 0.55, 0, TAU); ctx.fill();
    }
  }
  if (!front) {
    ctx.fillStyle = 'rgba(40,80,20,.18)'; ctx.beginPath(); ctx.ellipse(0, s * 0.06, s * 0.85, s * 0.14, 0, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

function drawPond(ctx, sp, t, front) {
  const s = sp.s, x = sp.x, y = sp.y, shake = sp.shake || 0;
  ctx.save(); ctx.translate(x + Math.sin(t * 20) * shake, y);
  if (!front) {
    // water
    ctx.beginPath(); ctx.ellipse(0, -s * 0.15, s * 1.35, s * 0.55, 0, 0, TAU);
    const wg = ctx.createRadialGradient(-s * 0.3, -s * 0.35, s * 0.1, 0, -s * 0.15, s * 1.2);
    wg.addColorStop(0, '#8fe4ff'); wg.addColorStop(0.45, '#4eb7e0'); wg.addColorStop(1, '#2a8fb8');
    ctx.fillStyle = wg; ctx.fill();
    ctx.strokeStyle = '#2f7a4a'; ctx.lineWidth = Math.max(3, s * 0.07); ctx.stroke();
    // ripples
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.4;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(-s * 0.2, -s * 0.2, s * (0.25 + i * 0.18 + Math.sin(t * 1.5 + i) * 0.04), s * (0.1 + i * 0.07), 0, 0, TAU); ctx.stroke(); }
    // lily pads
    for (const [ox, oy, sc, rot] of [[-0.55, -0.2, 0.22, -0.4], [0.5, -0.08, 0.2, 0.5], [0.15, -0.38, 0.16, 0.1]]) {
      ctx.save(); ctx.translate(ox * s, oy * s); ctx.rotate(rot);
      ctx.beginPath(); ctx.ellipse(0, 0, sc * s, sc * s * 0.7, 0, 0, TAU); ctx.fillStyle = '#4db84a'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(sc * s, 0); ctx.strokeStyle = '#2e7a30'; ctx.lineWidth = 1; ctx.stroke();
      if (sc > 0.18) { ctx.fillStyle = '#ff6b8a'; ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; ctx.ellipse(Math.cos(a) * sc * s * 0.25, Math.sin(a) * sc * s * 0.25, sc * s * 0.12, sc * s * 0.07, a, 0, TAU); } ctx.fill(); ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(0, 0, sc * s * 0.08, 0, TAU); ctx.fill(); }
      ctx.restore();
    }
  } else {
    // reeds in a clump (the hide)
    for (const [ox, h, lean, col] of [[-0.55, 1.05, -0.15, '#3d8a30'], [-0.35, 1.25, -0.05, '#4da83c'], [-0.15, 1.15, 0.08, '#36822c'], [0.05, 1.3, 0.12, '#4dae3e'], [0.28, 1.0, 0.2, '#3d8a30'], [0.5, 1.15, 0.05, '#4da83c']]) {
      ctx.save(); ctx.translate(ox * s, 0); ctx.rotate(lean + Math.sin(t * 2 + ox * 4) * 0.06 + (sp.rustle || 0) * Math.sin(t * 14) * 0.1);
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-s * 0.04, 0); ctx.quadraticCurveTo(-s * 0.02, -h * s * 0.5, 0, -h * s); ctx.quadraticCurveTo(s * 0.04, -h * s * 0.5, s * 0.035, 0); ctx.closePath(); ctx.fill();
      // seed head
      ctx.fillStyle = '#c4a24a'; ctx.beginPath(); ctx.ellipse(0, -h * s, s * 0.05, s * 0.11, 0, 0, TAU); ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawTractor(ctx, sp, t, front) {
  const s = sp.s, x = sp.x, y = sp.y, shake = sp.shake || 0;
  ctx.save(); ctx.translate(x + Math.sin(t * 25) * shake * 2, y);
  const body = '#e23b2c', dark = '#2a2a30', yel = '#ffd23a';
  if (!front) {
    ctx.fillStyle = 'rgba(40,80,20,.2)'; ctx.beginPath(); ctx.ellipse(0, s * 0.04, s * 0.95, s * 0.14, 0, 0, TAU); ctx.fill();
    // front wheel
    ctx.fillStyle = dark; ctx.beginPath(); ctx.arc(-s * 0.55, -s * 0.22, s * 0.22, 0, TAU); ctx.fill();
    ctx.fillStyle = '#6a6a72'; ctx.beginPath(); ctx.arc(-s * 0.55, -s * 0.22, s * 0.1, 0, TAU); ctx.fill();
    // chassis + hood
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.roundRect(-s * 0.7, -s * 0.72, s * 1.05, s * 0.5, s * 0.08); ctx.fill();
    ctx.strokeStyle = '#8a2018'; ctx.lineWidth = Math.max(1.5, s * 0.03); ctx.stroke();
    // cabin
    ctx.fillStyle = '#c4332a';
    ctx.beginPath(); ctx.roundRect(-0.02 * s, -s * 1.15, s * 0.62, s * 0.55, s * 0.08); ctx.fill();
    ctx.fillStyle = '#8fd4ff'; ctx.beginPath(); ctx.roundRect(s * 0.08, -s * 1.08, s * 0.42, s * 0.32, s * 0.05); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1.5, s * 0.03); ctx.stroke();
    // chimney
    ctx.fillStyle = dark; ctx.fillRect(-s * 0.42, -s * 1.05, s * 0.14, s * 0.38);
    ctx.fillStyle = '#4a4a52'; ctx.fillRect(-s * 0.46, -s * 1.12, s * 0.22, s * 0.1);
    // puff of smoke when rustling / popping
    if ((sp.door || 0) > 0.2 || (sp.rustle || 0) > 0) {
      ctx.fillStyle = 'rgba(220,220,230,.7)';
      const p = (t * 0.8) % 1;
      ctx.beginPath(); ctx.arc(-s * 0.35, -s * 1.2 - p * s * 0.4, s * 0.1 * (1 - p * 0.4), 0, TAU); ctx.fill();
    }
    // headlight
    ctx.fillStyle = yel; ctx.beginPath(); ctx.arc(-s * 0.7, -s * 0.52, s * 0.08, 0, TAU); ctx.fill();
    // back wheel well (animal peeks here) – dark arch
    ctx.fillStyle = '#1a1a20'; ctx.beginPath(); ctx.arc(s * 0.42, -s * 0.02, s * 0.48, Math.PI, 0); ctx.fill();
  } else {
    // big rear wheel in front of a peeking animal
    ctx.fillStyle = dark; ctx.beginPath(); ctx.arc(s * 0.42, -s * 0.02, s * 0.46, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#111'; ctx.lineWidth = s * 0.06; ctx.stroke();
    ctx.fillStyle = yel; ctx.beginPath(); ctx.arc(s * 0.42, -s * 0.02, s * 0.18, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#c9a010'; ctx.lineWidth = 2; ctx.stroke();
    // spokes
    ctx.strokeStyle = '#a08010'; ctx.lineWidth = 2;
    ctx.save(); ctx.translate(s * 0.42, -s * 0.02); ctx.rotate(t * 0); // parked
    for (let i = 0; i < 6; i++) { ctx.rotate(TAU / 6); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -s * 0.16); ctx.stroke(); }
    ctx.restore();
  }
  ctx.restore();
}

function drawFence(ctx, sp, t, front) {
  const s = sp.s, x = sp.x, y = sp.y, shake = sp.shake || 0;
  ctx.save(); ctx.translate(x + Math.sin(t * 20) * shake, y);
  const post = (px, h) => {
    ctx.fillStyle = '#c49a62';
    ctx.beginPath(); ctx.roundRect(px - s * 0.08, -h, s * 0.16, h + s * 0.06, s * 0.03); ctx.fill();
    ctx.strokeStyle = '#7a5a30'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#a87a42'; ctx.beginPath(); ctx.moveTo(px - s * 0.11, -h); ctx.lineTo(px, -h - s * 0.1); ctx.lineTo(px + s * 0.11, -h); ctx.closePath(); ctx.fill();
  };
  const rail = (yy, x0, x1) => {
    ctx.fillStyle = '#d2a86c';
    ctx.beginPath(); ctx.roundRect(x0, yy - s * 0.07, x1 - x0, s * 0.14, s * 0.04); ctx.fill();
    ctx.strokeStyle = '#8a6230'; ctx.lineWidth = 1.4; ctx.stroke();
  };
  if (!front) {
    // longer fence as decoration, animal hides in the middle gap
    post(-s * 1.35, s * 0.95); post(-s * 0.55, s * 1.05); post(s * 0.55, s * 1.05); post(s * 1.35, s * 0.95);
    rail(-s * 0.35, -s * 1.4, -s * 0.5); rail(-s * 0.7, -s * 1.4, -s * 0.5);
    rail(-s * 0.35, s * 0.5, s * 1.4); rail(-s * 0.7, s * 0.5, s * 1.4);
    // shadow
    ctx.fillStyle = 'rgba(40,80,20,.15)'; ctx.beginPath(); ctx.ellipse(0, s * 0.04, s * 1.4, s * 0.1, 0, 0, TAU); ctx.fill();
  } else {
    // front rails across the middle (animal peeks between / over)
    post(-s * 0.55, s * 1.05); post(s * 0.55, s * 1.05);
    // lower rail always in front; upper rail slightly open in the middle when door/pop
    rail(-s * 0.32, -s * 0.62, s * 0.62);
    const gap = (sp.door || 0) * s * 0.25;
    rail(-s * 0.72, -s * 0.62, -gap); rail(-s * 0.72, gap, s * 0.62);
  }
  ctx.restore();
}

const HIDE_DRAW = { barn: drawBarn, hay: drawHay, bush: drawBush, pond: drawPond, tractor: drawTractor, fence: drawFence };

function drawHideBack(ctx, sp, t) { (HIDE_DRAW[sp.type] || drawBush)(ctx, sp, t, false); }
function drawHideFront(ctx, sp, t) { (HIDE_DRAW[sp.type] || drawBush)(ctx, sp, t, true); }

function hitSpot(x, y) {
  let best = null;
  for (const sp of spots) {
    const dx = (x - sp.x) / (sp.hitW / 2), dy = (y - (sp.y - sp.hitH * 0.45)) / (sp.hitH / 2);
    const d = dx * dx + dy * dy;
    if (d <= 1 && (!best || sp.z > best.z || (sp.z === best.z && d < best.d))) best = { sp, d, z: sp.z };
  }
  return best && best.sp;
}
