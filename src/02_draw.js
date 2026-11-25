'use strict';
/* ================= drawing helpers (animal-local units: ~200 tall, feet at y=0) ================= */
const TAU = Math.PI * 2;
let c = null;              // current 2D context (set by renderer)
const LW = 3.4;            // outline width in animal units
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeIn = t => t * t * t;
const easeOutBack = t => { const k = 1.70158; t -= 1; return t * t * ((k + 1) * t + k) + 1; };

const _shadeCache = {};
function hexRgb(h) { if (h[0] === 'r') return h.match(/[\d.]+/g).slice(0, 3).map(Number); h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(x => x + x).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function shade(hex, amt) {
  const k = hex + amt; if (_shadeCache[k]) return _shadeCache[k];
  const [r, g, b] = hexRgb(hex); const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
  const f = v => Math.round(v + (t - v) * p);
  return (_shadeCache[k] = 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')');
}
function ell(x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot || 0, 0, TAU); }
function grad(col, x, y, r) {
  const g = c.createRadialGradient(x - r * 0.38, y - r * 0.5, r * 0.08, x, y, r * 1.2);
  g.addColorStop(0, shade(col, 0.42)); g.addColorStop(0.5, col); g.addColorStop(1, shade(col, -0.22));
  return g;
}
function line(col, w) { c.lineWidth = w || LW; c.strokeStyle = shade(col, -0.58); c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
function paint(col, x, y, r, noLine) { c.fillStyle = grad(col, x, y, r); c.fill(); if (!noLine) line(col); }
function blob(x, y, rx, ry, col, rot, noLine) { ell(x, y, rx, ry, rot); paint(col, x, y, Math.max(rx, ry), noLine); }
function flat(x, y, rx, ry, col, rot) { ell(x, y, rx, ry, rot); c.fillStyle = col; c.fill(); }
function gloss(x, y, rx, ry, a, rot) {
  c.save(); c.translate(x, y); c.rotate(rot || -0.5); c.scale(rx, ry);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, 1);
  g.addColorStop(0, 'rgba(255,255,255,' + (a || 0.55) + ')'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, TAU); c.fill(); c.restore();
}
function path(col, x, y, r, fn, noLine) { c.beginPath(); fn(); c.closePath(); paint(col, x, y, r, noLine); }
function poly(pts) { c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); }

