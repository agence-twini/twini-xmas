<script setup lang="ts">
interface LeaderboardEntry {
  score: number
  ts: number
}

type Secret = string

interface Props {
  state: 'boot' | 'intro' | 'play' | 'end'
  score: number
  bestScore: number
  bossDefeated: boolean
  selectedDuration: number
  secrets: Secret[]
  leaderboard: LeaderboardEntry[]
  won: boolean
}

defineProps<Props>()

defineEmits<{
  start: []
  'set-duration': [duration: number]
}>()
</script>

<template>
  <div
    v-if="state === 'intro' || state === 'end'"
    class="fixed inset-0 z-20 flex items-center justify-center p-6 bg-radial from-background/90 to-background/98"
  >
    <div
      class="max-w-[520px] max-h-[90svh] space-y-4 px-8 py-12 bg-background/98 border rounded-3xl shadow-[0_20px_50px_rgba(0,_0,_0,_0.7)] overflow-y-auto"
    >
      <h1 v-if="state === 'intro'" class="text-2xl">twini Xmas</h1>
      <h1 v-else class="text-2xl">
        {{ won ? 'Oh oh oh... 🎅' : 'Oops... 😈' }}
      </h1>

      <div v-if="state === 'intro'" class="opacity-80 space-y-4">
        <p>
          Collectez un maximum de cadeaux 🎁, évitez les gremlins 😈 et terrassez Krampus 💀 avant
          la fin du chrono !
        </p>
        <p class="font-semibold">
          Plus vous collectez de cadeaux, plus vous débloquez de secrets de l'agence twini. (jusqu'à
          6 au total 🤯)
        </p>
      </div>

      <div v-else class="opacity-80 space-y-4">
        <p class="mb-4">
          Score : <strong>{{ score }}</strong> 🎁 - Meilleur score :
          <strong>{{ bestScore }}</strong> 🎁
          <span v-if="bossDefeated"> • Krampus vaincu 💀</span>
        </p>
      </div>

      <div v-if="state === 'intro'" class="space-y-4">
        <p class="text-muted">Mode de jeu :</p>
        <div class="flex flex-wrap gap-4">
          <button
            :class="[
              'flex-1 py-1 px-2 border rounded-full cursor-pointer',
              selectedDuration === 45 ? 'bg-accent' : 'bg-transparent',
            ]"
            @click="$emit('set-duration', 45)"
          >
            Classique · 45s
          </button>
          <button
            :class="[
              'flex-1 py-1 px-2 border rounded-full cursor-pointer',
              selectedDuration === 60 ? 'bg-accent' : 'bg-transparent',
            ]"
            @click="$emit('set-duration', 60)"
          >
            Score Attack · 60s
          </button>
        </div>
      </div>

      <div
        v-if="secrets.length"
        class="max-h-[400px] p-4 space-y-6 border border-emerald-500/30 bg-emerald-900/20 rounded-xl overflow-y-auto"
      >
        <h3
          class="text-sm font-semibold tracking-wide uppercase text-emerald-200 flex items-center gap-2"
        >
          <span class="h-px flex-1 bg-emerald-500/40"></span>
          <span
            >{{ secrets.length }} secret{{ secrets.length > 1 ? 's' : '' }} de l'agence débloqué{{
              secrets.length > 1 ? 's' : ''
            }}</span
          >
          <span class="h-px flex-1 bg-emerald-500/40"></span>
        </h3>

        <ul class="space-y-4">
          <li v-for="(s, i) in secrets" :key="i" class="text-sm">
            <span
              class="block space-y-1 px-4 py-2 rounded-xl bg-emerald-900/60 border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.35)]"
            >
              <span class="block text-xs uppercase tracking-widest text-emerald-300/80">
                Secret {{ i + 1 }}
              </span>
              <span class="block text-emerald-50">
                {{ s }}
              </span>
            </span>
          </li>
        </ul>
      </div>

      <div
        v-if="state === 'end' && !secrets.length"
        class="p-4 space-y-4 border bg-background/60 rounded-xl"
      >
        <h3>😪 Secrets non débloqués</h3>
        <p>
          Collectez plus de cadeaux pour révéler des secrets exclusifs de l'agence twini à la
          prochaine partie !
        </p>
      </div>

      <p class="my-6 text-sm text-muted">
        Clavier : ← → pour bouger, ↑ ou Espace pour sauter.<br />
        Mobile : boutons en bas de l'écran.
      </p>

      <div v-if="leaderboard.length" class="p-4 space-y-4 border bg-background/60 rounded-xl">
        <h3>🏅 Vos meilleurs scores</h3>

        <ol class="text-sm">
          <li v-for="(e, i) in leaderboard" :key="e.ts" class="flex items-center gap-2">
            <span class="text-muted">#{{ i + 1 }} -</span>
            <span>{{ e.score }} 🎁</span>
          </li>
        </ol>
      </div>

      <div class="mt-12 text-center">
        <button
          class="inline-flex py-2 px-4 text-center uppercase rounded-full bg-[linear-gradient(135deg,#6366f1,#ec4899)] text-[#f9fafb] shadow-[0_16px_32px_rgba(79,70,229,0.7)] cursor-pointer transition-all hover:-translate-y-1"
          @click="$emit('start')"
        >
          {{ state === 'intro' ? 'Lancer la partie' : 'Relancer une partie' }} 🎅
        </button>
      </div>
    </div>
  </div>
</template>
