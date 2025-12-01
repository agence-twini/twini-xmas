export interface AudioState {
  audioCtx: AudioContext | null
  musicInterval: number | null
  muted: boolean
  step: number
}

export function createAudioState(): AudioState {
  return {
    audioCtx: null,
    musicInterval: null,
    muted: false,
    step: 0,
  }
}

export function initAudio(audioState: AudioState): void {
  if (!audioState.audioCtx) {
    const AC =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

    if (!AC) return

    audioState.audioCtx = new AC()
  }
}

export function toggleMute(audioState: AudioState): void {
  audioState.muted = !audioState.muted

  const ctx = audioState.audioCtx

  if (!ctx) return

  if (audioState.muted && ctx.state === 'running') {
    ctx.suspend()
  } else if (!audioState.muted && ctx.state === 'suspended') {
    ctx.resume()
  }
}

function playTone(
  audioCtx: AudioContext,
  freq: number,
  duration: number,
  volume: number,
  type: OscillatorType,
): void {
  const now = audioCtx.currentTime
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(freq, now)
  gain.gain.setValueAtTime(volume, now)
  osc.connect(gain)
  gain.connect(audioCtx.destination)
  osc.start(now)
  osc.stop(now + duration)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
}

export function playGiftSound(audioState: AudioState): void {
  if (audioState.muted) return
  if (!audioState.audioCtx) initAudio(audioState)
  if (!audioState.audioCtx) return

  playTone(audioState.audioCtx, 880, 0.1, 0.12, 'triangle')
  playTone(audioState.audioCtx, 1320, 0.05, 0.05, 'square')
}

export function playDeathSweep(audioState: AudioState): void {
  if (audioState.muted) return
  if (!audioState.audioCtx) initAudio(audioState)
  if (!audioState.audioCtx) return

  const ctx = audioState.audioCtx
  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(420, now)
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.6)
  gain.gain.setValueAtTime(0.15, now)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.6)
}

export function playVictoryJingle(audioState: AudioState): void {
  if (audioState.muted) return
  if (!audioState.audioCtx) initAudio(audioState)
  if (!audioState.audioCtx) return

  const ctx = audioState.audioCtx
  const now = ctx.currentTime
  const notes = [523, 659, 784, 1046]

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(freq, now + i * 0.12)
    gain.gain.setValueAtTime(0.12, now + i * 0.12)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.2)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now + i * 0.12)
    osc.stop(now + i * 0.12 + 0.25)
  })
}

interface GameState {
  state: string
  boss: { active: boolean }
  timeLeft: number
}

export function startMusicLoop(audioState: AudioState, gameState: GameState): void {
  stopMusicLoop(audioState)
  initAudio(audioState)

  if (!audioState.audioCtx) return

  const ctx = audioState.audioCtx
  const leadBase = [440, 523, 659, 523, 587, 523, 440, 523]
  const leadPanic = [659, 698, 784, 880]
  const leadBoss = [392, 392, 523, 392, 330, 392]
  const bassBase = [110, 110, 130, 98]
  const bassBoss = [98, 82, 98, 130]

  audioState.step = 0

  audioState.musicInterval = window.setInterval(() => {
    if (gameState.state !== 'play') return
    if (audioState.muted) return
    if (ctx.state === 'suspended') ctx.resume()

    const step = audioState.step++
    let lead = leadBase
    let bass = bassBase
    let leadVol = 0.06

    if (gameState.timeLeft <= 10) {
      lead = leadPanic
      leadVol = 0.09
    }

    if (gameState.boss.active) {
      lead = leadBoss
      bass = bassBoss
      leadVol = 0.1
    }

    const leadIndex = step % lead.length
    const leadFreq = lead[leadIndex] !== undefined ? lead[leadIndex] : 440

    playTone(ctx, leadFreq, 0.12, leadVol, 'square')

    if (step % 2 === 0) {
      const bassIndex = step % bass.length
      const bassFreq = bass[bassIndex] !== undefined ? bass[bassIndex] : 110

      playTone(ctx, bassFreq, 0.18, 0.08, 'sawtooth')
    }

    if (step % 4 === 0) {
      playTone(ctx, 60, 0.05, 0.15, 'square')
    }
  }, 180)
}

export function stopMusicLoop(audioState: AudioState): void {
  if (audioState.musicInterval !== null) {
    clearInterval(audioState.musicInterval)
    audioState.musicInterval = null
  }
}
