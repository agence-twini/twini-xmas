import { LOGIC_WIDTH, LOGIC_HEIGHT, PLATFORMS } from './constants'
import {
  createPlayer,
  resetPlayer,
  handlePlayerInput,
  updatePlayer,
  drawPlayer,
  playerCollidesWith,
  type Player,
} from './player'
import { createBoss, maybeSpawnBoss, updateBoss, drawBoss, type Boss } from './boss'
import {
  createParticlesState,
  spawnParticles,
  addScorePop,
  updateParticles,
  drawParticles,
  drawScorePops,
  type ParticlesState,
} from './particles'
import { createSnowState, updateSnow, drawSnow, type Snowflake } from './snow'
import {
  createAudioState,
  playGiftSound,
  startMusicLoop,
  stopMusicLoop,
  toggleMute as toggleMuteAudio,
  playDeathSweep,
  playVictoryJingle,
  type AudioState,
} from './audio'
import { rectsOverlap } from './utils'

type GameStateType = 'boot' | 'intro' | 'play' | 'end'

interface Gift {
  x: number
  y: number
  w: number
  h: number
  vy: number
}

interface Gremlin {
  x: number
  y: number
  w: number
  h: number
  vy: number
}

interface LeaderboardEntry {
  score: number
  ts: number
}

interface GameState {
  state: GameStateType
  timeLeft: number
  selectedDuration: number
  score: number
  bestScore: number
  won: boolean
  bossDefeated: boolean
  boss: Boss
  player: Player
  gifts: Gift[]
  gremlins: Gremlin[]
  particles: ParticlesState
  snow: Snowflake[]
  cameraShake: number
  slowMotionTimer: number
  isMobile: boolean
  flags: {
    dead: boolean
  }
  firstBoot: boolean
  bootTimer: number
  anecdotesUnlocked: number
  agencyAnecdotes: string[]
  leaderboard: LeaderboardEntry[]
  audio: AudioState
}

interface GameCallbacks {
  onEnd?: (state: GameState) => void
  onMuteChange?: (muted: boolean) => void
}

interface KeyState {
  [key: string]: boolean
}

interface TouchState {
  left: boolean
  right: boolean
  jump: boolean
}

const BOOT_DURATION_FRAMES = 260

