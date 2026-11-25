/* ================= game ================= */
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const Q = new URLSearchParams(location.search);
const SHEET = Q.get('sheet');
const HIDDEN_COUNT = 4;
let hiders = [], particles = [], bubbles = [], surprises = [];
let stars = 0, starBump = 0, hintOn = true, lastTapped = null, lastVacated = null;
let now = 0, lastT = 0, pointer = { x: -1, y: -1 }, recent = [];

function layout() {
  W = window.innerWidth; H = window.innerHeight; DPR = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
  layoutSpots();
  drawBackground();
  for (const h of hiders) syncHiderToSpot(h);
}

function syncHiderToSpot(h) {
  const sp = spots.find(s => s.id === h.spotId); if (!sp) return;
  h.x = sp.x; h.y = sp.y; h.k = (sp.s / 115) * (h.A.scale || 1); h.spot = sp;
}

function occupiedIds() { return hiders.filter(h => h.state !== 'gone').map(h => h.spotId); }
function hiddenAnimals() { return hiders.filter(h => h.state !== 'gone').map(h => h.A.id); }

function pickAnimal(excludeIds) {
  const pool = ANIMALS.filter(A => !excludeIds.includes(A.id));
  const weighted = pool.map(A => ({ A, w: recent.includes(A.id) ? 0.28 : 1 }));
  let s = weighted.reduce((a, b) => a + b.w, 0), r = Math.random() * s;
  for (const o of weighted) { if ((r -= o.w) <= 0) return o.A; }
  return pool[0] || ANIMALS[0];
}
function pickSpot(excludeIds) {
  const free = spots.filter(s => !excludeIds.includes(s.id));
  return free[Math.floor(Math.random() * Math.max(1, free.length))] || spots[0];
}

function hideAt(spot, delay, preferId) {
  if (!spot) return null;
  const A = preferId && ANIMAL_BY_ID[preferId] && !hiddenAnimals().includes(preferId) ? ANIMAL_BY_ID[preferId] : pickAnimal(hiddenAnimals().concat(lastTapped ? [lastTapped] : []));
  recent.push(A.id); if (recent.length > 8) recent.shift();
  const h = {
    A, spotId: spot.id, spot, x: spot.x, y: spot.y, k: (spot.s / 115) * (A.scale || 1),
    state: 'arrive', t0: now + (delay || 0), ph: Math.random() * 10,
    nextBlink: now + rand(1, 4), blinkT: -1, nextPeek: now + rand(0.6, 2.4),
    peekT: -1, peekDur: 0, peekAmt: 0, react: null, dx: 0, dy: 0
  };
  hiders.push(h);
  spot.rustle = 1; sfx('rustle');
  return h;
}

