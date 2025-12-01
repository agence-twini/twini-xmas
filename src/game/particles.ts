export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}

export interface ScorePop {
  x: number
  y: number
  value: string | number
  life: number
}

export interface ParticlesState {
  particles: Particle[]
  scorePops: ScorePop[]
}

export function createParticlesState(): ParticlesState {
  return {
    particles: [],
    scorePops: [],
  }
}

export function spawnParticles(
  state: ParticlesState,
  x: number,
  y: number,
  color: string = '#facc15',
  count: number = 12,
): void {
  for (let i = 0; i < count; i++) {
    state.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 1.2) * 4,
      life: 20,
      color,
    })
  }
}

export function addScorePop(
  state: ParticlesState,
  x: number,
  y: number,
  value: string | number,
  life: number = 30,
): void {
  state.scorePops.push({
    x,
    y,
    value,
    life,
  })
}

export function updateParticles(state: ParticlesState, dt: number): void {
  state.particles = state.particles
    .map((p) => ({
      ...p,
      x: p.x + p.vx * dt,
      y: p.y + p.vy * dt,
      life: p.life - 1,
    }))
    .filter((p) => p.life > 0)

  state.scorePops = state.scorePops
    .map((p) => ({
      ...p,
      y: p.y - 0.6 * dt,
      life: p.life - 1,
    }))
    .filter((p) => p.life > 0)
}

export function drawParticles(ctx: CanvasRenderingContext2D, state: ParticlesState): void {
  state.particles.forEach((p) => {
    ctx.fillStyle = p.color || '#facc15'
    ctx.fillRect(p.x, p.y, 2, 2)
  })
}

export function drawScorePops(ctx: CanvasRenderingContext2D, state: ParticlesState): void {
  ctx.font = 'bold 12px monospace'
  ctx.textAlign = 'center'

  state.scorePops.forEach((p) => {
    ctx.fillStyle = '#fde68a'
    ctx.fillText(String(p.value), p.x, p.y)
  })
}
