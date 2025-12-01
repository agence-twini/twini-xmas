<script setup lang="ts">
interface LeaderboardEntry {
  score: number
  ts: number
}

type Anecdote = string

interface Props {
  state: 'boot' | 'intro' | 'play' | 'end'
  score: number
  bestScore: number
  bossDefeated: boolean
  selectedDuration: number
  anecdotes: Anecdote[]
  leaderboard: LeaderboardEntry[]
  shareText: string
  shareCopied: boolean
  won: boolean
}

defineProps<Props>()

defineEmits<{
  start: []
  'set-duration': [duration: number]
  'copy-share': []
}>()
</script>

<template>
  <div v-if="state === 'intro' || state === 'end'" class="overlay">
    <div class="overlay-card">
      <h1 v-if="state === 'intro'">twini Xmas</h1>
      <h1 v-else>{{ won ? 'Noël sauvé ✨' : 'Noël en danger 😈' }}</h1>

      <p class="subtitle" v-if="state === 'intro'">
        Récupérez un max de cadeaux, évitez les gremlins et stompez Krampus avant la fin du chrono.
      </p>
      <p class="subtitle" v-else>
        Score : <strong>{{ score }}</strong> cadeaux — Best : <strong>{{ bestScore }}</strong>
        <span v-if="bossDefeated"> (Krampus vaincu 💀)</span>
      </p>

      <div v-if="state === 'intro'" class="modes">
        <p class="modes-label">Mode de jeu :</p>
        <div class="modes-buttons">
          <button
            :class="['mode-btn', selectedDuration === 45 ? 'mode-btn--active' : '']"
            @click="$emit('set-duration', 45)"
          >
            Classique · 45s
          </button>
          <button
            :class="['mode-btn', selectedDuration === 60 ? 'mode-btn--active' : '']"
            @click="$emit('set-duration', 60)"
          >
            Score Attack · 60s
          </button>
        </div>
      </div>

      <p class="controls">
        Clavier : ← → pour bouger, ↑ ou Espace pour sauter. Mobile : boutons en bas de l’écran.
      </p>

      <div v-if="anecdotes.length" class="anecdotes-block">
        <h3>🎁 Anecdotes débloquées</h3>
        <ul class="anecdote-list">
          <li v-for="(a, i) in anecdotes" :key="i">
            {{ a }}
          </li>
        </ul>
      </div>

      <div v-if="leaderboard.length" class="leaderboard-block">
        <h3>🏅 Top scores</h3>
        <ol>
          <li v-for="(e, i) in leaderboard" :key="e.ts">
            <span class="rank">#{{ i + 1 }}</span>
            <span class="score">{{ e.score }} cadeaux</span>
          </li>
        </ol>
      </div>

      <div class="share-block">
        <p class="share-label">Phrase à partager :</p>
        <div class="share-box">
          <span class="share-text">{{ shareText }}</span>
        </div>
        <button class="secondary-btn" @click="$emit('copy-share')">Copier</button>
        <span v-if="shareCopied" class="share-confirm">Copié ✅</span>
      </div>

      <button class="primary-btn" @click="$emit('start')">
        {{ state === 'intro' ? 'Lancer la partie' : 'Rejouer' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: radial-gradient(circle at top, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.98));
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
  padding: 1rem;
}

.overlay-card {
  padding: 1.6rem 2rem;
  border-radius: 1.4rem;
  background: rgba(15, 23, 42, 0.98);
  border: 1px solid rgba(148, 163, 184, 0.7);
  box-shadow:
    0 20px 50px rgba(0, 0, 0, 0.95),
    0 0 0 1px rgba(15, 23, 42, 1);
  max-width: 520px;
  max-height: 90svh;
  overflow-y: auto;
  text-align: center;
}

.overlay-card h1 {
  font-size: 1.6rem;
  margin-bottom: 0.4rem;
}

.subtitle {
  font-size: 0.9rem;
  opacity: 0.9;
  margin-bottom: 0.9rem;
}

.controls {
  font-size: 0.8rem;
  opacity: 0.8;
  margin-bottom: 0.9rem;
}

.modes {
  margin-bottom: 0.9rem;
  text-align: left;
}

.modes-label {
  font-size: 0.8rem;
  opacity: 0.9;
  margin-bottom: 0.3rem;
}

.modes-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.mode-btn {
  flex: 1 1 0;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  background: transparent;
  color: #e5e7eb;
  font-size: 0.8rem;
  padding: 0.35rem 0.6rem;
  cursor: pointer;
}

.mode-btn--active {
  background: rgba(96, 165, 250, 0.2);
  border-color: rgba(96, 165, 250, 0.9);
}

.anecdotes-block,
.leaderboard-block {
  margin-bottom: 0.9rem;
  text-align: left;
  font-size: 0.85rem;
  background: rgba(15, 23, 42, 0.6);
  padding: 0.8rem 1rem;
  border-radius: 0.9rem;
  border: 1px solid rgba(148, 163, 184, 0.4);
}

.share-block {
  margin-bottom: 1rem;
  text-align: left;
  font-size: 0.8rem;
}

.share-box {
  border-radius: 0.9rem;
  border: 1px dashed rgba(148, 163, 184, 0.9);
  padding: 0.5rem 0.7rem;
  background: rgba(15, 23, 42, 0.95);
  margin-bottom: 0.4rem;
}

.share-confirm {
  margin-left: 0.4rem;
  font-size: 0.75rem;
  color: #4ade80;
}

.primary-btn,
.secondary-btn {
  border-radius: 999px;
  padding: 0.55rem 1.4rem;
  font-size: 0.85rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  border: none;
  cursor: pointer;
}

.primary-btn {
  background: linear-gradient(135deg, #6366f1, #ec4899);
  color: #f9fafb;
  box-shadow: 0 16px 32px rgba(79, 70, 229, 0.7);
}

.secondary-btn {
  background: transparent;
  color: #e5e7eb;
  border: 1px solid rgba(148, 163, 184, 0.7);
}
</style>
