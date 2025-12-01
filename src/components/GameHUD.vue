<script setup lang="ts">
interface Props {
  timeLeft?: number
  score?: number
  bestScore?: number
  bossDefeated?: boolean
  muted?: boolean
}

defineProps<Props>()

defineEmits<{
  'toggle-mute': []
}>()
</script>

<template>
  <div class="hud hud-top">
    <div class="hud-pill">twini Xmas</div>
    <div class="hud-info">
      <span>⏱ {{ timeLeft }}s</span>
      <span>🎁 {{ score }}</span>
      <span>🏆 {{ bestScore }}</span>
      <span v-if="bossDefeated">💀 Krampus</span>

      <button class="mute-btn" @click="$emit('toggle-mute')">
        {{ muted ? '🔇' : '🔊' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.hud {
  position: absolute;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.85rem;
}

.hud-top {
  top: 10px;
  left: 14px;
}

.hud-pill {
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.7);
  font-size: 0.75rem;
  letter-spacing: 0.13em;
}

.hud-info {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.mute-btn {
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  background: rgba(15, 23, 42, 0.9);
  color: #e5e7eb;
  font-size: 0.75rem;
  cursor: pointer;
}
</style>
