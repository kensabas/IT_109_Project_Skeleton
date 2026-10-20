<!--
  DonutChart [F-20]: shares of a whole (for example job posts by status).
  Up to four slices in the validated colour order, 2px gaps between
  slices, total in the middle, and a text legend with counts and shares
  so colour is never the only way to tell slices apart.
-->
<script setup lang="ts">
import { computed } from 'vue'
import { summarise, type Point } from '~/utils/chartScale'

const props = defineProps<{ title: string; points: Point[]; unit: string; labelHeader?: string }>()

const SLOT_COLOURS = ['var(--color-chart-1)', 'var(--color-chart-2)', 'var(--color-chart-3)', 'var(--color-chart-4)']
const RADIUS = 60
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const GAP = 2

const total = computed(() => props.points.reduce((sum, p) => sum + p.value, 0))
const slices = computed(() => {
  let offset = 0
  return props.points.map((p, i) => {
    const length = total.value ? (p.value / total.value) * CIRCUMFERENCE : 0
    const slice = { ...p, colour: SLOT_COLOURS[i % SLOT_COLOURS.length], dash: `${Math.max(length - GAP, 0)} ${CIRCUMFERENCE}`, offset: -offset }
    offset += length
    return slice
  })
})
const share = (v: number) => (total.value ? Math.round((v / total.value) * 100) : 0)
const summary = computed(() => summarise(props.points, props.unit))
const rows = computed(() => props.points.map((p) => ({ label: p.label, value: `${p.value} (${share(p.value)}%)`, amount: p.value })))
</script>

<template>
  <ChartsChartFrame :title="title" :summary="summary" :label-header="labelHeader ?? 'Part'" :value-header="unit" :rows="rows">
    <div class="donut">
      <svg viewBox="0 0 160 160" class="donut__svg" role="img" :aria-label="`${title}. ${summary}`">
        <circle cx="80" cy="80" :r="RADIUS" class="donut__track" />
        <circle
          v-for="s in slices"
          v-show="s.value > 0"
          :key="s.label"
          cx="80" cy="80" :r="RADIUS"
          class="donut__slice"
          :stroke="s.colour"
          :stroke-dasharray="s.dash"
          :stroke-dashoffset="s.offset"
          transform="rotate(-90 80 80)"
        ><title>{{ s.label }}: {{ s.value }} ({{ share(s.value) }}%)</title></circle>
        <text x="80" y="78" text-anchor="middle" class="donut__total">{{ total }}</text>
        <text x="80" y="96" text-anchor="middle" class="donut__unit">{{ unit }}</text>
      </svg>
      <ul class="donut__legend">
        <li v-for="s in slices" :key="s.label">
          <span class="donut__swatch" :style="{ backgroundColor: s.colour }" aria-hidden="true"></span>
          {{ s.label }}: <strong>{{ s.value }}</strong> ({{ share(s.value) }}%)
        </li>
      </ul>
    </div>
  </ChartsChartFrame>
</template>

<style scoped>
.donut { display: flex; flex-wrap: wrap; align-items: center; gap: 16px; }
.donut__svg { width: 160px; height: 160px; flex-shrink: 0; }
.donut__track { fill: none; stroke: var(--color-divider); stroke-width: 22; }
.donut__slice { fill: none; stroke-width: 22; }
.donut__total { font-size: 26px; font-weight: 800; fill: var(--color-text); }
.donut__unit { font-size: 11px; fill: var(--color-text-soft); }
.donut__legend { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; font-size: 14px; color: var(--color-text); }
.donut__swatch { display: inline-block; width: 12px; height: 12px; border-radius: 3px; margin-right: 6px; vertical-align: -1px; }
</style>
