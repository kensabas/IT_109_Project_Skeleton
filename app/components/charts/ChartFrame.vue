<!--
  ChartFrame: title, written summary, the chart, and its data table
  (plan D16: every chart comes with a table). Shared by the three charts.
-->
<script setup lang="ts">
defineProps<{ title: string; summary: string; labelHeader: string; valueHeader: string; rows: { label: string; value: string }[] }>()
</script>

<template>
  <figure class="chart">
    <figcaption class="chart__title">{{ title }}</figcaption>
    <p class="chart__summary">{{ summary }}</p>
    <slot />
    <details class="chart__table">
      <summary>Data table</summary>
      <table>
        <thead><tr><th scope="col">{{ labelHeader }}</th><th scope="col">{{ valueHeader }}</th></tr></thead>
        <tbody>
          <tr v-for="row in rows" :key="row.label"><th scope="row">{{ row.label }}</th><td>{{ row.value }}</td></tr>
        </tbody>
      </table>
    </details>
  </figure>
</template>

<style scoped>
.chart {
  margin: 0;
  background-color: var(--color-card);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card-lg);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.chart__title { font-size: 15px; font-weight: 700; color: var(--color-text); }
.chart__summary { margin: 0; font-size: 13px; color: var(--color-text-soft); }
.chart__table summary { cursor: pointer; font-size: 13px; font-weight: 600; color: var(--color-teal-dark); }
.chart__table table { margin-top: 8px; border-collapse: collapse; font-size: 13px; width: 100%; }
.chart__table th, .chart__table td { text-align: left; padding: 4px 8px; border-bottom: 1px solid var(--color-divider); font-variant-numeric: tabular-nums; }
.chart__table thead th { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-soft); }
@media print { .chart__table[open], .chart__table { display: block; } }
</style>