function emit(type, x, y, n, opt) {
  opt = opt || {};
  for (let i = 0; i < n; i++) {
    const a = opt.ang != null ? opt.ang + rand(-opt.spread || -0.6, opt.spread || 0.6) : rand(0, TAU), sp = rand(opt.vmin || 60, opt.vmax || 180);
    particles.push({ type, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: rand(opt.lmin || 0.7, opt.lmax || 1.3), s: rand(opt.smin || 8, opt.smax || 16) * (opt.k || 1),
      rot: rand(0, TAU), vr: rand(-3, 3), col: opt.cols ? opt.cols[Math.floor(Math.random() * opt.cols.length)] : '#fff', glyph: ['♪', '♫', '♩', '♬'][Math.floor(Math.random() * 4)], g: opt.g == null ? 0 : opt.g });
  }
}
const NOTE_COLS = ['#ff5fa2', '#ffb020', '#41b0ff', '#8e6bff', '#2ecc71', '#ff6b4a'];
function drawParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]; p.life += dt; if (p.life >= p.max) { particles.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.rot += p.vr * dt;
    const f = p.life / p.max, al = f < 0.15 ? f / 0.15 : 1 - Math.max(0, (f - 0.6) / 0.4);
    ctx.save(); ctx.globalAlpha = al; ctx.translate(p.x, p.y);
    if (p.type === 'note') { p.vx *= 0.985; ctx.rotate(Math.sin(p.life * 6) * 0.3); ctx.font = '900 ' + Math.round(p.s * 1.6) + 'px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = p.s * 0.25; ctx.strokeStyle = '#fff'; ctx.strokeText(p.glyph, 0, 0); ctx.fillStyle = p.col; ctx.fillText(p.glyph, 0, 0); }
    else if (p.type === 'sparkle') { ctx.rotate(p.rot); const s = p.s * (1 - f * 0.5) * (0.8 + 0.2 * Math.sin(p.life * 20)); ctx.beginPath(); for (let k = 0; k < 8; k++) { const r = k % 2 ? s * 0.28 : s; const a = k * Math.PI / 4; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fillStyle = p.col; ctx.fill(); }
    else if (p.type === 'dust') { p.vx *= 0.95; p.vy *= 0.95; const s = p.s * (0.6 + f); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.arc(0, 0, s, 0, TAU); ctx.fill(); }
    else if (p.type === 'leaf') { p.vx *= 0.98; ctx.rotate(p.rot); ctx.fillStyle = p.col; ctx.beginPath(); ctx.ellipse(0, 0, p.s, p.s * 0.45, 0, 0, TAU); ctx.fill(); }
    else if (p.type === 'heart') { c = ctx; ctx.rotate(Math.sin(p.life * 5) * 0.3); heart(0, 0, p.s); ctx.fillStyle = p.col; ctx.fill(); }
    else if (p.type === 'star') {
      ctx.restore(); ctx.save();
      const e = easeIn(Math.min(1, f * 1.15)); const x = lerp(p.x0, p.tx, e), y = lerp(p.y0, p.ty, e) - Math.sin(e * Math.PI) * 60;
      ctx.translate(x, y); ctx.rotate(p.life * 6); c = ctx; star5(0, 0, p.s, p.s * 0.45, 0); ctx.fillStyle = '#ffd23f'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#e09a00'; ctx.stroke();
      if (f > 0.85 && !p.done) { p.done = true; stars++; starBump = 1; sfx('chime'); }
    }
    ctx.restore();
  }
}

function bubbleFor(a, word, col) { bubbles.push({ a, word, t0: now, life: Math.max(1.1, (a.react && a.react.dur ? a.react.dur : 1) + 0.3), col: col || a.A.col }); }
function drawBubbles() {
  const placed = [];
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i], age = now - b.t0; if (age > b.life) { bubbles.splice(i, 1); continue; }
    const a = b.a; const k = a.k || 0.7;
    const sc = age < 0.35 ? easeOutBack(age / 0.35) : age > b.life - 0.2 ? Math.max(0, (b.life - age) / 0.2) : 1;
    let fs = Math.max(16, Math.min(46, 34 * k)); if (b.word.length > 10) fs *= 0.72;
    ctx.font = '900 ' + Math.round(fs) + 'px "Arial Rounded MT Bold","Trebuchet MS",system-ui,sans-serif';
    const tw = ctx.measureText(b.word).width, bw = tw + fs * 1.1, bh = fs * 1.6;
    let bx = a.x + (a.dx || 0) + 30 * k, by = a.y + (a.dy || 0) - 200 * k - bh * 0.5;
    bx = clamp(bx, bw / 2 + 6, W - bw / 2 - 6); by = clamp(by, bh / 2 + 6, H - bh);
    for (let pass = 0; pass < 3; pass++) for (const r of placed) {
      if (Math.abs(bx - r.x) < (bw + r.w) / 2 + 4 && Math.abs(by - r.y) < (bh + r.h) / 2 + 4) {
        const up = r.y - (bh + r.h) / 2 - 6, down = r.y + (bh + r.h) / 2 + 6;
        by = (up > bh / 2 + 4 && Math.abs(up - by) <= Math.abs(down - by)) || down > H - bh ? up : down;
      }
    }
    by = clamp(by, bh / 2 + 4, H - bh); placed.push({ x: bx, y: by, w: bw, h: bh });
    ctx.save(); ctx.translate(bx, by); ctx.scale(sc, sc); ctx.rotate(Math.sin(age * 9) * 0.04);
    ctx.beginPath(); ctx.roundRect(-bw / 2, -bh / 2, bw, bh, bh * 0.5);
    const tx = clamp(a.x + (a.dx || 0) - bx, -bw * 0.3, bw * 0.3);
    ctx.moveTo(tx - fs * 0.35, bh / 2 - 1); ctx.lineTo(tx * 0.8, bh / 2 + fs * 0.55); ctx.lineTo(tx + fs * 0.35, bh / 2 - 1);
    ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(0,0,0,.18)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3; ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.lineWidth = Math.max(2, fs * 0.09); ctx.strokeStyle = shade(b.col === '#f7f3ee' || b.col === '#fbfaf6' || b.col === '#fff6ea' || b.col === '#f0e6d2' ? '#999999' : b.col, -0.35); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.fillRect(tx - fs * 0.3, bh / 2 - fs * 0.12, fs * 0.6, fs * 0.2);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let x = -tw / 2; const cols = ['#ff4f8b', '#ff9a1f', '#2d9cff', '#7b5cff', '#21b36b'];
    for (let j = 0; j < b.word.length; j++) {
      const ch = b.word[j], w = ctx.measureText(ch).width, yy = Math.sin(age * 12 - j * 0.6) * fs * 0.08;
      ctx.lineWidth = fs * 0.16; ctx.strokeStyle = '#3a2430'; ctx.lineJoin = 'round'; ctx.strokeText(ch, x + w / 2, yy + fs * 0.04);
      ctx.fillStyle = cols[(j + i) % cols.length]; ctx.fillText(ch, x + w / 2, yy + fs * 0.04); x += w;
    }
    ctx.restore();
  }
}