export function createGameEngine(ctx: CanvasRenderingContext2D, callbacks: GameCallbacks = {}) {
  const agencyAnecdotes = [
    'Anecdote 1...',
    'Anecdote 2...',
    'Anecdote 3...',
    'Anecdote 4...',
    'Anecdote 5...',
    'Anecdote 6...',
  ]

  const state: GameState = {
    state: 'intro',
    timeLeft: 45,
    selectedDuration: 45,
    score: 0,
    bestScore: 0,
    won: false,
    bossDefeated: false,
    boss: createBoss(),
    player: createPlayer(),
    gifts: [],
    gremlins: [],
    particles: createParticlesState(),
    snow: createSnowState(),
    cameraShake: 0,
    slowMotionTimer: 0,
    isMobile: false,
    flags: { dead: false },
    firstBoot: true,
    bootTimer: 0,
    anecdotesUnlocked: 0,
    agencyAnecdotes,
    leaderboard: [],
    audio: createAudioState(),
  }

  let timerInterval: number | null = null
  let giftInterval: number | null = null
  let gremlinInterval: number | null = null
  let rafId: number | null = null
  let lastTime = 0

  const keys: KeyState = {}
  const touch: TouchState = { left: false, right: false, jump: false }

  function loadLeaderboard(): void {
    try {
      const raw = localStorage.getItem('santaLeaderboard')
      if (!raw) return

      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        state.leaderboard = parsed
        state.bestScore = parsed.length ? parsed[0].score : 0
      }
    } catch {}
  }

  function saveLeaderboard(): void {
    try {
      localStorage.setItem('santaLeaderboard', JSON.stringify(state.leaderboard))
    } catch {}
  }

  function updateLeaderboard(): void {
    const entry: LeaderboardEntry = { score: state.score, ts: Date.now() }
    state.leaderboard.push(entry)

    state.leaderboard.sort((a, b) => b.score - a.score || a.ts - b.ts)
    if (state.leaderboard.length > 5) {
      state.leaderboard = state.leaderboard.slice(0, 5)
    }

    saveLeaderboard()
  }

  function computeAnecdotes(): void {
    const thresholds = [10, 20, 30, 40, 50, 60]
    let count = 0
    thresholds.forEach((t) => {
      if (state.score >= t) count++
    })
    state.anecdotesUnlocked = count
  }

  function clearIntervals(): void {
    if (timerInterval) clearInterval(timerInterval)
    if (giftInterval) clearInterval(giftInterval)
    if (gremlinInterval) clearInterval(gremlinInterval)
    timerInterval = giftInterval = gremlinInterval = null
  }

  function resetEntities(): void {
    state.gifts = []
    state.gremlins = []
    state.particles = createParticlesState()
    state.boss = createBoss()
    state.cameraShake = 0
    state.bossDefeated = false
    state.flags.dead = false
    state.slowMotionTimer = 0
  }

  function startGame(): void {
    state.score = 0
    state.timeLeft = state.selectedDuration
    state.won = false
    state.bossDefeated = false
    state.anecdotesUnlocked = 0

    resetPlayer(state.player)
    resetEntities()
    clearIntervals()
    startMusicLoop(state.audio, state)

    state.state = 'play'

    timerInterval = window.setInterval(() => {
      if (state.state !== 'play') return
      if (state.timeLeft <= 1) endGame(true)
      else state.timeLeft--
    }, 1000)

    giftInterval = window.setInterval(() => {
      if (state.state === 'play') spawnGift()
    }, 800)

    gremlinInterval = window.setInterval(() => {
      if (state.state === 'play') spawnGremlin()
    }, 1500)
  }

  function endGame(timeOverWon: boolean): void {
    if (state.state !== 'play') return

    state.won = timeOverWon && state.score > 0
    state.state = 'end'
    state.bestScore = Math.max(state.bestScore, state.score)

    computeAnecdotes()
    updateLeaderboard()
    clearIntervals()

    if (state.won) playVictoryJingle(state.audio)
    else playDeathSweep(state.audio)

    stopMusicLoop(state.audio)
    state.cameraShake = 0

    callbacks.onEnd?.(state)
  }

  function spawnGift(): void {
    state.gifts.push({
      x: 20 + Math.random() * (LOGIC_WIDTH - 40),
      y: -20,
      w: 18,
      h: 18,
      vy: 2 + Math.random(),
    })
  }

  function spawnGremlin(): void {
    state.gremlins.push({
      x: 20 + Math.random() * (LOGIC_WIDTH - 60),
      y: -40,
      w: 30,
      h: 32,
      vy: 3.4 + Math.random() * 1.8,
    })
  }

  function update(dt: number): void {
    let speedFactor = 1

    if (state.slowMotionTimer > 0) {
      speedFactor = 0.35
      state.slowMotionTimer--
    }

    if (state.state === 'boot') {
      state.bootTimer--
      if (state.bootTimer <= 0) {
        state.firstBoot = false
        state.state = 'intro'
      }
      return
    }

    if (state.state !== 'play') return

    maybeSpawnBoss(state.boss, state)
    handlePlayerInput(state.player, keys, touch)
    updatePlayer(state.player, dt * speedFactor, state)

    state.gifts.forEach((g) => (g.y += g.vy * dt))

    state.gifts = state.gifts.filter((g) => {
      if (playerCollidesWith(state.player, g)) {
        state.score++
        playGiftSound(state.audio)
        spawnParticles(state.particles, g.x + g.w / 2, g.y + g.h / 2, '#facc15', 14)
        addScorePop(
          state.particles,
          state.player.x + state.player.w / 2,
          state.player.y - 6,
          '+1',
          30,
        )
        return false
      }
      return g.y < LOGIC_HEIGHT + 40
    })

    state.gremlins.forEach((e) => (e.y += e.vy * dt))

    for (const en of state.gremlins) {
      if (
        rectsOverlap(
          { x: state.player.x, y: state.player.y },
          { x: en.x, y: en.y },
          state.player.w,
          state.player.h,
          en.w,
          en.h,
        )
      ) {
        state.flags.dead = true
        break
      }
    }

    updateBoss(
      state.boss,
      dt,
      state.player,
      state,
      (boss) => {
        // 🔥 IMPACT VISUEL
        state.cameraShake = 10
        state.slowMotionTimer = 12

        // 🔊 REBOND DU JOUEUR
        state.player.vy = -18

        // ✨ PARTICULES D'IMPACT
        spawnParticles(state.particles, boss.x + boss.w / 2, boss.y, '#f97316', 20)

        // ✅ DÉGÂTS BOSS
        boss.hp -= 1

        // ✅ SCORE PAR HIT
        state.score += 5

        addScorePop(
          state.particles,
          state.player.x + state.player.w / 2,
          state.player.y - 10,
          '+5',
          40,
        )

        // 💀 BOSS VAINCU
        if (boss.hp <= 0) {
          boss.active = false
          state.bossDefeated = true

          state.score += 30

          addScorePop(state.particles, boss.x + boss.w / 2, boss.y, '+30', 60)
        }
      },
      () => {
        state.flags.dead = true
      },
    )

    if (state.flags.dead) endGame(false)

    updateParticles(state.particles, dt)
    updateSnow(state.snow, dt)
  }

  function drawBackground(): void {
    const w = LOGIC_WIDTH
    const h = LOGIC_HEIGHT

    // 🌌 CIEL DÉGRADÉ NOËL
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, '#020617')
    grad.addColorStop(0.5, '#0f172a')
    grad.addColorStop(1, '#020617')

    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    // 🌙 LUNE
    const moonX = LOGIC_WIDTH - 110
    const moonY = 70
    const moonR = 26

    ctx.fillStyle = '#fde68a'
    ctx.beginPath()
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'rgba(2,6,23,0.25)'
    ctx.beginPath()
    ctx.arc(moonX - 6, moonY + 4, moonR - 2, 0, Math.PI * 2)
    ctx.fill()

    // ★ ÉTOILES
    ctx.fillStyle = '#f8fafc'
    for (let i = 0; i < 70; i++) {
      const x = (i * 37 + 13) % w
      const y = (i * 53 + 21) % 220
      ctx.fillRect(x, y, 2, 2)
    }

    // 🏔️ MONTAGNES SOMBRE
    ctx.fillStyle = '#020617'
    for (let x = 0; x < w; x += 60) {
      const height = 160 + (x % 120)
      ctx.beginPath()
      ctx.moveTo(x + 30, h - 300 - height)
      ctx.lineTo(x, h - 300)
      ctx.lineTo(x + 60, h - 300)
      ctx.closePath()
      ctx.fill()
    }

    ctx.fillStyle = '#030712'
    for (let x = 0; x < w; x += 46) {
      const height = 120 + (x % 90)
      ctx.beginPath()
      ctx.moveTo(x + 23, h - 250 - height)
      ctx.lineTo(x + 6, h - 250)
      ctx.lineTo(x + 40, h - 250)
      ctx.closePath()
      ctx.fill()
    }

    // ❄️ SOL NEIGE
    ctx.fillStyle = '#e5e7eb'
    ctx.fillRect(0, h - 90, w, 90)

    ctx.fillStyle = 'rgba(148,163,184,0.4)'
    for (let i = 0; i < 120; i++) {
      const xx = (i * 19) % w
      const yy = h - 90 + ((i * 7) % 90)
      ctx.fillRect(xx, yy, 2, 1)
    }
  }

  function drawPlatforms(): void {
    ctx.fillStyle = '#f9fafb'

    for (const p of PLATFORMS) {
      ctx.fillRect(p.x, p.y, p.w, p.h)

      // Liseré givré
      ctx.fillStyle = '#dbeafe'
      ctx.fillRect(p.x, p.y, p.w, 3)

      ctx.fillStyle = '#f9fafb'
    }
  }

  function render(): void {
    if (!ctx) return

    ctx.save()

    if (state.cameraShake > 0) {
      ctx.translate(
        (Math.random() - 0.5) * state.cameraShake,
        (Math.random() - 0.5) * state.cameraShake,
      )
    }

    // ✅ BACKGROUND
    drawBackground()

    // ✅ PLATEFORMES
    drawPlatforms()

    // ✅ CADEAUX
    state.gifts.forEach((g) => {
      const x = Math.floor(g.x)
      const y = Math.floor(g.y)

      ctx.fillStyle = '#22c55e'
      ctx.fillRect(x, y, g.w, g.h)
      ctx.fillStyle = '#facc15'
      ctx.fillRect(x + g.w / 2 - 2, y, 4, g.h)
      ctx.fillRect(x, y + g.h / 2 - 2, g.w, 4)
    })

    // ✅ GREMLINS
    state.gremlins.forEach((en) => {
      const x = Math.floor(en.x)
      const y = Math.floor(en.y)
      const w = en.w
      const h = en.h

      ctx.fillStyle = '#22c55e'
      ctx.fillRect(x, y, w, h)

      ctx.fillStyle = '#a3e635'
      ctx.fillRect(x + 4, y - 4, 4, 6)
      ctx.fillRect(x + w - 8, y - 4, 4, 6)

      ctx.fillStyle = '#fef2f2'
      ctx.fillRect(x + 6, y + 8, 4, 4)
      ctx.fillRect(x + w - 10, y + 8, 4, 4)

      ctx.fillStyle = '#b91c1c'
      ctx.fillRect(x + 7, y + 9, 2, 2)
      ctx.fillRect(x + w - 9, y + 9, 2, 2)

      ctx.fillStyle = '#111827'
      ctx.fillRect(x + 6, y + 20, w - 12, 3)
    })

    // ✅ BOSS
    drawBoss(ctx, state.boss)

    // ✅ PLAYER
    drawPlayer(ctx, state.player)

    // ✅ PARTICULES
    drawParticles(ctx, state.particles)
    drawScorePops(ctx, state.particles)

    // ✅ NEIGE
    drawSnow(ctx, state.snow)

    // ✅ BOOT ANIMATION
    if (state.state === 'boot') {
      const t = 1 - state.bootTimer / BOOT_DURATION_FRAMES

      ctx.fillStyle = `rgba(2,6,23,${0.9 - t * 0.6})`
      ctx.fillRect(0, 0, LOGIC_WIDTH, LOGIC_HEIGHT)

      ctx.save()
      ctx.translate(LOGIC_WIDTH / 2, LOGIC_HEIGHT / 2)
      ctx.scale(1 + t * 0.6, 1 + t * 0.6)
      ctx.translate(-LOGIC_WIDTH / 2, -LOGIC_HEIGHT / 2)

      ctx.fillStyle = '#fde68a'
      ctx.font = 'bold 32px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('twini Xmas', LOGIC_WIDTH / 2, LOGIC_HEIGHT / 2 - 20)

      ctx.fillStyle = '#f472b6'
      ctx.font = 'bold 16px monospace'
      ctx.fillText("Let's go!!!", LOGIC_WIDTH / 2, LOGIC_HEIGHT / 2 + 14)

      ctx.restore()
    }

    ctx.restore()

    // ✅ OVERLAY DE FIN
    if (state.state === 'end') {
      ctx.fillStyle = 'rgba(0,0,0,0.35)'
      ctx.fillRect(0, 0, LOGIC_WIDTH, LOGIC_HEIGHT)

      ctx.fillStyle = state.won ? '#fde68a' : '#f87171'
      ctx.font = 'bold 48px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(state.won ? 'NOËL SAUVÉ !' : 'GAME OVER', LOGIC_WIDTH / 2, LOGIC_HEIGHT / 2)
    }
  }

  function loop(timestamp: number): void {
    const dt = (timestamp - lastTime) / 16.67 || 1
    lastTime = timestamp
    update(dt)
    render()
    rafId = requestAnimationFrame(loop)
  }

  function startLoop(): void {
    lastTime = performance.now()
    rafId = requestAnimationFrame(loop)
  }

  function stopLoop(): void {
    if (rafId) cancelAnimationFrame(rafId)
    rafId = null
  }

  function onKeyDown(e: KeyboardEvent): void {
    keys[e.key.toLowerCase()] = true
  }

  function onKeyUp(e: KeyboardEvent): void {
    keys[e.key.toLowerCase()] = false
  }

  function setTouch(dir: keyof TouchState, value: boolean): void {
    touch[dir] = value
  }

  function toggleMute(): void {
    toggleMuteAudio(state.audio)
    callbacks.onMuteChange?.(state.audio.muted)
  }

  function boot(): void {
    loadLeaderboard()

    if (state.firstBoot) {
      state.state = 'boot'
      state.bootTimer = BOOT_DURATION_FRAMES
    } else {
      state.state = 'intro'
    }

    startLoop()
  }

  return {
    state,
    startGame,
    endGame,
    boot,
    onKeyDown,
    onKeyUp,
    setTouch,
    startLoop,
    stopLoop,
    toggleMute,
  }
}
