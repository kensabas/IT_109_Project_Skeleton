<!--
  ChartFrame: title, written summary, the chart, and its data table
  (plan D16: every chart comes with a table). The table is the shared
  SortableTable, so it follows the approved table pattern (B.2) and can be
  sorted like every other table (F-08).
-->
<script setup lang="ts">
import type { TableColumn } from '~/components/SortableTable.vue'

export interface ChartRow { label: string; value: string; amount: number }

const props = defineProps<{ title: string; summary: string; labelHeader: string; valueHeader: string; rows: ChartRow[] }>()

const columns: TableColumn<ChartRow>[] = [
  { key: 'label', label: props.labelHeader, value: (r) => r.label },
  { key: 'value', label: props.valueHeader, value: (r) => r.amount, type: 'num' },
]
</script>

<template>
  <figure class="chart">
    <figcaption class="chart__title">{{ title }}</figcaption>
    <p class="chart__summary">{{ summary }}</p>
    <slot />
    <details class="chart__table">
      <summary>Data table</summary>
      <SortableTable
        :columns="columns"
        :rows="rows"
        :row-key="(r) => r.label"
        :caption="`${title}: data table.`"
        :initial-sort="{ key: 'none', direction: 'asc' }"
        :min-width="240"
      >
        <template #cell-value="{ row }">{{ row.value }}</template>
      </SortableTable>
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
.chart__table summary { cursor: pointer; font-size: 13px; font-weight: 600; color: var(--color-teal-dark); margin-bottom: 8px; }
</style>