function poseFor(h, t) {
  const ph = h.ph, A = h.A;
  const P = { t: t + ph, blink: 1, mouth: 0, ear: Math.sin(t * 2.6 + ph) * 0.6, tail: Math.sin(t * 3.4 + ph), wing: 0, step: 0, lookX: 0, lookY: 0, pop: 0, squeeze: false, armUp: 0 };
  const tw = (t + ph) % 4.3; if (tw < 0.25) P.ear += Math.sin(tw * 50) * 0.8;
  if (now > h.nextBlink) { h.blinkT = now; h.nextBlink = now + rand(1.8, 4.5); }
  const bt = now - h.blinkT; if (bt >= 0 && bt < 0.16) P.blink = Math.abs(bt / 0.08 - 1) * 0.9 + 0.05;
  if (pointer.x >= 0) { P.lookX = clamp((pointer.x - h.x) / (W * 0.3), -1, 1); P.lookY = clamp((pointer.y - (h.y - 130 * h.k)) / (H * 0.4), -1, 1); }
  if (A.id === 'duck' || A.id === 'chicken' || A.id === 'chick') P.wing = Math.max(0, Math.sin(t * 2 + ph)) * 0.15;
  return P;
}

const ARRIVE_DUR = 0.45, POP_RISE = 0.42, DUCK_DUR = 0.48;

function hiderVisible(h) {
  return h.state === 'pop' || h.state === 'duck' || h.state === 'peek' || (h.state === 'hide' && h.peekAmt > 0.02);
}

function updateHider(h, dt) {
  const sp = h.spot; if (!sp) return;
  let t = now - h.t0;
  // decay hide-object motion
  sp.shake = Math.max(0, (sp.shake || 0) - dt * 3);
  sp.rustle = Math.max(0, (sp.rustle || 0) - dt * 1.8);
  if (h.state === 'pop') sp.door = Math.min(1, (sp.door || 0) + dt * 3);
  else if (h.state === 'duck') sp.door = Math.max(0, (sp.door || 0) - dt * 2);
  else sp.door = Math.max(0, (sp.door || 0) - dt * 1.2);

  if (t < 0 && h.state === 'arrive') return;

  if (h.state === 'arrive') {
    const p = Math.min(1, t / ARRIVE_DUR);
    sp.rustle = Math.max(sp.rustle, 1 - p);
    sp.shake = Math.max(sp.shake, 0.4 * (1 - p));
    if (p >= 1) { h.state = 'hide'; h.t0 = now; h.nextPeek = now + rand(0.8, 2.8); }
    h.peekAmt = 0;
    return;
  }

  if (h.state === 'hide') {
    // schedule peeks
    if (now > h.nextPeek) {
      h.state = 'peek'; h.peekT = now; h.peekDur = rand(0.7, 1.5); h.t0 = now;
    }
    h.peekAmt = Math.max(0, h.peekAmt - dt * 2.5);
    return;
  }

  if (h.state === 'peek') {
    const pt = now - h.peekT, d = h.peekDur;
    const up = 0.22, down = 0.28;
    if (pt < up) h.peekAmt = easeOut(pt / up);
    else if (pt < d - down) h.peekAmt = 1;
    else if (pt < d) h.peekAmt = 1 - easeIn((pt - (d - down)) / down);
    else { h.peekAmt = 0; h.state = 'hide'; h.nextPeek = now + rand(1.6, 4.2); }
    // a little ear wiggle at the top of the peek
    return;
  }

  if (h.state === 'pop') {
    const r = h.react, rt = t;
    const fi = Math.floor(rt * 40 / ((r && r.rate) || 1));
    const ev = r && r.env && fi < r.env.length ? r.env[fi] : (r && rt < r.dur ? 0.5 : 0.4);
    r.sm = r.sm == null ? ev : (ev > r.sm ? lerp(r.sm, ev, 0.6) : lerp(r.sm, ev, 0.18));
    if (rt > r.total) startDuck(h);
    h.peekAmt = 1;
    return;
  }

  if (h.state === 'duck') {
    const p = Math.min(1, t / DUCK_DUR);
    h.peekAmt = 1; // clip handled by rise amount
    if (p >= 1) {
      h.state = 'gone';
      sp.door = 0; sp.rustle = 0.4;
    }
  }
}

