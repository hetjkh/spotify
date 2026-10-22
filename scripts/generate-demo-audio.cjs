/* Original, deterministic instrumental demo compositions. No external audio needed. */
const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')
if (spawnSync('ffmpeg', ['-version'], { windowsHide: true }).status !== 0) {
  throw new Error('FFmpeg is required to regenerate the bundled MP3 demos.')
}
const sampleRate = 22050
const duration = 64
const output = path.join(__dirname, '..', 'public', 'audio')
fs.mkdirSync(output, { recursive: true })
const compositions = [
  ['feelings', 90, [57, 53, 60, 55], 0],
  ['nightfall', 105, [50, 58, 53, 60], 1],
  ['weightless', 82, [60, 57, 53, 55], 2],
  ['golden', 86, [55, 60, 57, 53], 0],
  ['neon', 116, [57, 60, 53, 55], 1],
  ['tides', 68, [48, 55, 53, 57], 3],
  ['slow', 76, [53, 57, 60, 55], 2],
  ['moon', 84, [57, 55, 53, 60], 3],
]
const frequency = midi => 440 * 2 ** ((midi - 69) / 12)
const tone = (freq, t) => Math.sin(2 * Math.PI * freq * t)
compositions.forEach(([id, bpm, roots, flavor], trackIndex) => {
  const samples = new Float32Array(sampleRate * duration)
  const beat = 60 / bpm
  const bar = beat * 4
  let seed = trackIndex + 392
  let noiseLow = 0
  let peak = 0
  for (let i = 0; i < samples.length; i++) {
    const t = i / sampleRate
    const chordIndex = Math.floor(t / (bar * 2)) % roots.length
    const root = roots[chordIndex]
    const chordTime = t % (bar * 2)
    const chordEnv = Math.min(chordTime / .35, 1) * Math.min((bar * 2 - chordTime) / .4, 1)
    let value = 0
    for (const interval of [0, 7, 12, 16]) {
      const f = frequency(root + interval)
      value += (tone(f, t) + .22 * tone(f * 1.002, t)) * .045 * chordEnv * (1 + .12 * tone(.19, t))
    }
    const step = beat / 2
    const noteTime = t % step
    const sequence = [12, 19, 16, 24, 19, 16, 7, 19]
    const note = root + sequence[Math.floor(t / step) % sequence.length]
    const env = Math.min(noteTime / .012, 1) * Math.exp(-noteTime * (flavor === 3 ? 4 : 9))
    value += (tone(frequency(note), noteTime) + .22 * tone(frequency(note) * 2, noteTime)) * env * .12
    const bassTime = t % beat
    value += tone(frequency(root - 12), bassTime) * Math.min(bassTime / .015, 1) * Math.exp(-bassTime * 4) * .19
    if (flavor !== 3 && t > bar && t < duration - 4) {
      const kickTime = t % (flavor === 1 ? beat : beat * 2)
      value += Math.sin(2 * Math.PI * (48 * kickTime + 6 * (1 - Math.exp(-kickTime * 30)))) * Math.exp(-kickTime * 20) * .32
      seed = (Math.imul(seed, 1664525) + 1013904223) | 0
      const noise = (seed >>> 0) / 2147483648 - 1
      noiseLow += .1 * (noise - noiseLow)
      const hatTime = t % step
      value += (noise - noiseLow) * Math.exp(-hatTime * 100) * .045
      const snareTime = (t + beat) % (beat * 2)
      value += (noise * .7 + tone(180, snareTime) * .3) * Math.exp(-snareTime * 32) * .11
    }
    value *= Math.min(t / 2, 1) * Math.min((duration - t) / 4, 1)
    samples[i] = value
    peak = Math.max(peak, Math.abs(value))
  }
  const buffer = Buffer.alloc(44 + samples.length * 2)
  buffer.write('RIFF', 0); buffer.writeUInt32LE(buffer.length - 8, 4); buffer.write('WAVEfmt ', 8)
  buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22)
  buffer.writeUInt32LE(sampleRate, 24); buffer.writeUInt32LE(sampleRate * 2, 28)
  buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36); buffer.writeUInt32LE(samples.length * 2, 40)
  for (let i = 0; i < samples.length; i++) buffer.writeInt16LE(Math.round(samples[i] / peak * 26000), 44 + i * 2)
  fs.writeFileSync(path.join(output, `${id}.wav`), buffer)
  const encoded = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', path.join(output, `${id}.wav`), '-codec:a', 'libmp3lame', '-b:a', '96k', path.join(output, `${id}.mp3`)], { windowsHide: true, encoding: 'utf8' })
  if (encoded.status !== 0) throw new Error(encoded.stderr || `Could not encode ${id}`)
  fs.unlinkSync(path.join(output, `${id}.wav`))
  console.log(`${id}: ${duration}s original demo`)
})
