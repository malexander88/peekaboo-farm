/* ================= the 12 farm animals ================= */
// shared chibi body
function chibiBody(col, belly, P, footCol, opts) {
  opts = opts || {};
  blob(0, -50, opts.bw || 44, opts.bh || 40, col);
  if (belly) { ell(0, -44, (opts.bw || 44) * 0.62, (opts.bh || 40) * 0.68); c.fillStyle = belly; c.fill(); }
  feet(opts.fdx || 22, footCol || col, P, opts.fw);
  if (!opts.noArms) arms(opts.adx || 34, -72, col, P, opts.alen);
}
function headBase(col, x, y, rx, ry) { blob(x, y, rx, ry, col); gloss(x - rx * 0.35, y - ry * 0.45, rx * 0.4, ry * 0.25, 0.45); }

const ANIMALS = [
{ id: 'cow', name: 'Cow', word: 'MOO!', exit: 'hop', col: '#f7f3ee', draw(P) {
  const w = '#f7f3ee', b = '#3d3638', pink = '#ffb6c4';
  c.save(); c.translate(38, -40); c.rotate(-0.4 + P.tail * 0.5); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(20, -10, 22, -40); c.lineWidth = 6; c.strokeStyle = shade(w, -0.58); c.stroke(); blob(22, -44, 6, 9, b); c.restore();
  chibiBody(w, null, P, b, { noArms: false });
  flat(-18, -60, 14, 11, b, 0.3); flat(24, -42, 10, 8, b);
  // horns & ears
  for (const s of [-1, 1]) { path('#f3dfa8', s * 26, -184, 10, () => { c.moveTo(s * 18, -172); c.quadraticCurveTo(s * 22, -196, s * 36, -198); c.quadraticCurveTo(s * 36, -184, s * 32, -170); }); }
  for (const s of [-1, 1]) { c.save(); c.translate(s * 56, -146); c.rotate(s * (0.35 + P.ear * 0.25)); blob(s * 14, 0, 20, 10, w); flat(s * 15, 0, 13, 5, pink); c.restore(); }
  c.beginPath(); c.moveTo(-14, -78); c.quadraticCurveTo(0, -70, 14, -78); c.lineWidth = 5; c.strokeStyle = '#d94a4a'; c.stroke(); blob(0, -66, 9, 9, '#ffcf3d'); flat(0, -62, 2.5, 2.5, '#8a6a10');
  headBase(w, 0, -128, 58, 54);
  flat(26, -160, 18, 14, b, 0.4); flat(-34, -140, 9, 13, b, -0.3);
  eyes(22, -142, 16, P, '#5a3420');
  blob(0, -103, 40, 26, pink);
  gloss(-14, -112, 12, 6, 0.6, 0);
  flat(-14, -108, 5, 7, shade(pink, -0.35)); flat(14, -108, 5, 7, shade(pink, -0.35));
  mouth(0, -92, 22, P.mouth);
  blush(46, -118, 10, 0.35);
}},
{ id: 'pig', name: 'Pig', word: 'OINK!', exit: 'hop', col: '#ffb3c6', draw(P) {
  const p = '#ffb3c6', d = '#ff8fab';
  c.save(); c.translate(42, -50); c.rotate(P.tail * 0.5); c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(14, -4, 16, -18, 8, -18); c.bezierCurveTo(0, -18, 2, -6, 12, -8); c.lineWidth = 5; c.strokeStyle = shade(p, -0.58); c.lineCap = 'round'; c.stroke(); c.lineWidth = 2.5; c.strokeStyle = p; c.stroke(); c.restore();
  chibiBody(p, null, P, shade(p, -0.12), { bw: 48 });
  for (const s of [-1, 1]) { c.save(); c.translate(s * 38, -172); c.rotate(s * (0.4 + P.ear * 0.3)); path(p, 0, 0, 20, () => { c.moveTo(-14, 8); c.quadraticCurveTo(s * 2, -30, s * 22, -12); c.quadraticCurveTo(s * 18, 14, -14, 8); }); flat(s * 4, -4, 7, 10, d, s * 0.6); c.restore(); }
  headBase(p, 0, -126, 62, 54);
  eyes(26, -140, 15, P, '#5a3a5a');
  blush(46, -112, 13, 0.55);
  blob(0, -112, 24, 17, d);
  gloss(-8, -120, 8, 4, 0.6, 0);
  flat(-8, -112, 4.5, 7, '#c2557a'); flat(8, -112, 4.5, 7, '#c2557a');
  mouth(0, -90, 22, P.mouth);
}},
{ id: 'sheep', name: 'Sheep', word: 'BAA!', exit: 'hop', col: '#fbfaf6', draw(P) {
  const wool = '#fbfaf6', face = '#f3d6bd', leg = '#5a4f4d';
  for (const s of [-1, 1]) { c.beginPath(); c.roundRect(s * 22 - 6, -26, 12, 24, 5); c.fillStyle = leg; c.fill(); }
  feet(22, leg, P, 11);
  // wool body = cloud of circles
  const puff = (cx, cy, R, n) => { c.beginPath(); for (let i = 0; i < n; i++) { const a = i / n * TAU; c.moveTo(cx + Math.cos(a) * R + 16, cy + Math.sin(a) * R * 0.85); c.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R * 0.85, 16, 0, TAU); } c.arc(cx, cy, R, 0, TAU); };
  puff(0, -56, 38, 10); c.fillStyle = shade(wool, -0.58); c.lineWidth = LW * 2; c.strokeStyle = shade(wool, -0.45); c.stroke(); c.fillStyle = grad('#f4f1ea', 0, -56, 56); c.fill();
  for (const s of [-1, 1]) { c.save(); c.translate(s * 44, -128); c.rotate(s * (0.5 + P.ear * 0.3)); blob(s * 12, 0, 18, 9, face); flat(s * 12, 0, 11, 4.5, '#f2a6b4'); c.restore(); }
  headBase(face, 0, -122, 44, 46);
  // wool tuft on head
  c.save(); c.translate(0, -164); c.rotate(P.ear * 0.05); puff(0, 0, 22, 7); c.lineWidth = LW * 2; c.strokeStyle = shade(wool, -0.45); c.stroke(); c.fillStyle = grad('#fdfcf8', 0, -4, 34); c.fill(); c.restore();
  eyes(17, -128, 14, P, '#4a3a5a');
  blush(28, -104, 9, 0.5);
  flat(-5, -104, 2.4, 2, '#7a5050'); flat(5, -104, 2.4, 2, '#7a5050');
  mouth(0, -95, 16, P.mouth);
}},
{ id: 'horse', name: 'Horse', word: 'NEIGH!', exit: 'hop', col: '#c07f45', draw(P) {
  const h = '#c07f45', m = '#5b3a22', mz = '#efcfa9';
  c.save(); c.translate(38, -48); c.rotate(-0.5 + P.tail * 0.4); path(m, 0, 10, 16, () => { c.moveTo(-4, 0); c.bezierCurveTo(22, -6, 26, 30, 14, 44); c.bezierCurveTo(8, 30, 2, 18, -4, 8); }); c.restore();
  chibiBody(h, mz, P, '#6b4a3a');
  for (const s of [-1, 1]) { c.save(); c.translate(s * 26, -184); c.rotate(s * (0.25 + P.ear * 0.25)); path(h, 0, -8, 18, () => { c.moveTo(-9, 8); c.quadraticCurveTo(-6, -22, s * 2, -28); c.quadraticCurveTo(10, -18, 9, 8); }); flat(s * 1, -6, 3.5, 10, '#f2b6a0'); c.restore(); }
  headBase(h, 0, -136, 50, 54);
  blob(0, -98, 38, 28, mz);
  // mane forelock
  c.save(); c.translate(0, -182); c.rotate(P.ear * 0.08); for (const [x, a] of [[-14, -0.5], [0, 0], [14, 0.5]]) blob(x, 6, 10, 18, m, a); c.restore();
  eyes(22, -142, 16, P, '#4a2a18');
  gloss(-14, -108, 12, 6, 0.6, 0);
  flat(-14, -104, 4, 6, '#7a4a3a'); flat(14, -104, 4, 6, '#7a4a3a');
  mouth(0, -88, 24, P.mouth);
  blush(42, -118, 10, 0.35);
}},
{ id: 'duck', name: 'Duck', word: 'QUACK!', exit: 'fly', col: '#ffd93b', draw(P) {
  const y = '#ffd93b', o = '#ff9a2e';
  feet(20, o, P, 16);
  blob(0, -52, 48, 40, y);
  for (const s of [-1, 1]) { c.save(); c.translate(s * 40, -60); c.rotate(s * (0.5 + P.wing * 0.9)); blob(s * 8, 4, 14, 24, '#ffcb1f', s * 0.3); c.restore(); }
  headBase(y, 0, -126, 54, 50);
  c.save(); c.translate(2, -176); c.rotate(P.ear * 0.2); for (const a of [-0.5, 0, 0.5]) { blob(Math.sin(a) * 10, -Math.cos(a) * 8, 6, 12, y, a); } c.restore();
  eyes(22, -138, 16, P, '#2d5fa8');
  blush(36, -112, 11);
  // flat duck bill
  const op = P.mouth;
  if (op > 0.05) { ell(0, -103 + op * 5, 24, 5 + op * 9); c.fillStyle = '#6b1b2e'; c.fill(); ell(0, -99 + op * 9, 14, 3 + op * 4); c.fillStyle = '#ff7a8f'; c.fill(); }
  blob(0, -97 + op * 14, 26, 8, shade(o, -0.06));
  blob(0, -109, 32, 12, o);
  gloss(-10, -113, 10, 4, 0.7, 0);
  flat(-7, -112, 2.2, 1.6, 'rgba(120,50,0,.6)'); flat(7, -112, 2.2, 1.6, 'rgba(120,50,0,.6)');
}},
{ id: 'chicken', name: 'Chicken', word: 'CLUCK!', exit: 'hop', col: '#e8a056', draw(P) {
  const f = '#e8a056', clem = '#fff3d6', r = '#e23b3b', y = '#ffb020', tcol = '#d46a2c';
  c.save(); c.translate(28, -58); c.rotate(P.tail * 0.15);
  [['#c45a28', 0.15], ['#e07a30', 0.45], ['#f0b04a', 0.75]].forEach(([col, a]) => { c.save(); c.rotate(a); path(col, 10, -10, 16, () => { c.moveTo(0, 0); c.bezierCurveTo(8, -22, 24, -26, 28, -16); c.bezierCurveTo(20, -12, 10, -2, 4, 8); }); c.restore(); });
  c.restore();
  feet(16, y, P, 13);
  blob(0, -52, 46, 40, f);
  ell(0, -46, 28, 24); c.fillStyle = clem; c.fill();
  for (const s of [-1, 1]) { c.save(); c.translate(s * 36, -60); c.rotate(s * (0.4 + P.wing * 0.9)); blob(s * 6, 6, 13, 22, '#d4893a', s * 0.3); c.restore(); }
  headBase(clem, 0, -124, 48, 46);
  c.save(); c.translate(0, -168); c.rotate(P.ear * 0.1); blob(-8, 2, 8, 9, r); blob(2, -4, 10, 11, r); blob(12, 2, 8, 9, r); c.restore();
  eyes(20, -134, 15, P, '#c25a12');
  blush(34, -112, 10);
  beak(0, -110, 20, 13, P.mouth, y);
  c.save(); c.translate(0, -94 + P.mouth * 8); blob(-3, 5, 6, 10, r); blob(5, 4, 5, 8, r); c.restore();
}},
{ id: 'chick', name: 'Chick', word: 'CHEEP!', exit: 'hop', col: '#ffe566', scale: 0.78, draw(P) {
  const y = '#ffe566', o = '#ff9a2e';
  feet(12, o, P, 10);
  blob(0, -40, 36, 32, y);
  for (const s of [-1, 1]) { c.save(); c.translate(s * 28, -46); c.rotate(s * (0.5 + P.wing * 1.1)); blob(s * 4, 4, 9, 16, '#ffe14a', s * 0.3); c.restore(); }
  headBase(y, 0, -100, 46, 44);
  c.save(); c.translate(0, -140); c.rotate(P.ear * 0.25); blob(0, -2, 6, 12, y); blob(-6, 2, 5, 9, y, -0.4); blob(6, 2, 5, 9, y, 0.4); c.restore();
  eyes(18, -108, 15, P, '#5a3a12');
  blush(30, -90, 10, 0.55);
  beak(0, -90, 16, 10, P.mouth, o);
}},
{ id: 'goat', name: 'Goat', word: 'MAA!', exit: 'hop', col: '#f0e6d2', draw(P) {
  const f = '#f0e6d2', h = '#c4a07a', mz = '#fff6ea', pink = '#ffc2cc';
  c.save(); c.translate(36, -44); c.rotate(-0.3 + P.tail * 0.5); blob(10, 4, 7, 12, f); c.restore();
  chibiBody(f, mz, P, h, { fw: 15 });
  flat(18, -58, 12, 9, h, 0.2);
  // horns (behind head)
  for (const s of [-1, 1]) { path('#e8d5a8', s * 20, -186, 14, () => { c.moveTo(s * 16, -168); c.quadraticCurveTo(s * 8, -200, s * 22, -210); c.quadraticCurveTo(s * 30, -200, s * 24, -170); }); }
  // floppy ears
  for (const s of [-1, 1]) { c.save(); c.translate(s * 48, -148); c.rotate(s * (0.55 + P.ear * 0.3)); blob(s * 14, 0, 20, 10, f); flat(s * 14, 0, 12, 5, pink); c.restore(); }
  headBase(f, 0, -128, 52, 50);
  eyes(20, -140, 15, P, '#5a3a20');
  brows(20, -160, 14, P, '#8a6a40');
  blob(0, -102, 32, 22, mz);
  // beard
  c.save(); c.translate(0, -86); c.rotate(Math.sin(P.t * 3) * 0.05); path(f, 0, 10, 12, () => { c.moveTo(-8, 0); c.quadraticCurveTo(0, 22, 0, 26); c.quadraticCurveTo(0, 22, 8, 0); }); c.restore();
  blush(38, -114, 10, 0.4);
  path('#e09aaa', 0, -112, 8, () => { c.moveTo(-8, -116); c.quadraticCurveTo(0, -122, 8, -116); c.quadraticCurveTo(6, -104, 0, -104); c.quadraticCurveTo(-6, -104, -8, -116); });
  gloss(-3, -116, 3, 2, 0.8, 0);
  mouth(0, -94, 20, P.mouth);
}},
{ id: 'dog', name: 'Dog', word: 'WOOF!', exit: 'hop', col: '#e0a86a', draw(P) {
  const fur = '#e0a86a', dark = '#8b5a3c', cream = '#fff0db';
  // tail
  c.save(); c.translate(36, -48); c.rotate(-0.9 + P.tail * 0.6); path(fur, 0, -14, 14, () => { c.moveTo(-6, 0); c.quadraticCurveTo(-10, -26, 4, -36); c.quadraticCurveTo(12, -30, 7, -2); }); c.restore();
  chibiBody(fur, cream, P, dark);
  headBase(fur, 0, -128, 60, 54);
  // floppy ears
  for (const s of [-1, 1]) { c.save(); c.translate(s * 46, -160); c.rotate(s * (0.25 + P.ear * 0.18)); path(dark, s * 6, 30, 30, () => { c.moveTo(-10 * s, -6); c.bezierCurveTo(s * 30, -14, s * 34, 40, s * 14, 56); c.bezierCurveTo(s * 0, 62, -s * 14, 40, -10 * s, -6); }); c.restore(); }
  flat(-22, -152, 14, 10, 'rgba(139,90,60,.5)'); // patch
  eyes(22, -134, 17, P, '#5a3420');
  brows(22, -158, 16, P);
  blob(0, -104, 30, 22, cream, 0);
  blush(40, -112, 12);
  // nose
  path('#3b2a2a', 0, -114, 10, () => { c.moveTo(-10, -118); c.quadraticCurveTo(0, -126, 10, -118); c.quadraticCurveTo(8, -108, 0, -106); c.quadraticCurveTo(-8, -108, -10, -118); });
  gloss(-3, -118, 4, 2.5, 0.8, 0);
  mouth(0, -101, 24, P.mouth, '#ff6f8a');
  if (P.mouth < 0.08) { flat(5, -95, 5, 6, '#ff6f8a'); }
}},
{ id: 'cat', name: 'Cat', word: 'MEOW!', exit: 'hop', col: '#f6a64e', draw(P) {
  const fur = '#f6a64e', st = '#d9782b', pink = '#ffb3c1', cream = '#fff3e3';
  c.save(); c.translate(34, -30); c.rotate(P.tail * 0.3); c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(40, 0, 44, -50, 26, -70); c.lineWidth = 15; c.strokeStyle = shade(fur, -0.58); c.lineCap = 'round'; c.stroke(); c.lineWidth = 9.5; c.strokeStyle = fur; c.stroke(); c.restore();
  chibiBody(fur, cream, P, cream);
  for (const s of [-1, 1]) { c.save(); c.translate(s * 36, -170); c.rotate(s * (0.15 + P.ear * 0.12)); path(fur, 0, -10, 24, () => poly([-18, 14, s * 4, -32, 20, 14])); path(pink, 0, -2, 12, () => poly([-9, 10, s * 3, -18, 11, 10]), true); c.restore(); }
  headBase(fur, 0, -126, 62, 52);
  for (const x of [-12, 0, 12]) { c.beginPath(); c.moveTo(x, -177); c.lineTo(x * 0.6, -160); c.lineWidth = 4; c.strokeStyle = st; c.stroke(); }
  eyes(24, -132, 18, P, '#3fae5a');
  blob(0, -103, 26, 17, cream, 0, true);
  blush(42, -110, 12);
  path(pink, 0, -112, 6, () => { c.moveTo(-6, -114); c.lineTo(6, -114); c.lineTo(0, -107); });
  whiskers(26, -106, 30);
  if (P.mouth < 0.08) { c.beginPath(); c.moveTo(-10, -100); c.quadraticCurveTo(-5, -94, 0, -101); c.quadraticCurveTo(5, -94, 10, -100); c.lineWidth = LW; c.strokeStyle = '#3a2430'; c.stroke(); }
  else mouth(0, -101, 20, P.mouth);
}},
{ id: 'donkey', name: 'Donkey', word: 'HEE-HAW!', exit: 'hop', col: '#a3a9b3', draw(P) {
  const g = '#a3a9b3', mz = '#ece7e2', m = '#4b4b58', pink = '#ffc2cc';
  c.save(); c.translate(38, -40); c.rotate(-0.4 + P.tail * 0.5); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(20, -8, 22, -36); c.lineWidth = 6; c.strokeStyle = shade(g, -0.58); c.stroke(); blob(22, -40, 6, 9, m); c.restore();
  chibiBody(g, mz, P, m);
  // very tall ears
  for (const s of [-1, 1]) { c.save(); c.translate(s * 22, -168); c.rotate(s * (0.22 + P.ear * 0.3) + (P.mouth || 0) * s * 0.2); path(g, 0, -30, 30, () => { c.moveTo(-10, 6); c.bezierCurveTo(-16, -40, -4, -66, 0, -68); c.bezierCurveTo(6, -66, 16, -40, 10, 6); }); path(pink, 0, -28, 14, () => { c.moveTo(-5, 0); c.bezierCurveTo(-8, -34, -2, -54, 0, -56); c.bezierCurveTo(2, -54, 8, -34, 5, 0); }, true); c.restore(); }
  headBase(g, 0, -136, 48, 50);
  c.save(); c.translate(0, -178); for (const [x, a] of [[-8, -0.4], [4, 0.1], [12, 0.6]]) blob(x, 4, 7, 13, m, a); c.restore();
  eyes(20, -144, 15, P, '#4a2a18');
  blob(0, -100, 36, 28, mz);
  gloss(-12, -110, 11, 6, 0.6, 0);
  flat(-13, -106, 4, 6, '#6b6470'); flat(13, -106, 4, 6, '#6b6470');
  mouth(0, -90, 24, P.mouth);
  if (P.mouth < 0.08) { c.fillStyle = '#fff'; c.fillRect(-6, -88, 5, 6); c.fillRect(1, -88, 5, 6); }
  blush(40, -118, 9, 0.4);
}},
{ id: 'rabbit', name: 'Rabbit', word: 'BOING!', exit: 'hop', col: '#f3d7b5', draw(P) {
  const f = '#f3d7b5', cream = '#fff6ea', pink = '#ffb6c4';
  // cotton tail
  c.save(); c.translate(36, -44); c.rotate(P.tail * 0.3); blob(0, 0, 14, 14, '#fff'); gloss(-4, -4, 5, 4, 0.7, 0); c.restore();
  chibiBody(f, cream, P, cream, { fw: 20, fdx: 20 });
  // long ears (behind / on head)
  for (const s of [-1, 1]) { c.save(); c.translate(s * 18, -168); c.rotate(s * (0.18 + P.ear * 0.35)); path(f, 0, -36, 36, () => { c.moveTo(-11, 6); c.bezierCurveTo(-16, -40, -6, -78, 0, -82); c.bezierCurveTo(6, -78, 16, -40, 11, 6); }); path(pink, 0, -32, 18, () => { c.moveTo(-5, 2); c.bezierCurveTo(-8, -36, -3, -66, 0, -70); c.bezierCurveTo(3, -66, 8, -36, 5, 2); }, true); c.restore(); }
  headBase(f, 0, -126, 58, 52);
  eyes(22, -134, 16, P, '#7a4a28');
  blob(0, -104, 28, 20, cream, 0, true);
  blush(40, -112, 12, 0.55);
  path(pink, 0, -112, 6, () => { c.moveTo(-6, -114); c.lineTo(6, -114); c.lineTo(0, -107); });
  whiskers(24, -106, 28);
  if (P.mouth < 0.08) { c.beginPath(); c.moveTo(-10, -100); c.quadraticCurveTo(-5, -94, 0, -101); c.quadraticCurveTo(5, -94, 10, -100); c.lineWidth = LW; c.strokeStyle = '#3a2430'; c.stroke(); }
  else mouth(0, -101, 20, P.mouth);
}}

];
const ANIMAL_BY_ID = {}; ANIMALS.forEach(a => ANIMAL_BY_ID[a.id] = a);