function riseAmount(h) {
  // 0 = tucked behind, 1 = standing fully at the hide's base
  if (h.state === 'arrive') return 0;
  if (h.state === 'hide') return h.peekAmt * 0.15;
  if (h.state === 'peek') return 0.12 + h.peekAmt * 0.55;
  if (h.state === 'pop') {
    const rt = now - h.t0;
    return easeOutBack(Math.min(1, rt / POP_RISE));
  }
  if (h.state === 'duck') {
    return 1 - easeIn(Math.min(1, (now - h.t0) / DUCK_DUR));
  }
  return 0;
}

function poseAndDrawHider(h, inFront) {
  if (h.state === 'arrive' || h.state === 'gone') return;
  const rise = riseAmount(h);
  if (rise < 0.02) return;
  const popping = h.state === 'pop' || (h.state === 'duck' && rise > 0.55);
  if (inFront && !popping) return;
  if (!inFront && popping) return;

  const P = poseFor(h, now);
  let dx = 0, dy = 0, sx = 1, sy = 1, rot = Math.sin(now * 1.1 + h.ph) * 0.035;
  const br = Math.sin(now * 2.2 + h.ph);
  sy *= 1 + br * 0.022; sx *= 1 - br * 0.012;
  const k = h.k, sp = h.spot;
  const lip = sp.lip;
  const tall = 200 * k;
  // tucked: top of the animal sits just under the lip; popped: feet at the hide's base
  const feetHidden = lip + tall - 6 * k;
  const showMax = (sp.type === 'fence' ? 100 : sp.type === 'barn' ? 95 : 78) * k;
  let feetY;
  if (popping) {
    feetY = lerp(feetHidden, sp.y - 4, clamp(rise, 0, 1));
  } else {
    const show = lerp(0, showMax, clamp(rise, 0, 1));
    feetY = lip + tall - show;
  }

  if (h.state === 'pop' && h.react) {
    const r = h.react, rt = now - h.t0;
    const m = rt < r.dur ? Math.max(0.18, r.sm || 0.5) : Math.max(0, r.sm || 0);
    P.mouth = clamp(m * 1.05, 0, 1);
    P.pop = rt < 0.3 ? Math.sin(rt / 0.3 * Math.PI) : 0;
    if (r.sm > 0.62 && rt > 0.25) r.sq = true; else if (r.sm < 0.4) r.sq = false;
    P.squeeze = !!r.sq;
    P.armUp = Math.min(1, rt * 5) * (0.6 + 0.4 * Math.sin(rt * 14));
    P.wing = 0.5 + 0.5 * Math.sin(rt * 28);
    P.ear = Math.sin(rt * 22) * 0.9; P.tail = Math.sin(rt * 18);
    const hop = rt < 0.42 ? Math.sin(rt / 0.42 * Math.PI) : 0;
    dy -= hop * 34 * k;
    const s0 = rt < 0.08 ? -rt / 0.08 * 0.2 : rt < 0.42 ? 0.12 * Math.sin((rt - 0.08) / 0.34 * Math.PI) : 0;
    const wob = Math.sin(rt * 16) * 0.06 * (r.sm || 0);
    sy *= 1 + s0 + wob; sx *= 1 - s0 * 0.6 - wob * 0.6;
    rot += Math.sin(rt * 11) * 0.07 * (r.sm || 0);
    if (rt - r.lastEmit > 0.14 && (r.sm || 0) > 0.35 && rt < r.dur) { r.lastEmit = rt; emit('note', h.x + rand(-60, 60) * k, feetY + dy - 170 * k, 1, { ang: -Math.PI / 2, spread: 0.7, vmin: 50, vmax: 110, k: Math.max(0.6, k), cols: NOTE_COLS, lmin: 0.9, lmax: 1.4 }); }
  } else if (h.state === 'peek' || h.state === 'hide') {
    P.ear = Math.sin(now * 8 + h.ph) * 0.8;
    P.lookY = -0.3;
    rot += Math.sin(now * 6 + h.ph) * 0.06 * rise;
  }

  h.dx = dx; h.dy = dy;
  const feetWorldY = feetY + dy;

  ctx.save();
  // clip when still behind the hide so only the top peeks over the lip (or through the doorway)
  if (!popping) {
    ctx.beginPath();
    if (sp.type === 'barn') {
      const dw = sp.s * 0.72, dh = sp.s * 0.95;
      ctx.rect(sp.x - dw / 2, sp.y - dh, dw, dh + 2);
    } else {
      ctx.rect(sp.x - sp.hitW, -10, sp.hitW * 2, lip + 2);
    }
    ctx.clip();
  }
  // shadow
  ctx.fillStyle = 'rgba(30,70,20,' + (0.18 * Math.min(1, rise + 0.2)) + ')';
  ctx.beginPath(); ctx.ellipse(h.x + dx, sp.y + 2, 55 * k * Math.min(1, rise + 0.3), 10 * k, 0, 0, TAU); ctx.fill();
  ctx.translate(h.x + dx, feetWorldY); ctx.rotate(rot); ctx.scale(k * sx, k * sy);
  c = ctx; h.A.draw(P);
  ctx.restore();
}

