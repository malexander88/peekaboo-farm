/* ================= audio ================= */
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let actx = null, master = null, audioReady = false, musicGain = null, musicSrc = null;
const buffers = {}, envelopes = {};
const GAIN = { pig: 1.7, chick: 1.15, rabbit: 1.1, goat: 1.2, chicken: 1.15 };
function b64ToArrayBuffer(b64) { const bin = atob(b64), n = bin.length, u = new Uint8Array(n); for (let i = 0; i < n; i++) u[i] = bin.charCodeAt(i); return u.buffer; }
function makeEnvelope(buf) {
  const d = buf.getChannelData(0), sr = buf.sampleRate, hop = Math.round(sr / 40), out = [];
  let mx = 1e-6;
  for (let i = 0; i < d.length; i += hop) { let s = 0; const e = Math.min(d.length, i + hop); for (let j = i; j < e; j++) s += d[j] * d[j]; const v = Math.sqrt(s / (e - i)); out.push(v); if (v > mx) mx = v; }
  return out.map(v => Math.min(1, Math.pow(v / mx, 0.7)));
}
function initAudio() {
  if (actx) return;
  try { actx = new AudioCtx(); } catch (e) { return; }
  master = actx.createGain(); master.gain.value = 0.9;
  const comp = actx.createDynamicsCompressor(); comp.threshold.value = -10; comp.ratio.value = 4;
  master.connect(comp); comp.connect(actx.destination);
  const S = window.__SND || {};
  for (const id in S) {
    const p = actx.decodeAudioData(b64ToArrayBuffer(S[id]), buf => { buffers[id] = buf; envelopes[id] = makeEnvelope(buf); }, err => console.warn('decode failed', id, err));
    if (p && p.catch) p.catch(() => {});
  }
  if (window.__MUSIC) {
    const p = actx.decodeAudioData(b64ToArrayBuffer(window.__MUSIC), buf => { buffers.__music = buf; }, err => console.warn('music decode failed', err));
    if (p && p.catch) p.catch(() => {});
  }
  audioReady = true;
}
function startMusic() {
  if (!actx || musicSrc || !buffers.__music) return;
  musicGain = actx.createGain(); musicGain.gain.value = 0;
  musicGain.connect(master);
  const src = actx.createBufferSource(); src.buffer = buffers.__music; src.loop = true;
  src.connect(musicGain); src.start();
  musicGain.gain.linearRampToValueAtTime(0.16, actx.currentTime + 1.6);
  musicSrc = src;
}
function unlockAudio() {
  initAudio();
  if (actx && actx.state !== 'running') actx.resume().catch(() => {});
  if (actx && buffers.__music) startMusic();
  else if (actx) { const tries = setInterval(() => { if (buffers.__music) { startMusic(); clearInterval(tries); } }, 120); setTimeout(() => clearInterval(tries), 4000); }
}
function playAnimal(id) {
  const buf = buffers[id]; if (!actx || !buf) return null;
  const src = actx.createBufferSource(); src.buffer = buf;
  const rate = 1 + (Math.random() * 0.06 - 0.02); src.playbackRate.value = rate;
  const g = actx.createGain(); g.gain.value = GAIN[id] || 1;
  src.connect(g); g.connect(master); src.start();
  return { dur: buf.duration / rate, env: envelopes[id], rate };
}
function sfx(type) {
  if (!actx || actx.state !== 'running') return;
  const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
  o.connect(g); g.connect(master);
  if (type === 'boing') { o.type = 'sine'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(520, t + 0.12); o.frequency.exponentialRampToValueAtTime(330, t + 0.25); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3); o.start(t); o.stop(t + 0.32); }
  else if (type === 'pop') { o.type = 'triangle'; o.frequency.setValueAtTime(700, t); o.frequency.exponentialRampToValueAtTime(1400, t + 0.06); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.1, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12); o.start(t); o.stop(t + 0.14); }
  else if (type === 'chime') { o.type = 'sine'; o.frequency.setValueAtTime(1320, t); o.frequency.setValueAtTime(1760, t + 0.07); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35); o.start(t); o.stop(t + 0.36); }
  else if (type === 'rustle') {
    o.disconnect();
    const n = actx.createBufferSource(), len = actx.sampleRate * 0.28, b = actx.createBuffer(1, len, actx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / len);
    const f = actx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.4; f.frequency.setValueAtTime(1800, t); f.frequency.exponentialRampToValueAtTime(900, t + 0.25);
    n.buffer = b; n.connect(f); f.connect(g); g.gain.value = 0.1; n.start(t);
  }
  else if (type === 'flutter') {
    o.disconnect();
    const n = actx.createBufferSource(), len = actx.sampleRate * 0.7, b = actx.createBuffer(1, len, actx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (0.4 + 0.6 * Math.abs(Math.sin(i / actx.sampleRate * 28)));
    const f = actx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2.5; f.frequency.setValueAtTime(2000, t); f.frequency.exponentialRampToValueAtTime(3200, t + 0.3);
    n.buffer = b; n.connect(f); f.connect(g); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7); n.start(t);
  }
  else if (type === 'boo') {
    o.type = 'sine'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(160, t + 0.18); o.frequency.exponentialRampToValueAtTime(280, t + 0.32);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.start(t); o.stop(t + 0.52);
  }
  else if (type === 'giggle') {
    // cartoon hee-hee-hee (not a recorded voice)
    const notes = [880, 1040, 980, 1240, 1100, 1400];
    notes.forEach((f, i) => {
      const o2 = actx.createOscillator(), g2 = actx.createGain();
      o2.type = 'triangle'; o2.frequency.value = f;
      o2.connect(g2); g2.connect(master);
      const t0 = t + i * 0.09;
      g2.gain.setValueAtTime(0.0001, t0); g2.gain.exponentialRampToValueAtTime(0.09, t0 + 0.02); g2.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);
      o2.start(t0); o2.stop(t0 + 0.13);
    });
    // o unused
  }
  else if (type === 'whoosh') {
    o.disconnect(); const n = actx.createBufferSource(), len = actx.sampleRate * 0.35, b = actx.createBuffer(1, len, actx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / len);
    const f = actx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2; f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(2400, t + 0.3);
    n.buffer = b; n.connect(f); f.connect(g); g.gain.value = 0.12; n.start(t);
  }
}
