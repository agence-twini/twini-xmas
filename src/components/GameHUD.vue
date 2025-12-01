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
  <div
    class="absolute top-4 inset-x-4 z-5 flex items-center justify-between gap-4 w-[calc(100%---spacing(8))] text-sm sm:text-base"
  >
    <div class="flex items-center gap-4">
      <span class="py-1 px-2 bg-background/90 border rounded-full">twini Xmas</span>
      <div class="flex items-center gap-2 sm:gap-4 py-1 px-2 bg-background/90 rounded-full">
        <span>⏱ {{ timeLeft }}s</span>
        <span>🎁 {{ score }}</span>
        <span>🏆 {{ bestScore }}</span>
        <span v-if="bossDefeated">💀 Krampus</span>
      </div>
    </div>

    <button
      class="size-7 bg-background/90 border rounded-full cursor-pointer sm:size-8"
      @click="$emit('toggle-mute')"
    >
      {{ muted ? '🔇' : '🔊' }}
    </button>
  </div>
</template>