function startDuck(h) {
  if (h.state === 'duck' || h.state === 'gone') return;
  h.state = 'duck'; h.t0 = now;
  sfx('whoosh');
  lastVacated = h.spotId;
}

function popHider(h) {
  if (h.state === 'pop' || h.state === 'duck' || h.state === 'gone' || h.state === 'arrive') return false;
  h.state = 'pop'; h.t0 = now; lastTapped = h.A.id;
  const snd = playAnimal(h.A.id);
  const dur = snd ? snd.dur : 1.2;
  h.react = { dur, env: snd ? snd.env : null, rate: snd ? snd.rate : 1, total: Math.max(1.4, dur + 0.4), lastEmit: -1, sm: 0 };
  h.spot.shake = 1; h.spot.door = Math.max(h.spot.door || 0, 0.3);
  bubbleFor(h, h.A.word);
  const k = h.k;
  emit('sparkle', h.x, h.spot.lip, 10, { k, cols: ['#fff', '#ffe066', '#ffd1f0'], vmin: 120, vmax: 260, lmin: 0.4, lmax: 0.9 });
  emit('heart', h.x, h.spot.lip - 20, 3, { ang: -Math.PI / 2, spread: 0.9, vmin: 60, vmax: 140, k, smin: 8, smax: 13, cols: ['#ff5f8f', '#ff8fb1'], g: -20 });
  emit('leaf', h.x, h.spot.lip, 6, { k, cols: ['#4db84a', '#8fd15a', '#e8c14a'], vmin: 40, vmax: 120, lmin: 0.5, lmax: 0.9, smin: 5, smax: 10, g: 80 });
  particles.push({ type: 'star', x0: h.x, y0: h.spot.lip - 30, tx: 34, ty: 30, life: 0, max: 1.0, s: 14, x: 0, y: 0, vx: 0, vy: 0, g: 0, vr: 0, rot: 0 });
  hintOn = false;
  return true;
}

function hiderAtSpot(sp) { return hiders.find(h => h.spotId === sp.id && h.state !== 'gone'); }

