<!--
  CalendarMonth [F-07]: month view plus a list of the same events
  (plan D8, Q16 unconfirmed). Previous / next month buttons, today is
  marked with text (not colour only), events are links. On phones the
  grid shows event counts and the list below carries the details.
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { eventsInMonth, isoToday, monthGrid, monthTitle, shiftMonth, type MonthRef } from '~/utils/dates'
import { formatDateShort, formatTime12h } from '~/utils/format'
import type { StatusKind } from '~/utils/statusMeta'

export interface CalendarEvent {
  id: string
  date: string
  time?: string
  title: string
  to: string
  statusKind?: StatusKind
  statusValue?: string
}

const props = defineProps<{
  events: CalendarEvent[]
  initialMonth?: MonthRef
  today?: string
}>()

const todayIso = computed(() => props.today ?? isoToday())
const startRef = (): MonthRef => {
  if (props.initialMonth) return props.initialMonth
  const [year, month] = todayIso.value.split('-').map((part) => parseInt(part, 10))
  return { year, month: month - 1 }
}
const shown = ref<MonthRef>(startRef())

const weeks = computed(() => monthGrid(shown.value.year, shown.value.month))
const title = computed(() => monthTitle(shown.value.year, shown.value.month))
const monthEvents = computed(() => eventsInMonth(props.events, shown.value.year, shown.value.month))

function eventsOn(iso: string): CalendarEvent[] {
  return monthEvents.value.filter((event) => event.date === iso)
}

const WEEKDAYS = [
  { short: 'Sun', long: 'Sunday' },
  { short: 'Mon', long: 'Monday' },
  { short: 'Tue', long: 'Tuesday' },
  { short: 'Wed', long: 'Wednesday' },
  { short: 'Thu', long: 'Thursday' },
  { short: 'Fri', long: 'Friday' },
  { short: 'Sat', long: 'Saturday' },
]
</script>

<template>
  <section class="calendar" aria-labelledby="calendar-title">
    <div class="calendar__bar">
      <button type="button" class="btn btn--secondary btn--small" @click="shown = shiftMonth(shown, -1)">
        <span aria-hidden="true">←</span> Previous month
      </button>
      <h2 id="calendar-title" class="calendar__title" aria-live="polite">{{ title }}</h2>
      <button type="button" class="btn btn--secondary btn--small" @click="shown = shiftMonth(shown, 1)">
        Next month <span aria-hidden="true">→</span>
      </button>
    </div>

    <div class="calendar__scroll">
      <table class="calendar__grid">
        <caption class="visually-hidden">{{ title }}. The same events are listed below the calendar.</caption>
        <thead>
          <tr>
            <th v-for="day in WEEKDAYS" :key="day.short" scope="col">
              <abbr :title="day.long">{{ day.short }}</abbr>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(week, index) in weeks" :key="index">
            <td
              v-for="cell in week"
              :key="cell.iso"
              class="calendar__cell"
              :class="{ 'calendar__cell--outside': !cell.inMonth, 'calendar__cell--today': cell.iso === todayIso }"
              :aria-current="cell.iso === todayIso ? 'date' : undefined"
            >
              <span class="calendar__day">
                {{ cell.day }}<span v-if="cell.iso === todayIso" class="calendar__today-label"> Today</span>
              </span>
              <ul v-if="cell.inMonth && eventsOn(cell.iso).length" class="calendar__events">
                <li v-for="event in eventsOn(cell.iso)" :key="event.id">
                  <NuxtLink :to="event.to" class="calendar__event">
                    <span v-if="event.time" class="calendar__event-time">{{ formatTime12h(event.time) }}</span>
                    {{ event.title }}
                  </NuxtLink>
                </li>
              </ul>
              <span v-if="cell.inMonth && eventsOn(cell.iso).length" class="calendar__count" aria-hidden="true">
                {{ eventsOn(cell.iso).length }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="calendar__list">
      <h3 class="calendar__list-title">Events in {{ title }}</h3>
      <ul v-if="monthEvents.length" class="calendar__list-items">
        <li v-for="event in monthEvents" :key="event.id" class="calendar__list-item">
          <span class="calendar__list-date">
            {{ formatDateShort(event.date) }}<template v-if="event.time">, {{ formatTime12h(event.time) }}</template>
          </span>
          <NuxtLink :to="event.to" class="link">{{ event.title }}</NuxtLink>
          <StatusBadge v-if="event.statusKind && event.statusValue" :kind="event.statusKind" :value="event.statusValue" />
        </li>
      </ul>
      <p v-else class="muted">No events this month.</p>
    </div>
  </section>
</template>

<style scoped>
.calendar {
  background-color: var(--color-card);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card-lg);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.calendar__bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; }
.calendar__title { margin: 0; font-size: 20px; font-weight: 800; color: var(--color-text); }
.calendar__scroll { overflow-x: auto; }
.calendar__grid { width: 100%; border-collapse: collapse; table-layout: fixed; }
.calendar__grid th {
  padding: 8px 4px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-soft);
  background-color: var(--color-table-head-bg);
}
.calendar__grid abbr { text-decoration: none; }
.calendar__cell {
  height: 104px;
  vertical-align: top;
  padding: 6px;
  border: 1px solid var(--color-divider);
}
.calendar__cell--outside { background-color: var(--color-row-stripe); }
.calendar__cell--outside .calendar__day { color: var(--color-text-soft); }
.calendar__cell--today { box-shadow: inset 0 0 0 2px var(--color-teal); }
.calendar__day { font-size: 13px; font-weight: 700; color: var(--color-text); font-variant-numeric: tabular-nums; }
.calendar__today-label { font-size: 11px; font-weight: 700; color: var(--color-teal-dark); text-transform: uppercase; }
.calendar__events { list-style: none; margin: 4px 0 0; padding: 0; display: flex; flex-direction: column; gap: 3px; }
.calendar__event {
  display: block;
  padding: 2px 6px;
  font-size: 12px;
  line-height: 1.3;
  color: var(--color-tone-teal-fg);
  background-color: var(--color-tone-teal-bg);
  border-radius: 6px;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.calendar__event:hover { text-decoration: underline; }
.calendar__event-time { font-weight: 700; }
.calendar__count { display: none; }

.calendar__list-title { margin: 0 0 8px; font-size: 15px; font-weight: 700; color: var(--color-text); }
.calendar__list-items { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
.calendar__list-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 14px;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-divider);
  font-size: 14px;
}
.calendar__list-item:last-child { border-bottom: none; }
.calendar__list-date { min-width: 190px; color: var(--color-text-soft); font-variant-numeric: tabular-nums; }

@media (max-width: 640px) {
  .calendar { padding: 12px; }
  .calendar__cell { height: 56px; padding: 4px; }
  .calendar__events { display: none; }
  .calendar__today-label { display: none; }
  .calendar__count {
    display: inline-block;
    margin-top: 4px;
    min-width: 20px;
    padding: 0 6px;
    font-size: 11px;
    font-weight: 700;
    text-align: center;
    color: var(--color-tone-teal-fg);
    background-color: var(--color-tone-teal-bg);
    border-radius: 999px;
  }
}
</style>
