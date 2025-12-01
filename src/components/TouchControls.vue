<script setup lang="ts">
interface Props {
  show: boolean
}

interface TouchEvent {
  dir: 'left' | 'right' | 'jump'
  val: boolean
}

defineProps<Props>()

defineEmits<{
  touch: [event: TouchEvent]
}>()
</script>

<template>
  <div v-if="show" class="touch-controls">
    <button
      @touchstart.prevent="$emit('touch', { dir: 'left', val: true })"
      @touchend.prevent="$emit('touch', { dir: 'left', val: false })"
    >
      ◀
    </button>

    <button
      @touchstart.prevent="$emit('touch', { dir: 'jump', val: true })"
      @touchend.prevent="$emit('touch', { dir: 'jump', val: false })"
    >
      ⤴
    </button>

    <button
      @touchstart.prevent="$emit('touch', { dir: 'right', val: true })"
      @touchend.prevent="$emit('touch', { dir: 'right', val: false })"
    >
      ▶
    </button>
  </div>
</template>

<style scoped>
.touch-controls {
  position: absolute;
  bottom: env(safe-area-inset-bottom, 12px);
  left: 50%;
  transform: translateX(-50%);
  width: min(100%, 440px);
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  padding: 0 14px;
  z-index: 6;
  pointer-events: auto;
}

.touch-controls button {
  font-size: 1.2rem;
  padding: 0.55rem 0;
  background: rgba(15, 23, 42, 0.9);
  border-radius: 12px;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(6px);
  min-height: 44px;
}
</style>
