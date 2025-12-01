<script setup lang="ts">
import { ref, onMounted, onUnmounted, type Ref } from 'vue'
import GameHUD from '@/components/GameHUD.vue'
import TouchControls from '@/components/TouchControls.vue'
import GameOverlay from '@/components/GameOverlay.vue'
import { LOGIC_WIDTH, LOGIC_HEIGHT } from './game/constants'
import { createGameEngine } from './game/engine'

type Secret = string

interface LeaderboardEntry {
  score: number
  ts: number
}

interface GameEngine {
  state: {
    state: 'boot' | 'intro' | 'play' | 'end'
    timeLeft: number
    selectedDuration: number
    score: number
    bestScore: number
    won: boolean
    bossDefeated: boolean
    leaderboard: LeaderboardEntry[]
    audio: {
      muted: boolean
    }
    secretsUnlocked: number
    agencySecrets?: Secret[]
    firstBoot: boolean
  }
  startGame: () => void
  toggleMute: () => void
  setTouch: (dir: 'left' | 'right' | 'jump', val: boolean) => void
  onKeyDown: (e: KeyboardEvent) => void
  onKeyUp: (e: KeyboardEvent) => void
  boot: () => void
  startLoop: () => void
  stopLoop: () => void
}

interface TouchPayload {
  dir: 'left' | 'right' | 'jump'
  val: boolean
}

const frame: Ref<HTMLDivElement | null> = ref(null)
const canvas: Ref<HTMLCanvasElement | null> = ref(null)
const ctxRef: Ref<CanvasRenderingContext2D | null> = ref(null)

const vueState: Ref<'boot' | 'intro' | 'play' | 'end'> = ref('boot')
const timeLeft: Ref<number> = ref(45)
const selectedDuration: Ref<number> = ref(45)
const score: Ref<number> = ref(0)
const bestScore: Ref<number> = ref(0)
const won: Ref<boolean> = ref(false)
const bossDefeated: Ref<boolean> = ref(false)
const isMobile: Ref<boolean> = ref(false)
const muted: Ref<boolean> = ref(false)

const unlockedSecrets: Ref<Secret[]> = ref([])
const leaderboard: Ref<LeaderboardEntry[]> = ref([])

const engineRef: Ref<GameEngine | null> = ref(null)

function resizeCanvas(): void {
  if (!frame.value || !canvas.value || !ctxRef.value) return

  const w = frame.value.clientWidth
  const h = frame.value.clientHeight
  const scale = Math.min(w / LOGIC_WIDTH, h / LOGIC_HEIGHT)

  canvas.value.width = LOGIC_WIDTH * scale
  canvas.value.height = LOGIC_HEIGHT * scale

  const ctx = ctxRef.value

  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  ctx.imageSmoothingEnabled = false
}

function syncFromEngine(): void {
  const engine = engineRef.value

  if (!engine) return

  const s = engine.state

  vueState.value = s.state
  timeLeft.value = s.timeLeft
  selectedDuration.value = s.selectedDuration
  score.value = s.score
  bestScore.value = s.bestScore
  won.value = s.won
  bossDefeated.value = s.bossDefeated
  leaderboard.value = s.leaderboard
  muted.value = s.audio.muted

  const secrets: Secret[] = []

  for (let i = 0; i < s.secretsUnlocked; i++) {
    const source = s.agencySecrets

    if (!source) continue

    const value = source[i]

    if (typeof value === 'string') {
      secrets.push(value)
    }
  }

  unlockedSecrets.value = secrets
}

function startGame(): void {
  const engine = engineRef.value

  if (!engine) return

  engine.state.selectedDuration = selectedDuration.value
  engine.startGame()

  syncFromEngine()
}

function setDuration(val: number): void {
  selectedDuration.value = val

  const engine = engineRef.value

  if (engine) {
    engine.state.selectedDuration = val
  }
}

function onToggleMute(): void {
  const engine = engineRef.value

  if (!engine) return

  engine.toggleMute()
  muted.value = engine.state.audio.muted
}

function onTouchControl(payload: TouchPayload): void {
  const engine = engineRef.value

  if (!engine) return

  engine.setTouch(payload.dir, payload.val)
}

function onKeyDown(e: KeyboardEvent): void {
  const engine = engineRef.value

  if (!engine) return

  engine.onKeyDown(e)
}

function onKeyUp(e: KeyboardEvent): void {
  const engine = engineRef.value

  if (!engine) return

  engine.onKeyUp(e)
}

let syncInterval: number | null = null

onMounted(() => {
  const c = canvas.value

  if (!c) return

  const ctx = c.getContext('2d')

  if (!ctx) return

  ctxRef.value = ctx

  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)

  isMobile.value = window.matchMedia('(pointer: coarse)').matches

  const engine = createGameEngine(ctx, {
    onEnd: () => {
      syncFromEngine()
    },
    onMuteChange: (m: boolean) => {
      muted.value = m
    },
  })

  engineRef.value = engine

  if (engine.state.firstBoot) {
    engine.boot()
  } else {
    engine.startLoop()
  }

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)

  // Small polling to synchronize Vue refs with the engine
  syncInterval = window.setInterval(syncFromEngine, 100)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)

  if (syncInterval !== null) {
    clearInterval(syncInterval)
    syncInterval = null
  }

  if (engineRef.value) {
    engineRef.value.stopLoop()
  }
})
</script>

<template>
  <div
    class="flex items-center justify-center min-h-screen p-4 bg-[radial-gradient(circle_at_top,_var(--background)_0,_#020617_45%,_#022c22_80%,_#022c22_100%)] text-foreground"
  >
    <div
      ref="frame"
      class="relative w-full max-w-[580px] max-h-[900px] aspect-[580_/_900] bg-black rounded-3xl shadow-[0_20px_50px_rgba(2,_44,_34,_0.7)] overflow-hidden touch-none"
    >
      <div class="w-full h-full">
        <canvas ref="canvas" class="block w-full h-full"></canvas>
      </div>

      <GameHUD
        :time-left="timeLeft"
        :score="score"
        :best-score="bestScore"
        :boss-defeated="bossDefeated"
        :muted="muted"
        @toggle-mute="onToggleMute"
      />

      <TouchControls :show="isMobile && vueState === 'play'" @touch="onTouchControl" />
    </div>

    <GameOverlay
      :state="vueState"
      :score="score"
      :bestScore="bestScore"
      :bossDefeated="bossDefeated"
      :selectedDuration="selectedDuration"
      :secrets="unlockedSecrets"
      :leaderboard="leaderboard"
      :won="won"
      @start="startGame"
      @set-duration="setDuration"
    />
  </div>
</template>

<style scoped>
canvas {
  image-rendering: pixelated;
}
</style>
