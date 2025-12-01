import {
  GRAVITY,
  MOVE_SPEED,
  JUMP_FORCE,
  LOGIC_WIDTH,
  LOGIC_HEIGHT,
  PLATFORMS,
} from './constants.ts'
import { rectsOverlap } from './utils.ts'

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

export interface Keys {
  [key: string]: boolean
}

export interface Touch {
  right: boolean
  left: boolean
  jump: boolean
}

export interface GameState {
  isMobile: boolean
  flags: {
    dead: boolean
  }
}

export interface GameObject {
  x: number
  y: number
  w: number
  h: number
}

export function createPlayer(): Player {
  return {
    x: 260,
    y: 780,
    w: 28,
    h: 36,
    vx: 0,
    vy: 0,
    onGround: false,
    facing: 1,
  }
}

export function resetPlayer(player: Player): void {
  player.x = 260
  player.y = 780
  player.vx = 0
  player.vy = 0
  player.onGround = false
  player.facing = 1
}

export function handlePlayerInput(player: Player, keys: Keys, touch: Touch): void {
  let move = 0

  if (keys['arrowright'] || keys['d'] || touch.right) move += 1
  if (keys['arrowleft'] || keys['q'] || touch.left) move -= 1

  player.vx = move * MOVE_SPEED

  if (move !== 0) player.facing = move

  const jumpPressed = keys['arrowup'] || keys['z'] || keys['w'] || keys[' '] || touch.jump

  if (jumpPressed && player.onGround) {
    player.vy = JUMP_FORCE
    player.onGround = false
  }
}

export function updatePlayer(player: Player, dt: number, gameState: GameState): void {
  const canvasWidth = LOGIC_WIDTH
  const canvasHeight = LOGIC_HEIGHT

  const prevY = player.y

  player.vy += GRAVITY * dt
  player.x += player.vx * dt
  player.y += player.vy * dt
  player.onGround = false

  // Clamp horizontal
  if (player.x < 0) player.x = 0
  if (player.x + player.w > canvasWidth) player.x = canvasWidth - player.w

  // Clamp vertical top
  if (player.y < 0) {
    player.y = 0
    if (player.vy < 0) player.vy = 0
  }

  // Platforms
  for (const p of PLATFORMS) {
    const prevBottom = prevY + player.h
    const currBottom = player.y + player.h
    const withinX = player.x + player.w > p.x + 2 && player.x < p.x + p.w - 2

    if (withinX && prevBottom <= p.y && currBottom >= p.y) {
      player.y = p.y - player.h
      player.vy = 0
      player.onGround = true
    }
  }

  // Fall below = game over
  const SAFE_GROUND_MARGIN = gameState.isMobile ? 64 : 0

  if (player.y > canvasHeight + 40 - SAFE_GROUND_MARGIN) {
    gameState.flags.dead = true
  }
}

export function drawPlayer(ctx: CanvasRenderingContext2D, player: Player): void {
  ctx.save()

  const px = player.x + player.w / 2

  ctx.translate(px, 0)
  ctx.scale(player.facing, 1)
  ctx.translate(-px, 0)

  const x = Math.floor(player.x)
  const y = Math.floor(player.y)

  // Body
  ctx.fillStyle = '#dc2626'
  ctx.fillRect(x + 4, y + 14, 20, 18)

  // Legs
  ctx.fillStyle = '#111827'
  ctx.fillRect(x + 5, y + 32, 7, 6)
  ctx.fillRect(x + 16, y + 32, 7, 6)

  // Belt
  ctx.fillStyle = '#111827'
  ctx.fillRect(x + 4, y + 24, 20, 4)

  // Face
  ctx.fillStyle = '#fee2b3'
  ctx.fillRect(x + 6, y + 4, 16, 10)

  // Beard
  ctx.fillStyle = '#f9fafb'
  ctx.fillRect(x + 6, y + 10, 16, 6)

  // Hat
  ctx.fillStyle = '#b91c1c'
  ctx.fillRect(x + 6, y, 16, 5)
  ctx.fillRect(x + 14, y - 4, 8, 5)
  ctx.fillStyle = '#f9fafb'
  ctx.fillRect(x + 20, y - 4, 4, 4)

  ctx.restore()
}

export function playerCollidesWith(player: Player, obj: GameObject): boolean {
  return rectsOverlap(
    { x: player.x, y: player.y },
    { x: obj.x, y: obj.y },
    player.w,
    player.h,
    obj.w,
    obj.h,
  )
}
