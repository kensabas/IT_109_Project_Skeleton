<!--
  BarChart [F-20]: compare categories (horizontal bars, so long labels
  fit on phones). One colour; value printed at the end of each bar.
-->
<script setup lang="ts">
import { computed } from 'vue'
import { niceMax, summarise, type Point } from '~/utils/chartScale'

const props = defineProps<{ title: string; points: Point[]; unit: string; labelHeader?: string }>()

const WIDTH = 340
const ROW = 30
const LABEL_W = 110
const VALUE_W = 30
const height = computed(() => Math.max(1, props.points.length) * ROW + 8)
const max = computed(() => niceMax(props.points.map((p) => p.value)))
const barW = (v: number) => (v / max.value) * (WIDTH - LABEL_W - VALUE_W)
const summary = computed(() => summarise(props.points, props.unit))
const rows = computed(() => props.points.map((p) => ({ label: p.label, value: String(p.value), amount: p.value })))
</script>

<template>
  <ChartsChartFrame :title="title" :summary="summary" :label-header="labelHeader ?? 'Item'" :value-header="unit" :rows="rows">
    <p v-if="!points.length" class="muted">Nothing to show.</p>
    <svg v-else :viewBox="`0 0 ${WIDTH} ${height}`" class="bar-chart" role="img" :aria-label="`${title}. ${summary}`">
      <g v-for="(p, i) in points" :key="p.label" :transform="`translate(0 ${i * ROW + 4})`">
        <text :x="LABEL_W - 8" y="17" text-anchor="end" class="bar-chart__label">{{ p.label }}</text>
        <rect :x="LABEL_W" y="4" :width="Math.max(barW(p.value), 2)" height="18" rx="4" class="bar-chart__bar">
          <title>{{ p.label }}: {{ p.value }} {{ unit }}</title>
        </rect>
        <text :x="LABEL_W + Math.max(barW(p.value), 2) + 6" y="17" class="bar-chart__value">{{ p.value }}</text>
      </g>
    </svg>
  </ChartsChartFrame>
</template>

<style scoped>
.bar-chart { width: 100%; height: auto; display: block; }
.bar-chart__label { font-size: 13px; fill: var(--color-text); }
.bar-chart__value { font-size: 13px; font-weight: 700; fill: var(--color-text); }
.bar-chart__bar { fill: var(--color-chart-single); }
</style>
