import { LOGIC_WIDTH, LOGIC_HEIGHT } from './constants'

export interface Snowflake {
  x: number
  y: number
  vy: number
  size: number
  layer: number
}

export function createSnowState(count: number = 140): Snowflake[] {
  const flakes: Snowflake[] = []

  for (let i = 0; i < count; i++) {
    flakes.push({
      x: Math.random() * LOGIC_WIDTH,
      y: Math.random() * LOGIC_HEIGHT,
      vy: 0.5 + Math.random() * 1.5,
      size: Math.random() < 0.7 ? 1 : 2,
      layer: Math.random() < 0.5 ? 1 : 2,
    })
  }

  return flakes
}

export function updateSnow(flakes: Snowflake[], dt: number): void {
  flakes.forEach((flake) => {
    flake.y += flake.vy * dt
    flake.x += (flake.layer === 1 ? 0.1 : 0.3) * dt

    if (flake.y > LOGIC_HEIGHT) {
      flake.y = -10
      flake.x = Math.random() * LOGIC_WIDTH
    }

    if (flake.x > LOGIC_WIDTH + 5) {
      flake.x = -5
    }
  })
}

export function drawSnow(ctx: CanvasRenderingContext2D, flakes: Snowflake[]): void {
  flakes.forEach((flake) => {
    ctx.fillStyle = flake.layer === 1 ? 'rgba(248,250,252,0.8)' : 'rgba(248,250,252,0.5)'
    ctx.fillRect(flake.x, flake.y, flake.size, flake.size)
  })
}
