<!--
  LineChart [F-20]: one series over time (trend). Plain SVG, 2px line,
  8px markers, recessive grid. Hover a point for its value.
-->
<script setup lang="ts">
import { computed } from 'vue'
import { axisLabelIndexes, niceMax, summarise, type Point } from '~/utils/chartScale'

const props = defineProps<{ title: string; points: Point[]; unit: string; labelHeader?: string }>()

const WIDTH = 340
const HEIGHT = 200
const PAD = { top: 14, right: 12, bottom: 30, left: 30 }
const plotW = WIDTH - PAD.left - PAD.right
const plotH = HEIGHT - PAD.top - PAD.bottom

const max = computed(() => niceMax(props.points.map((p) => p.value)))
const x = (i: number) => PAD.left + (props.points.length <= 1 ? plotW / 2 : (i / (props.points.length - 1)) * plotW)
const y = (v: number) => PAD.top + plotH - (v / max.value) * plotH
const path = computed(() => props.points.map((p, i) => `${x(i)},${y(p.value)}`).join(' '))
// Counts are whole numbers, so only whole-number ticks are drawn.
const ticks = computed(() => (Number.isInteger(max.value / 2) ? [0, max.value / 2, max.value] : [0, max.value]))
// Labelled points (no crowding at the ends, I-20).
const labelled = computed(() => new Set(axisLabelIndexes(props.points.length)))
const summary = computed(() => summarise(props.points, props.unit))
const rows = computed(() => props.points.map((p) => ({ label: p.label, value: String(p.value), amount: p.value })))
</script>

<template>
  <ChartsChartFrame :title="title" :summary="summary" :label-header="labelHeader ?? 'Period'" :value-header="unit" :rows="rows">
    <svg :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" class="line-chart" role="img" :aria-label="`${title}. ${summary}`">
      <g v-for="t in ticks" :key="t">
        <line :x1="PAD.left" :x2="WIDTH - PAD.right" :y1="y(t)" :y2="y(t)" class="line-chart__grid" />
        <text :x="PAD.left - 6" :y="y(t) + 4" text-anchor="end" class="line-chart__axis">{{ t }}</text>
      </g>
      <polyline :points="path" class="line-chart__line" />
      <g v-for="(p, i) in points" :key="p.label">
        <circle :cx="x(i)" :cy="y(p.value)" r="4" class="line-chart__dot"><title>{{ p.label }}: {{ p.value }} {{ unit }}</title></circle>
        <text v-if="labelled.has(i)" :x="x(i)" :y="HEIGHT - 10" text-anchor="middle" class="line-chart__axis">{{ p.label }}</text>
      </g>
    </svg>
  </ChartsChartFrame>
</template>

<style scoped>
.line-chart { width: 100%; height: auto; display: block; }
.line-chart__grid { stroke: var(--color-divider); stroke-width: 1; }
.line-chart__axis { font-size: 12px; fill: var(--color-text-soft); }
.line-chart__line { fill: none; stroke: var(--color-chart-single); stroke-width: 2; stroke-linejoin: round; }
.line-chart__dot { fill: var(--color-chart-single); stroke: var(--color-card); stroke-width: 2; }
</style>
