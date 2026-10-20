<!--
  SortableTable [F-08]: the shared "premium table" (SYSTEM_CONTEXT B.2).
  Every data column sorts with a header button; the <th> carries
  aria-sort. Empty values sort last. Wraps in a horizontal scroller so
  phones scroll the table, not the page. Custom cells via
  `#cell-<key>="{ row }"` slots. A column with `sortable: false` is
  only for row actions (buttons), never for data.
-->
<script setup lang="ts" generic="T">
import { computed, ref } from 'vue'
import { ariaSortFor, nextSort, sortRowsEmptyLast, type SortState } from '~/utils/sortRows'

export interface TableColumn<Row> {
  key: string
  label: string
  value: (row: Row) => unknown
  type?: 'text' | 'num' | 'date'
  sortable?: boolean
}

const props = withDefaults(
  defineProps<{
    columns: TableColumn<T>[]
    rows: T[]
    rowKey: (row: T) => string
    caption: string
    emptyText?: string
    initialSort?: SortState
    minWidth?: number
  }>(),
  { emptyText: 'Nothing to show.', initialSort: undefined, minWidth: 720 },
)

const sort = ref<SortState>(props.initialSort ?? { key: props.columns[0]?.key ?? '', direction: 'asc' })

const sortedRows = computed<T[]>(() => {
  const column = props.columns.find((c) => c.key === sort.value.key)
  if (!column || column.sortable === false) return props.rows
  return sortRowsEmptyLast(props.rows, column.value, sort.value.direction)
})

function onSort(key: string) {
  sort.value = nextSort(sort.value, key)
}

function cellClass(column: TableColumn<T>): string | undefined {
  if (column.type === 'num') return 'sortable__num'
  if (column.type === 'date') return 'sortable__date'
  return undefined
}

function display(value: unknown): string {
  return value === null || value === undefined ? '' : String(value)
}
</script>

<template>
  <section class="sortable">
    <div class="sortable__scroll">
      <table class="sortable__table" :style="{ minWidth: `${minWidth}px` }">
        <caption class="visually-hidden">{{ caption }} Column headers are buttons that sort the table.</caption>
        <thead>
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              :aria-sort="column.sortable === false ? undefined : ariaSortFor(sort, column.key)"
            >
              <button
                v-if="column.sortable !== false"
                type="button"
                class="sortable__sort"
                :class="{ 'sortable__sort--active': sort.key === column.key }"
                @click="onSort(column.key)"
              >
                <span>{{ column.label }}</span>
                <span class="sortable__arrow" aria-hidden="true">
                  {{ sort.key !== column.key ? '↕' : sort.direction === 'asc' ? '▲' : '▼' }}
                </span>
              </button>
              <span v-else class="sortable__plain">{{ column.label }}</span>
            </th>
          </tr>
        </thead>
        <tbody v-if="sortedRows.length">
          <tr v-for="row in sortedRows" :key="rowKey(row)">
            <td v-for="column in columns" :key="column.key" :class="cellClass(column)">
              <slot :name="`cell-${column.key}`" :row="row">{{ display(column.value(row)) }}</slot>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td :colspan="columns.length" class="sortable__empty">
              <slot name="empty">{{ emptyText }}</slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.sortable {
  background-color: var(--color-card);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card-lg);
  overflow: hidden;
}
.sortable__scroll { overflow-x: auto; }
.sortable__table { width: 100%; border-collapse: collapse; font-size: 14px; }

.sortable__table thead th {
  position: relative;
  background-color: var(--color-table-head-bg);
  border-bottom: 1px solid var(--color-card-border);
  text-align: left;
  padding: 0;
  color: var(--color-text-soft);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.sortable__table thead th[aria-sort='ascending']::after,
.sortable__table thead th[aria-sort='descending']::after {
  content: '';
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: -1px;
  height: 2px;
  background-color: var(--color-teal);
  border-radius: 2px;
}
.sortable__sort {
  all: unset;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 14px 16px;
  width: 100%;
  cursor: pointer;
  font: inherit;
  color: inherit;
  text-transform: inherit;
  letter-spacing: inherit;
  white-space: nowrap;
}
.sortable__sort:hover { color: var(--color-text); }
.sortable__sort:focus-visible { outline: 2px solid var(--color-teal); outline-offset: -2px; }
.sortable__sort--active { color: var(--color-teal-dark); }
.sortable__arrow { font-size: 10px; color: var(--color-text-soft); }
.sortable__sort--active .sortable__arrow { color: var(--color-teal); }
.sortable__plain { display: block; padding: 14px 16px; }

.sortable__table tbody td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-divider);
  color: var(--color-text);
  vertical-align: middle;
  transition: background-color 120ms ease;
}
.sortable__table tbody tr:last-child td { border-bottom: none; }
/* The first column usually names the row (job, request, person); keep it
 * readable on phones instead of a few words per line (I-33). */
.sortable__table tbody td:first-child { min-width: 170px; }
.sortable__table tbody tr:nth-child(even) td { background-color: var(--color-row-stripe); }
.sortable__table tbody tr:hover td,
.sortable__table tbody tr:focus-within td { background-color: var(--color-row-hover); }

.sortable__num,
.sortable__date {
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum';
  white-space: nowrap;
}
/* Same specificity as the body-cell rule above, so the soft colour wins (B.2 rule 12). */
.sortable__table tbody td.sortable__empty { padding: 48px 16px; text-align: center; color: var(--color-text-soft); }
</style>