/* big glossy cartoon eye. P = pose (blink, squeeze, pop, look) */
function eye(x, y, r, P, iris, side) {
  const open = P.blink, pop = 1 + (P.pop || 0) * 0.25;
  r *= pop;
  if (P.squeeze) {                       // > <  squeezed shut
    c.beginPath(); const s = -(side || 1);
    c.moveTo(x - r * 0.6 * s, y - r * 0.55); c.lineTo(x + r * 0.5 * s, y); c.lineTo(x - r * 0.6 * s, y + r * 0.55);
    c.lineWidth = LW * 1.5; c.strokeStyle = '#3a2430'; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(); return;
  }
  if (open < 0.2) {                      // happy closed eye arc
    c.beginPath(); c.arc(x, y + r * 0.15, r * 0.72, Math.PI * 1.12, Math.PI * 1.88);
    c.lineWidth = LW * 1.4; c.strokeStyle = '#3a2430'; c.lineCap = 'round'; c.stroke(); return;
  }
  const ry = r * open, rx = r * 0.84;
  c.save();
  ell(x, y, rx, ry); c.fillStyle = '#fff'; c.fill();
  c.clip();
  const lx = (P.lookX || 0) * r * 0.18, ly = (P.lookY || 0) * r * 0.14;
  const ix = x + lx, iy = y + ly + r * 0.08, ir = r * 0.66;
  const g = c.createLinearGradient(ix, iy - ir, ix, iy + ir);
  g.addColorStop(0, shade(iris || '#4a2c1a', -0.45)); g.addColorStop(0.55, iris || '#4a2c1a'); g.addColorStop(1, shade(iris || '#4a2c1a', 0.45));
  ell(ix, iy, ir * 0.9, ir); c.fillStyle = g; c.fill();
  ell(ix, iy + ir * 0.05, ir * 0.52, ir * 0.6); c.fillStyle = '#140c14'; c.fill();
  // highlights
  ell(ix + ir * 0.32, iy - ir * 0.42, ir * 0.34, ir * 0.3); c.fillStyle = '#fff'; c.fill();
  ell(ix - ir * 0.38, iy + ir * 0.42, ir * 0.14, ir * 0.13); c.fillStyle = 'rgba(255,255,255,.9)'; c.fill();
  // soft top shadow (lid)
  const sg = c.createLinearGradient(x, y - ry, x, y - ry * 0.3);
  sg.addColorStop(0, 'rgba(60,30,60,.28)'); sg.addColorStop(1, 'rgba(60,30,60,0)');
  c.fillStyle = sg; c.fillRect(x - rx, y - ry, rx * 2, ry);
  c.restore();
  ell(x, y, rx, ry); c.lineWidth = LW * 0.9; c.strokeStyle = '#3a2430'; c.stroke();
  // lashes
  if (side) {
    c.beginPath(); const s = side;
    c.moveTo(x + rx * 0.72 * s, y - ry * 0.7); c.quadraticCurveTo(x + rx * 1.05 * s, y - ry * 0.95, x + rx * 1.22 * s, y - ry * 0.98);
    c.lineWidth = LW * 0.9; c.strokeStyle = '#3a2430'; c.stroke();
  }
}
function eyes(dx, y, r, P, iris) { eye(-dx, y, r, P, iris, -1); eye(dx, y, r, P, iris, 1); }
function brows(dx, y, w, P, col) {
  const up = (P.pop || 0) * 6 + (P.mouth || 0) * 3;
  c.lineWidth = LW * 1.1; c.strokeStyle = col || '#3a2430'; c.lineCap = 'round';
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * (dx - w / 2), y - up + 2); c.quadraticCurveTo(s * dx, y - up - 4, s * (dx + w / 2), y - up + 1); c.stroke(); }
}
function blush(dx, y, r, a) { for (const s of [-1, 1]) { c.save(); c.translate(s * dx, y); c.scale(1, 0.62); const g = c.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, 'rgba(255,105,140,' + (a || 0.5) + ')'); g.addColorStop(1, 'rgba(255,105,140,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.restore(); } }
/* cartoon mouth: closed smile or open with tongue */
function mouth(x, y, w, open, tongue) {
  if (open < 0.08) {
    c.beginPath(); c.moveTo(x - w / 2, y); c.quadraticCurveTo(x, y + w * 0.42, x + w / 2, y);
    c.lineWidth = LW * 1.05; c.strokeStyle = '#3a2430'; c.lineCap = 'round'; c.stroke(); return;
  }
  const d = w * (0.25 + open * 0.95);
  c.save(); c.beginPath(); c.moveTo(x - w / 2, y); c.quadraticCurveTo(x, y + w * 0.12, x + w / 2, y);
  c.bezierCurveTo(x + w * 0.48, y + d * 0.9, x - w * 0.48, y + d * 0.9, x - w / 2, y); c.closePath();
  c.fillStyle = '#6b1b2e'; c.fill(); c.clip();
  ell(x, y + d * 0.78, w * 0.34, d * 0.4); c.fillStyle = tongue || '#ff7a8f'; c.fill();
  c.fillStyle = '#fff'; c.fillRect(x - w * 0.3, y - 2, w * 0.6, w * 0.1);
  c.restore();
  c.beginPath(); c.moveTo(x - w / 2, y); c.quadraticCurveTo(x, y + w * 0.12, x + w / 2, y);
  c.bezierCurveTo(x + w * 0.48, y + d * 0.9, x - w * 0.48, y + d * 0.9, x - w / 2, y); c.closePath();
  c.lineWidth = LW; c.strokeStyle = '#3a2430'; c.lineJoin = 'round'; c.stroke();
}
/* two-part beak, lower jaw drops with open */
function beak(x, y, w, h, open, col, long) {
  const o = open * h * 0.9;
  path(col, x, y, w, () => { c.moveTo(x - w / 2, y); c.quadraticCurveTo(x - w * 0.1, y + o + h * 0.95, x, y + o + h * (long ? 1.25 : 0.85)); c.quadraticCurveTo(x + w * 0.1, y + o + h * 0.95, x + w / 2, y); c.quadraticCurveTo(x, y + o * 0.6 + h * 0.2, x - w / 2, y); });
  if (open > 0.05) { ell(x, y + o * 0.55 + h * 0.12, w * 0.32, o * 0.45 + 1); c.fillStyle = '#6b1b2e'; c.fill(); }
  path(col, x, y - h * 0.3, w, () => { c.moveTo(x - w / 2, y); c.quadraticCurveTo(x - w * 0.42, y - h * 0.6, x, y - h * 0.62); c.quadraticCurveTo(x + w * 0.42, y - h * 0.6, x + w / 2, y); c.quadraticCurveTo(x + w * 0.1, y + h * (long ? 0.95 : 0.6), x, y + h * (long ? 1.05 : 0.68)); c.quadraticCurveTo(x - w * 0.1, y + h * (long ? 0.95 : 0.6), x - w / 2, y); });
  gloss(x - w * 0.15, y - h * 0.25, w * 0.18, h * 0.12, 0.6, 0);
}
function whiskers(x, y, len, col) {
  c.lineWidth = 1.6; c.strokeStyle = col || 'rgba(60,40,50,.55)'; c.lineCap = 'round';
  for (const s of [-1, 1]) for (const a of [-0.18, 0.05, 0.28]) {
    c.beginPath(); c.moveTo(x * s, y); c.quadraticCurveTo(s * (x + len * 0.5), y + a * len * 0.5 - 3, s * (x + len), y + a * len); c.stroke();
  }
}
function feet(dx, col, P, w) { w = w || 17; for (const s of [-1, 1]) blob(s * dx, -7 + (P.step ? Math.max(0, Math.sin(P.step + (s > 0 ? Math.PI : 0))) * -7 : 0), w, 9, col); }
function arms(dx, y, col, P, len) {
  len = len || 20; const wave = P.armUp || 0;
  for (const s of [-1, 1]) { c.save(); c.translate(s * dx, y); c.rotate(s * (0.35 + wave * 1.5 + Math.sin(P.t * 3 + s) * 0.05)); blob(0, len * 0.55, 10, len * 0.62, col); c.restore(); }
}
function heart(x, y, s) { c.beginPath(); c.moveTo(x, y + s * 0.35); c.bezierCurveTo(x - s * 1.1, y - s * 0.4, x - s * 0.45, y - s * 1.05, x, y - s * 0.45); c.bezierCurveTo(x + s * 0.45, y - s * 1.05, x + s * 1.1, y - s * 0.4, x, y + s * 0.35); c.closePath(); }
function star5(x, y, r1, r2, rot) { c.beginPath(); for (let i = 0; i < 10; i++) { const a = rot + i * Math.PI / 5 - Math.PI / 2, r = i % 2 ? r2 : r1; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); }
