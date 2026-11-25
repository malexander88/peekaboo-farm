#!/usr/bin/env python3
import numpy as np, subprocess, os, struct, wave, tempfile
SR = 44100
ROOT = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(ROOT, 'raw')
CLIPS = os.path.join(ROOT, 'clips')
os.makedirs(CLIPS, exist_ok=True)

def load(path, sr=SR, offset=0, duration=None):
    cmd = ['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(sr)]
    if offset: cmd += ['-ss', str(offset)]
    if duration: cmd += ['-t', str(duration)]
    cmd += ['-f', 'f32le', 'pipe:1']
    raw = subprocess.check_output(cmd)
    return np.frombuffer(raw, dtype=np.float32).copy()

def hp(y, f=90, sr=SR):
    # biquad highpass (RBJ), 2nd order
    w0 = 2 * np.pi * f / sr
    cosw, sinw = np.cos(w0), np.sin(w0)
    a = sinw / (2 * 0.707)
    b0, b1, b2 = (1 + cosw) / 2, -(1 + cosw), (1 + cosw) / 2
    a0, a1, a2 = 1 + a, -2 * cosw, 1 - a
    b0, b1, b2, a1, a2 = b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0
    out = np.zeros_like(y)
    x1 = x2 = y1 = y2 = 0.0
    for i, x in enumerate(y):
        yn = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
        out[i] = yn
        x2, x1, y2, y1 = x1, x, y1, yn
    return out

def trim(y, th_db=-32, pad=0.04):
    fr = 512
    e = np.array([np.sqrt(np.mean(y[i:i + fr] ** 2) + 1e-12) for i in range(0, len(y), fr)])
    db = 20 * np.log10(e / (e.max() + 1e-12))
    idx = np.where(db > th_db)[0]
    if len(idx) == 0:
        return y
    a = max(0, idx[0] * fr - int(pad * SR))
    b = min(len(y), (idx[-1] + 1) * fr + int(pad * SR))
    return y[a:b]

def pitch(y, pf):
    if abs(pf - 1) < 1e-3:
        return y
    # play faster + higher via resample
    n = int(len(y) / pf)
    x = np.linspace(0, len(y) - 1, n)
    return np.interp(x, np.arange(len(y)), y).astype(np.float32)

def fade(y, fi=0.01, fo=0.12):
    y = y.copy()
    a, b = int(fi * SR), int(fo * SR)
    if a > 0:
        y[:a] *= np.linspace(0, 1, a)
    if b > 0:
        y[-b:] *= np.linspace(1, 0, b)
    return y

def norm(y):
    p999 = np.percentile(np.abs(y), 99.9) or 1
    y = y / p999 * 0.8
    y = np.tanh(y * 1.3) / np.tanh(1.3) * 0.95
    rms = np.sqrt(np.mean(y ** 2))
    y *= min(1.0, 0.17 / (rms + 1e-9))
    return np.clip(y, -0.97, 0.97)

def write_mp3(name, y):
    wav = os.path.join(CLIPS, name + '.wav')
    # 16-bit wav
    s = np.clip(y * 32767, -32767, 32767).astype(np.int16)
    with wave.open(wav, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(s.tobytes())
    mp3 = os.path.join(CLIPS, name + '.mp3')
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', wav, '-ac', '1', '-ar', '44100', '-b:a', '80k', mp3], check=True)
    print(f'{name:9s} {len(y)/SR:.2f}s rms={np.sqrt(np.mean(y**2)):.3f} peak={np.abs(y).max():.2f} mp3={os.path.getsize(mp3)//1024}KB')

def piece(fname, start, dur):
    return load(os.path.join(RAW, fname), offset=start, duration=dur)

# name -> (list of (file, start, dur), pitch)
SEL = {
    'chick':    ([('bsb_0430.mp3', 3.0, 2.3)], 1.10),
    'goat':     ([('bsb_0279.mp3', 0.12, 0.95), ('bsb_0280.mp3', 0.12, 0.85)], 1.06),
    'chicken':  ([('bsb_0978.mp3', 2.15, 0.85), ('bsb_0978.mp3', 13.30, 0.80), ('bsb_0978.mp3', 18.95, 0.85)], 1.06),
}

def process_sel():
    for name, (pieces, pf) in SEL.items():
        parts = []
        for f, s, d in pieces:
            y = trim(hp(piece(f, s, d)))
            parts.append(y)
            parts.append(np.zeros(int(0.07 * SR), dtype=np.float32))
        y = np.concatenate(parts[:-1])
        y = pitch(y, pf)
        y = y[:int(2.6 * SR)]
        y = fade(norm(y))
        write_mp3(name, y)

def env(n, a, r):
    e = np.ones(n, dtype=np.float32)
    fa, fr = int(a * SR), int(r * SR)
    if fa: e[:fa] = np.linspace(0, 1, fa)
    if fr: e[-fr:] = np.linspace(1, 0, min(fr, n))
    return e

def synth_rabbit():
    # soft foot thumps + two cute rising squeaks
    tlen = int(1.35 * SR)
    y = np.zeros(tlen, dtype=np.float32)
    # thumps
    for t0, amp in ((0.02, 0.9), (0.22, 0.7)):
        n = int(0.18 * SR)
        t = np.arange(n) / SR
        freq = 90 * (1 - t * 2.5)
        freq = np.clip(freq, 40, 200)
        th = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t * 18) * amp
        th += 0.35 * np.sin(2 * np.pi * 48 * t) * np.exp(-t * 22) * amp
        a = int(t0 * SR)
        y[a:a + n] += th[:min(n, tlen - a)]
    # squeaks
    for t0, f0, f1, dur, amp in ((0.38, 1400, 1800, 0.16, 0.45), (0.58, 1600, 2100, 0.18, 0.4), (0.82, 1500, 1200, 0.14, 0.28)):
        n = int(dur * SR)
        t = np.arange(n) / SR
        freq = np.linspace(f0, f1, n)
        sig = np.sin(2 * np.pi * np.cumsum(freq) / SR)
        # slight square-ish overtone for cartoon
        sig += 0.2 * np.sin(4 * np.pi * np.cumsum(freq) / SR)
        sig *= np.sin(np.pi * t / dur) ** 1.2 * amp
        a = int(t0 * SR)
        y[a:a + n] += sig[:min(n, tlen - a)]
    y = fade(norm(y), 0.005, 0.08)
    write_mp3('rabbit', y)

def encode_music():
    src = os.path.join(os.path.dirname(ROOT), 'music', 'fluffing-a-duck-kevin-macleod.mp3')
    dst = os.path.join(os.path.dirname(ROOT), 'music', 'fluffing-a-duck-loop.mp3')
    # gentle fade in/out, 80 kbps stereo, keep almost all of the 67s track
    subprocess.run([
        'ffmpeg', '-loglevel', 'error', '-y', '-i', src,
        '-af', 'afade=t=in:st=0:d=0.08,afade=t=out:st=66.6:d=0.7',
        '-ac', '2', '-ar', '44100', '-b:a', '80k', dst
    ], check=True)
    print('music', os.path.getsize(dst) // 1024, 'KB')

if __name__ == '__main__':
    process_sel()
    synth_rabbit()
    encode_music()