function drawButterfly(s, dt) {
  s.life += dt;
  const p = s.life / s.max;
  s.x += s.vx * dt; s.y += s.vy * dt;
  s.vx += Math.sin(s.life * 8 + s.ph) * 80 * dt;
  s.vy += Math.cos(s.life * 6 + s.ph) * 40 * dt - 20 * dt;
  const flap = 0.35 + 0.65 * Math.abs(Math.sin(s.life * 24));
  ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(Math.sin(s.life * 3) * 0.3); ctx.globalAlpha = p < 0.12 ? p / 0.12 : Math.max(0, 1 - (p - 0.75) / 0.25);
  for (const side of [-1, 1]) {
    ctx.save(); ctx.scale(side, 1); ctx.rotate((1 - flap) * 0.9);
    ctx.beginPath(); ctx.ellipse(10, -4, 16, 11, -0.3, 0, TAU);
    const g = ctx.createRadialGradient(8, -4, 2, 10, -4, 16);
    g.addColorStop(0, '#fff7a0'); g.addColorStop(0.4, s.col); g.addColorStop(1, shade(s.col, -0.2));
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = '#3a2430'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(9, 8, 11, 8, 0.2, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = '#3a2430'; ctx.beginPath(); ctx.ellipse(0, 0, 3, 10, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#3a2430'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-1, -10); ctx.quadraticCurveTo(-6, -18, -8, -22); ctx.moveTo(1, -10); ctx.quadraticCurveTo(6, -18, 8, -22); ctx.stroke();
  ctx.restore();
  return p >= 1;
}

function drawBooGhost(s, dt) {
  s.life += dt;
  const p = s.life / s.max;
  const appear = p < 0.2 ? easeOutBack(p / 0.2) : p > 0.75 ? Math.max(0, (1 - p) / 0.25) : 1;
  s.y += -20 * dt;
  s.x += Math.sin(s.life * 5) * 10 * dt;
  ctx.save(); ctx.translate(s.x, s.y); ctx.scale(appear * s.s, appear * s.s); ctx.globalAlpha = Math.min(1, appear + 0.1);
  // chubby friendly ghost
  ctx.beginPath(); ctx.moveTo(-28, 10); ctx.bezierCurveTo(-28, -40, 28, -40, 28, 10);
  ctx.quadraticCurveTo(22, 18, 16, 10); ctx.quadraticCurveTo(8, 20, 0, 10); ctx.quadraticCurveTo(-8, 20, -16, 10); ctx.quadraticCurveTo(-22, 18, -28, 10);
  ctx.closePath();
  const g = ctx.createRadialGradient(-8, -16, 4, 0, 0, 40);
  g.addColorStop(0, '#fff'); g.addColorStop(1, s.col);
  ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#3a2430'; ctx.stroke();
  // happy face
  c = ctx;
  const P = { blink: p > 0.55 && p < 0.62 ? 0.1 : 1, mouth: 0.7, pop: 0.2, squeeze: false, lookX: 0, lookY: -0.2 };
  eyes(10, -8, 9, P, '#7a5ad0');
  blush(18, 2, 7, 0.5);
  mouth(0, 8, 16, 0.7);
  ctx.restore();
  return p >= 1;
}

function spawnSurprise(sp) {
  sp.shake = 1; sp.rustle = 1; sp.cool = now + 1.3;
  const kind = Math.random() < 0.5 ? 'butterfly' : 'boo';
  if (kind === 'butterfly') {
    sfx('flutter');
    const cols = ['#ff7a3a', '#ff4f8b', '#7b5cff', '#41b0ff', '#ffd23f'];
    const s = { kind, x: sp.x, y: sp.lip, vx: rand(-40, 40), vy: rand(-140, -80), life: 0, max: 1.8, ph: Math.random() * 10, col: cols[Math.floor(Math.random() * cols.length)] };
    surprises.push(s);
    bubbleFor({ x: sp.x, y: sp.y, k: 0.7, dx: 0, dy: 0, A: { col: s.col }, react: { dur: 1 } }, 'WHEE!', s.col);
  } else {
    sfx('boo'); setTimeout(() => sfx('giggle'), 180);
    const s = { kind, x: sp.x, y: sp.lip - 10, life: 0, max: 1.5, s: 1 + Math.random() * 0.15, col: '#e8e4ff' };
    surprises.push(s);
    bubbleFor({ x: sp.x, y: sp.y, k: 0.75, dx: 0, dy: 0, A: { col: '#b8a6ff' }, react: { dur: 1.1 } }, 'BOO!', '#b8a6ff');
  }
  emit('sparkle', sp.x, sp.lip, 12, { cols: ['#fff', '#ffe066', '#d0b0ff'], vmin: 80, vmax: 200, lmin: 0.4, lmax: 0.9, smin: 6, smax: 12 });
  // still a star — toddlers should be rewarded for every fun tap
  particles.push({ type: 'star', x0: sp.x, y0: sp.lip - 20, tx: 34, ty: 30, life: 0, max: 1.0, s: 14, x: 0, y: 0, vx: 0, vy: 0, g: 0, vr: 0, rot: 0 });
  hintOn = false;
}

function onDown(e) {
  if (creditOpen) { closeCredits(); return; }
  unlockAudio();
  const x = e.clientX, y = e.clientY; pointer.x = x; pointer.y = y;
  const sp = hitSpot(x, y);
  if (sp) {
    const h = hiderAtSpot(sp);
    if (h && (h.state === 'hide' || h.state === 'peek')) popHider(h);
    else if (h && h.state === 'pop') { /* already popping — ignore extra taps */ }
    else if (h && (h.state === 'arrive' || h.state === 'duck')) { emit('sparkle', x, y, 4, { cols: ['#fff', '#ffe066'], vmin: 40, vmax: 100, lmin: 0.3, lmax: 0.5, smin: 5, smax: 9 }); }
    else if (!h && now >= (sp.cool || 0)) spawnSurprise(sp);
    else { emit('sparkle', x, y, 5, { cols: ['#fff', '#ffe066'], vmin: 40, vmax: 100, lmin: 0.3, lmax: 0.5, smin: 5, smax: 9 }); sfx('pop'); }
  } else {
    emit('sparkle', x, y, 6, { cols: ['#fff', '#ffe066', '#bdf'], vmin: 40, vmax: 120, lmin: 0.3, lmax: 0.6, smin: 5, smax: 10 }); sfx('pop');
  }
  e.preventDefault();
}
canvas.addEventListener('pointerdown', onDown, { passive: false });
document.addEventListener('touchend', unlockAudio, { passive: true });
document.addEventListener('click', unlockAudio);
canvas.addEventListener('pointermove', e => { pointer.x = e.clientX; pointer.y = e.clientY; });
window.addEventListener('resize', layout);
window.addEventListener('orientationchange', () => setTimeout(layout, 120));
document.addEventListener('visibilitychange', () => { if (!actx) return; if (document.hidden) actx.suspend().catch(() => {}); else if (audioReady) actx.resume().catch(() => {}); });

/* ---------- credits ---------- */
let creditOpen = false;
const creditBtn = document.getElementById('credits'), creditPanel = document.getElementById('creditPanel');
creditPanel.innerHTML = window.__CREDITS || '';
function closeCredits() { creditOpen = false; creditPanel.style.display = 'none'; }
creditBtn.addEventListener('pointerdown', e => { e.stopPropagation(); creditOpen = !creditOpen; creditPanel.style.display = creditOpen ? 'block' : 'none'; });
creditPanel.addEventListener('pointerdown', e => { e.stopPropagation(); closeCredits(); });

/* ---------- HUD ---------- */
function drawHUD(dt) {
  starBump = Math.max(0, starBump - dt * 3);
  const s = 1 + starBump * 0.35, h = Math.max(34, Math.min(52, H * 0.06));
  ctx.save(); ctx.translate(Math.max(10, W * 0.015), Math.max(10, H * 0.015));
  ctx.font = '900 ' + Math.round(h * 0.62) + 'px "Arial Rounded MT Bold","Trebuchet MS",system-ui,sans-serif';
  const txt = String(stars), tw = ctx.measureText(txt).width, w = h * 1.25 + tw + h * 0.4;
  ctx.beginPath(); ctx.roundRect(0, 0, w, h, h / 2); ctx.fillStyle = 'rgba(255,255,255,.88)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#ffc93c'; ctx.stroke();
  ctx.save(); ctx.translate(h * 0.55, h / 2); ctx.scale(s, s); ctx.rotate(Math.sin(now * 2) * 0.12); c = ctx; star5(0, 0, h * 0.34, h * 0.15, 0); ctx.fillStyle = '#ffd23f'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#e09a00'; ctx.stroke(); ctx.restore();
  ctx.fillStyle = '#5a3a10'; ctx.textBaseline = 'middle'; ctx.save(); ctx.translate(h * 1.05, h / 2 + 1); ctx.scale(1 + starBump * 0.2, 1 + starBump * 0.2); ctx.fillText(txt, 0, 0); ctx.restore();
  ctx.restore();
  if (hintOn) {
    const hider = hiders.find(h => h.state === 'peek' || h.state === 'hide') || hiders.find(h => h.state !== 'gone');
    const fs = Math.max(18, Math.min(34, W * 0.05));
    ctx.save();
    ctx.font = '900 ' + Math.round(fs) + 'px "Arial Rounded MT Bold","Trebuchet MS",system-ui,sans-serif';
    ctx.textAlign = 'center'; ctx.lineWidth = fs * 0.22; ctx.strokeStyle = '#fff'; ctx.lineJoin = 'round';
    const ty = Math.max(fs * 1.2, H * 0.03 + fs * 0.6) + h * 0;
    ctx.strokeText('Tap a hiding place!', W / 2, ty + fs * 0.4); ctx.fillStyle = '#ff5f8f'; ctx.fillText('Tap a hiding place!', W / 2, ty + fs * 0.4);
    if (hider && hider.spot) {
      const p = (now % 1.4) / 1.4, hx = hider.x + 20, hy = hider.spot.lip - 10 + Math.sin(p * TAU) * 10;
      ctx.globalAlpha = 0.9; ctx.font = Math.round(Math.max(34, 48 * (hider.k || 0.7))) + 'px system-ui,sans-serif'; ctx.fillText('👆', hx, hy);
    }
    ctx.restore();
  }
}

function frame(ts) {
  const t = ts / 1000; const dt = Math.min(0.05, lastT ? t - lastT : 0.016); lastT = t; now = t;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.drawImage(bg, 0, 0, W, H);
  drawSky(ctx, now, dt);

  for (const h of hiders) updateHider(h, dt);
  for (let i = hiders.length - 1; i >= 0; i--) if (hiders[i].state === 'gone') hiders.splice(i, 1);

  // safety: keep about 4 hidden animals
  const live = hiders.filter(h => h.state !== 'gone' && h.state !== 'duck').length;
  if (live < HIDDEN_COUNT) {
    const dest = pickSpot(occupiedIds().concat(lastVacated && live + 1 <= HIDDEN_COUNT ? [lastVacated] : []));
    if (dest) hideAt(dest, 0.05);
  }

  // draw spots back-to-front, with hiders tucked in
  const ordered = spots.slice().sort((a, b) => a.z - b.z || a.y - b.y);
  for (const sp of ordered) {
    drawHideBack(ctx, sp, now);
    const h = hiderAtSpot(sp);
    if (h) poseAndDrawHider(h, false);
    drawHideFront(ctx, sp, now);
    if (h) poseAndDrawHider(h, true);
  }

  for (let i = surprises.length - 1; i >= 0; i--) {
    const done = surprises[i].kind === 'butterfly' ? drawButterfly(surprises[i], dt) : drawBooGhost(surprises[i], dt);
    if (done) surprises.splice(i, 1);
  }

  drawBubbles();
  drawParticles(dt);
  drawHUD(dt);
  requestAnimationFrame(frame);
}

function drawSheet(mode) {
  W = window.innerWidth; H = window.innerHeight; DPR = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * DPR; canvas.height = H * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const sg = ctx.createLinearGradient(0, 0, 0, H); sg.addColorStop(0, '#dff4ff'); sg.addColorStop(1, '#d8f5c8'); ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);
  const cols = 4, rows = 3, cw = W / cols, ch = (H - 10) / rows, k = Math.min(cw / 220, ch / 270);
  ANIMALS.forEach((A, i) => {
    const x = (i % cols + 0.5) * cw, y = 10 + (Math.floor(i / cols) + 1) * ch - 30 * k;
    ctx.fillStyle = 'rgba(30,70,20,.2)'; ctx.beginPath(); ctx.ellipse(x, y + 2, 70 * k, 12 * k, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(x, y); ctx.scale(k * (A.scale || 1), k * (A.scale || 1)); c = ctx;
    const P = { t: 1.3, blink: 1, mouth: 0, ear: 0.3, tail: 0.5, wing: 0, step: 0, lookX: 0, lookY: 0, pop: 0, squeeze: false, armUp: 0 };
    if (mode === 'react') Object.assign(P, { mouth: 0.8, pop: 0.5, wing: 0.8, armUp: 0.7 });
    A.draw(P); ctx.restore();
    ctx.font = '900 ' + Math.round(20 * k) + 'px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 5 * k; ctx.strokeStyle = '#fff'; ctx.lineJoin = 'round';
    ctx.strokeText(A.name, x, y + 24 * k); ctx.fillStyle = '#234'; ctx.fillText(A.name, x, y + 24 * k);
  });
}

window.__PF = {
  state: () => ({
    stars, hiders: hiders.map(h => ({ id: h.A.id, spot: h.spotId, state: h.state, peek: +h.peekAmt.toFixed(2) })),
    occupied: occupiedIds(), spots: spots.map(s => ({ id: s.id, type: s.type, x: s.x, y: s.y, lip: s.lip })),
    buffers: Object.keys(buffers).length, surprises: surprises.length
  }),
  tapHidden: () => { const h = hiders.find(h => h.state === 'hide' || h.state === 'peek'); if (!h) return null; return { x: h.x, y: h.spot.lip + 8, id: h.A.id, spot: h.spotId }; },
  tapEmpty: () => { const occ = new Set(occupiedIds()); const sp = spots.find(s => !occ.has(s.id) && now >= (s.cool || 0)); if (!sp) return null; return { x: sp.x, y: sp.lip + 10, spot: sp.id }; },
  forcePeek: () => { for (const h of hiders) if (h.state === 'hide') { h.state = 'peek'; h.peekT = now; h.peekDur = 2; h.t0 = now; } },
  buffers: () => Object.keys(buffers).filter(k => k !== '__music').length
};

if (SHEET) {
  document.getElementById('credits').style.display = 'none';
  document.getElementById('musicCredit').style.display = 'none';
  drawSheet(SHEET);
}
else {
  layout(); initAudio();
  // stagger the first hiders
  const shuf = spots.slice().sort(() => Math.random() - 0.5);
  for (let i = 0; i < HIDDEN_COUNT; i++) hideAt(shuf[i], 0.15 + i * 0.18);
  requestAnimationFrame(frame);
}
