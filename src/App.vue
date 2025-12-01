<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, type Ref, type ComputedRef } from 'vue'
import GameHUD from '@/components/GameHUD.vue'
import TouchControls from '@/components/TouchControls.vue'
import GameOverlay from '@/components/GameOverlay.vue'
import { LOGIC_WIDTH, LOGIC_HEIGHT } from './game/constants.ts'
import { createGameEngine } from './game/engine.ts'

type Anecdote = string

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
    anecdotesUnlocked: number
    agencyAnecdotes?: Anecdote[]
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

const unlockedAnecdotes: Ref<Anecdote[]> = ref([])
const leaderboard: Ref<LeaderboardEntry[]> = ref([])
const shareCopied: Ref<boolean> = ref(false)

const engineRef: Ref<GameEngine | null> = ref(null)

const shareText: ComputedRef<string> = computed(
  () =>
    `J'ai fait ${score.value} cadeaux sur Santa Arcade (best ${bestScore.value}) et affronté Krampus. Qui fait mieux ?`,
)

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

  const anecdotes: Anecdote[] = []

  for (let i = 0; i < s.anecdotesUnlocked; i++) {
    const source = s.agencyAnecdotes

    if (!source) continue

    const value = source[i]

    if (typeof value === 'string') {
      anecdotes.push(value)
    }
  }

  unlockedAnecdotes.value = anecdotes
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

async function copyShare(): Promise<void> {
  shareCopied.value = false

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(shareText.value)
      shareCopied.value = true
    }
  } catch {
    shareCopied.value = false
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
  <div class="game-shell">
    <div class="game-frame" ref="frame">
      <div class="canvas-wrapper">
        <canvas ref="canvas"></canvas>
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
      :anecdotes="unlockedAnecdotes"
      :leaderboard="leaderboard"
      :shareText="shareText"
      :shareCopied="shareCopied"
      :won="won"
      @start="startGame"
      @set-duration="setDuration"
      @copy-share="copyShare"
    />
  </div>
</template>

<style scoped>
.game-shell {
  min-height: 100vh;
  background: radial-gradient(circle at top, #0f172a 0, #020617 60%, #000 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  color: #f9fafb;
  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'SF Pro Text',
    'Segoe UI',
    sans-serif;
}

.game-frame {
  position: relative;
  width: 100%;
  max-width: 580px;
  max-height: 900px;
  aspect-ratio: 580 / 900;
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.9),
    0 0 0 2px rgba(15, 23, 42, 0.9);
  border-radius: 18px;
  overflow: hidden;
  background: black;
  touch-action: none;
}

.canvas-wrapper {
  width: 100%;
  height: 100%;
}

canvas {
  width: 100%;
  height: 100%;
  display: block;
  image-rendering: pixelated;
}
</style>
