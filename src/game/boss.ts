import { LOGIC_WIDTH } from './constants.ts'
import { rectsOverlap } from './utils.ts'

export interface Boss {
  active: boolean
  x: number
  y: number
  w: number
  h: number
  vx: number
  hp: number
  floatPhase: number
  intro: {
    active: boolean
    timer: number
  }
}

export interface Player {
  x: number
  y: number
  w: number
  h: number
  vx: number
  vy: number
  onGround: boolean
  facing: number
}

export interface GameState {
  timeLeft: number
  cameraShake: number
  flags: {
    dead: boolean
  }
  isMobile: boolean
}

export function createBoss(): Boss {
  return {
    active: false,
    x: 200,
    y: 260,
    w: 44,
    h: 52,
    vx: 2.4,
    hp: 3,
    floatPhase: 0,
    intro: {
      active: false,
      timer: 0,
    },
  }
}

export function startBossIntro(boss: Boss, gameState: GameState): void {
  boss.active = true
  boss.hp = 3
  boss.x = LOGIC_WIDTH / 2 - boss.w / 2
  boss.y = -120
  boss.vx = 2.4
  boss.floatPhase = 0
  boss.intro.active = true
  boss.intro.timer = 90
  gameState.cameraShake = 6
}

export function maybeSpawnBoss(boss: Boss, gameState: GameState): void {
  if (!boss.active && !boss.intro.active && gameState.timeLeft <= 15) {
    startBossIntro(boss, gameState)
  }
}

export function updateBoss(
  boss: Boss,
  dt: number,
  player: Player,
  gameState: GameState,
  onHit: (boss: Boss) => void,
  onPlayerKilled: () => void,
): void {
  if (boss.intro.active) {
    boss.intro.timer--
    gameState.cameraShake = 6
    boss.y += 2.2 * dt

    if (boss.y >= 260 || boss.intro.timer <= 0) {
      boss.y = 260
      boss.intro.active = false
      gameState.cameraShake = 0
    }

    return
  }

  if (!boss.active) return

  boss.floatPhase += 0.06 * dt
  boss.y = 260 + Math.sin(boss.floatPhase) * 60
  boss.x += boss.vx * dt

  if (boss.x < 20 || boss.x + boss.w > LOGIC_WIDTH - 20) {
    boss.vx *= -1
  }

  // Collision with player
  if (
    rectsOverlap(
      { x: player.x, y: player.y },
      { x: boss.x, y: boss.y },
      player.w,
      player.h,
      boss.w,
      boss.h,
    )
  ) {
    const playerBottom = player.y + player.h
    const bossTop = boss.y
    const isStomp = player.vy > 0 && playerBottom <= bossTop + 16

    if (isStomp) {
      onHit(boss)
      return
    }

    onPlayerKilled()
  }
}

export function drawBoss(ctx: CanvasRenderingContext2D, boss: Boss): void {
  if (!boss.active && !boss.intro.active) return

  const x = Math.floor(boss.x)
  const y = Math.floor(boss.y)
  const w = boss.w
  const h = boss.h

  ctx.fillStyle = '#111827'
  ctx.fillRect(x, y + 12, w, h - 12)

  ctx.fillStyle = '#4b5563'
  ctx.fillRect(x + 4, y + 10, w - 8, h - 14)

  ctx.fillStyle = '#1f2937'
  ctx.fillRect(x + 8, y, w - 16, 16)

  ctx.fillStyle = '#b91c1c'
  ctx.fillRect(x + 4, y - 6, 6, 8)
  ctx.fillRect(x + w - 10, y - 6, 6, 8)

  ctx.fillStyle = '#fee2e2'
  ctx.fillRect(x + 11, y + 5, 4, 4)
  ctx.fillRect(x + w - 15, y + 5, 4, 4)
  ctx.fillStyle = '#b91c1c'
  ctx.fillRect(x + 12, y + 6, 2, 2)
  ctx.fillRect(x + w - 14, y + 6, 2, 2)

  ctx.fillStyle = '#ef4444'
  ctx.fillRect(x + 11, y + 11, w - 22, 3)

  // Health bar
  if (boss.active && !boss.intro.active) {
    const maxHp = 3
    const barWidth = w
    const ratio = boss.hp / maxHp

    ctx.fillStyle = '#111827'
    ctx.fillRect(x, y - 10, barWidth, 4)
    ctx.fillStyle = '#f97316'
    ctx.fillRect(x, y - 10, barWidth * ratio, 4)
  }

  if (boss.intro.active) {
    ctx.strokeStyle = 'rgba(248,113,113,0.8)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x + w / 2, y + h / 2, w + 10, 0, Math.PI * 2)
    ctx.stroke()
  }
}
