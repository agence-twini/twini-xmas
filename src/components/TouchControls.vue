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
  <div
    v-if="show"
    class="controls absolute bottom-4 left-1/2 -translate-x-1/2 z-6 grid grid-cols-3 gap-4 w-[min(100%,_280px)] pointer-events-auto"
  >
    <button
      @touchstart.prevent="$emit('touch', { dir: 'left', val: true })"
      @touchend.prevent="$emit('touch', { dir: 'left', val: false })"
      class="px-4 py-1 bg-background/40 border rounded-xl min-h-[44px]"
    >
      ◀
    </button>

    <button
      @touchstart.prevent="$emit('touch', { dir: 'jump', val: true })"
      @touchend.prevent="$emit('touch', { dir: 'jump', val: false })"
      class="px-4 py-1 bg-background/40 border rounded-xl min-h-[44px]"
    >
      ⤴
    </button>

    <button
      @touchstart.prevent="$emit('touch', { dir: 'right', val: true })"
      @touchend.prevent="$emit('touch', { dir: 'right', val: false })"
      class="px-4 py-1 bg-background/40 border rounded-xl min-h-[44px]"
    >
      ▶
    </button>
  </div>
</template>
