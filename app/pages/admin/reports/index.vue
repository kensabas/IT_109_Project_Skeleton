<!--
  /admin/reports [F-20, F-20a] — reports (Wave 5). Tabs: Admin analytics,
  Cleaners, Clients. Filters: period (daily / monthly / quarterly / yearly)
  and date, area, role, job status. Output: on screen, CSV download, and
  print / save as PDF through the browser (plan D15, Q19 unconfirmed).
  Every number is counted from the mock data (app/utils/reports.ts).
-->
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useCurrentUserStore } from '~/stores/currentUser'
import { useRequestsStore } from '~/stores/requests'
import { useJobsStore } from '~/stores/jobs'
import { useApplicationsStore } from '~/stores/applications'
import { useDocumentsStore } from '~/stores/documents'
import { useDisputesStore } from '~/stores/disputes'
import { JOB_STATUSES, type JobStatus } from '~/data/mockJobs'
import type { UserRole } from '~/data/mockUsers'
import type { TableColumn } from '~/components/SortableTable.vue'
import {
  PERIOD_KINDS, periodFor, previousPeriod, requestCounts, jobStatusCounts, fillRate, applicationsPerPost,
  cancellationRate, missedRate, registrations, pendingApprovals, accountsByState, disputeCounts,
  demandByArea, demandByWeekday, compare, trendSeries, type PeriodKind,
} from '~/utils/reports'
import { buildHighlights, cleanerReportRows, clientReportRows, toCsv } from '~/utils/reportTables'
import { isoToday } from '~/utils/dates'
import { formatDateTime } from '~/utils/format'
import { statusLabel } from '~/utils/statusMeta'
import { APPROVAL_STATUS_LABEL, ACCOUNT_STATE_LABEL } from '~/utils/labels'

definePageMeta({ layout: 'app' })

const users = useCurrentUserStore()
const requestsStore = useRequestsStore()
const jobsStore = useJobsStore()
const applicationsStore = useApplicationsStore()
const documentsStore = useDocumentsStore()
const disputesStore = useDisputesStore()

// ---- Filters ----------------------------------------------------------
const kind = ref<PeriodKind>('monthly')
const anchor = ref(isoToday())
const area = ref('')
const role = ref<UserRole | ''>('')
const jobStatus = ref<JobStatus | ''>('')
const PERIOD_LABEL: Record<PeriodKind, string> = { daily: 'Daily', monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly' }

const period = computed(() => periodFor(kind.value, anchor.value || isoToday()))
const previous = computed(() => previousPeriod(period.value))
const generatedAt = ref(new Date().toISOString())

const areas = computed(() => [...new Set([...requestsStore.requests.map((r) => r.city), ...jobsStore.jobs.map((j) => j.city)])].sort())
const requests = computed(() => requestsStore.requests.filter((r) => !area.value || r.city === area.value))
const jobs = computed(() => jobsStore.jobs.filter((j) => (!area.value || j.city === area.value) && (!jobStatus.value || j.status === jobStatus.value)))
const people = computed(() => users.users.filter((u) => !role.value || u.role === role.value))

// ---- Admin analytics ---------------------------------------------------
const reqNow = computed(() => requestCounts(requests.value, period.value))
const reqBefore = computed(() => requestCounts(requests.value, previous.value))
const fill = computed(() => fillRate(jobs.value, period.value))
const disputesNow = computed(() => disputeCounts(disputesStore.disputes, period.value))
const disputesBefore = computed(() => disputeCounts(disputesStore.disputes, previous.value))
const regNow = computed(() => registrations(people.value, period.value))
const regBefore = computed(() => registrations(people.value, previous.value))

const percent = (value: number | null) => (value === null ? 'No data' : `${Math.round(value * 100)}%`)
const decimal = (value: number | null) => (value === null ? 'No data' : value.toFixed(1))

const cards = computed(() => [
  { label: 'Requests received', value: String(reqNow.value.received), change: compare(reqNow.value.received, reqBefore.value.received) },
  { label: 'Requests approved', value: String(reqNow.value.approved), change: compare(reqNow.value.approved, reqBefore.value.approved) },
  { label: 'Fill rate', value: percent(fill.value.rate), note: `${fill.value.filled} of ${fill.value.total} posts have a cleaner` },
  { label: 'Missed rate', value: percent(missedRate(jobs.value, period.value)) },
  { label: 'Request cancellation rate', value: percent(cancellationRate(requests.value, period.value)) },
  { label: 'Applications per post', value: decimal(applicationsPerPost(applicationsStore.applications, jobs.value, period.value)) },
  { label: 'New registrations', value: String(regNow.value.total), change: compare(regNow.value.total, regBefore.value.total) },
  { label: 'Cleaners waiting for approval', value: String(pendingApprovals(people.value)), note: 'Right now' },
  { label: 'Disputes opened / resolved', value: `${disputesNow.value.opened} / ${disputesNow.value.resolved}` },
])

function changeText(change: { change: number; changePercent: number | null }): string {
  if (change.change === 0) return `No change from ${previous.value.label}`
  const sign = change.change > 0 ? '+' : ''
  const pct = change.changePercent === null ? '' : ` (${sign}${change.changePercent}%)`
  return `${sign}${change.change}${pct} vs ${previous.value.label}`
}

const highlights = computed(() =>
  buildHighlights({
    periodLabel: period.value.label,
    previousLabel: previous.value.label,
    requests: { current: reqNow.value.received, previous: reqBefore.value.received },
    fill: { filled: fill.value.filled, total: fill.value.total },
    missed: jobStatusCounts(jobs.value, period.value).missed,
    pendingApprovals: pendingApprovals(people.value),
    disputesOpened: { current: disputesNow.value.opened, previous: disputesBefore.value.opened },
  }),
)

const trend = computed(() => trendSeries(requests.value, (r) => r.createdAt, period.value).map((p) => ({ label: p.label, value: p.count })))
const statusShare = computed(() => {
  const counts = jobStatusCounts(jobs.value, period.value)
  return JOB_STATUSES.map((s) => ({ label: statusLabel('job', s), value: counts[s] }))
})
const byArea = computed(() => demandByArea(requests.value, period.value).map((d) => ({ label: d.area, value: d.count })))
const byWeekday = computed(() => demandByWeekday(requests.value, period.value).map((d) => ({ label: d.day, value: d.count })))
const byState = computed(() => {
  const counts = accountsByState(people.value)
  return (['activated', 'deactivated', 'suspended'] as const).map((s) => ({ label: ACCOUNT_STATE_LABEL[s], value: counts[s] }))
})

interface ComparisonRow { metric: string; current: number; previous: number; change: number }
const comparison = computed<ComparisonRow[]>(() => {
  const row = (metric: string, current: number, before: number) => ({ metric, current, previous: before, change: current - before })
  const jobsNow = jobStatusCounts(jobs.value, period.value)
  const jobsBefore = jobStatusCounts(jobs.value, previous.value)
  return [
    row('Requests received', reqNow.value.received, reqBefore.value.received),
    row('Requests approved', reqNow.value.approved, reqBefore.value.approved),
    row('Requests rejected', reqNow.value.rejected, reqBefore.value.rejected),
    row('Requests cancelled', reqNow.value.cancelled, reqBefore.value.cancelled),
    ...JOB_STATUSES.map((s) => row(`Job posts: ${statusLabel('job', s)}`, jobsNow[s], jobsBefore[s])),
    row('New clients', regNow.value.clients, regBefore.value.clients),
    row('New cleaners', regNow.value.cleaners, regBefore.value.cleaners),
    row('Disputes opened', disputesNow.value.opened, disputesBefore.value.opened),
    row('Disputes resolved', disputesNow.value.resolved, disputesBefore.value.resolved),
  ]
})
const comparisonColumns: TableColumn<ComparisonRow>[] = [
  { key: 'metric', label: 'Figure', value: (r) => r.metric },
  { key: 'current', label: 'This period', value: (r) => r.current, type: 'num' },
  { key: 'previous', label: 'Previous period', value: (r) => r.previous, type: 'num' },
  { key: 'change', label: 'Change', value: (r) => r.change, type: 'num' },
]

// ---- Cleaner and client reports ---------------------------------------
const cleanerRows = computed(() =>
  cleanerReportRows({ users: people.value, documents: documentsStore.documents, applications: applicationsStore.applications, jobs: jobs.value }, period.value),
)
type CleanerRow = (typeof cleanerRows.value)[number]
const cleanerColumns: TableColumn<CleanerRow>[] = [
  { key: 'name', label: 'Cleaner', value: (r) => r.name },
  { key: 'approval', label: 'Approval', value: (r) => r.approvalStatus },
  { key: 'state', label: 'Account', value: (r) => r.accountState },
  { key: 'docs', label: 'Documents approved', value: (r) => r.documentsApproved, type: 'num' },
  { key: 'applied', label: 'Applied', value: (r) => r.applied, type: 'num' },
  { key: 'accepted', label: 'Accepted', value: (r) => r.accepted, type: 'num' },
  { key: 'declined', label: 'Declined', value: (r) => r.declined, type: 'num' },
  { key: 'cancelled', label: 'Cancelled', value: (r) => r.cancelled, type: 'num' },
  { key: 'scheduled', label: 'Scheduled', value: (r) => r.scheduled, type: 'num' },
  { key: 'inProgress', label: 'In progress', value: (r) => r.inProgress, type: 'num' },
  { key: 'completed', label: 'Completed', value: (r) => r.completed, type: 'num' },
  { key: 'missed', label: 'Missed', value: (r) => r.missed, type: 'num' },
  { key: 'areas', label: 'Areas worked', value: (r) => r.areas },
]
const clientRows = computed(() => clientReportRows({ users: people.value, requests: requests.value, jobs: jobs.value }, period.value))
type ClientRow = (typeof clientRows.value)[number]
const clientColumns: TableColumn<ClientRow>[] = [
  { key: 'name', label: 'Client', value: (r) => r.name },
  { key: 'type', label: 'Type', value: (r) => r.clientType },
  { key: 'requests', label: 'Requests', value: (r) => r.requests, type: 'num' },
  { key: 'approved', label: 'Approved', value: (r) => r.approved, type: 'num' },
  { key: 'rejected', label: 'Rejected', value: (r) => r.rejected, type: 'num' },
  { key: 'cancelled', label: 'Cancelled', value: (r) => r.cancelled, type: 'num' },
  { key: 'pending', label: 'Pending', value: (r) => r.pending, type: 'num' },
  { key: 'jobs', label: 'Jobs', value: (r) => r.jobs, type: 'num' },
  { key: 'withCleaner', label: 'Jobs with a cleaner', value: (r) => r.jobsWithCleaner, type: 'num' },
  { key: 'repeat', label: 'Repeat client', value: (r) => r.repeatClient },
]

// ---- Tabs (ARIA tabs pattern: arrow keys move between tabs) -------------
const TABS = [
  { id: 'admin', label: 'Admin analytics' },
  { id: 'cleaners', label: 'Cleaners' },
  { id: 'clients', label: 'Clients' },
] as const
type TabId = (typeof TABS)[number]['id']
const tab = ref<TabId>('admin')
async function onTabKey(event: KeyboardEvent, index: number) {
  const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
  if (!step) return
  event.preventDefault()
  const next = TABS[(index + step + TABS.length) % TABS.length]
  tab.value = next.id
  await nextTick()
  document.getElementById(`tab-${next.id}`)?.focus()
}

// ---- Output ---------------------------------------------------------------
function download() {
  generatedAt.value = new Date().toISOString()
  let csv: string
  if (tab.value === 'admin') {
    csv = toCsv(['Figure', `This period (${period.value.label})`, `Previous period (${previous.value.label})`, 'Change'], comparison.value.map((r) => [r.metric, r.current, r.previous, r.change]))
  } else if (tab.value === 'cleaners') {
    csv = toCsv(cleanerColumns.map((c) => c.label), cleanerRows.value.map((r) => [r.name, APPROVAL_STATUS_LABEL[r.approvalStatus as keyof typeof APPROVAL_STATUS_LABEL], ACCOUNT_STATE_LABEL[r.accountState as keyof typeof ACCOUNT_STATE_LABEL], r.documentsApproved, r.applied, r.accepted, r.declined, r.cancelled, r.scheduled, r.inProgress, r.completed, r.missed, r.areas]))
  } else {
    csv = toCsv(clientColumns.map((c) => c.label), clientRows.value.map((r) => [r.name, r.clientType, r.requests, r.approved, r.rejected, r.cancelled, r.pending, r.jobs, r.jobsWithCleaner, r.repeatClient]))
  }
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `cleanlinis-${tab.value}-report-${period.value.start}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}
// Printing (button or Ctrl+P): open every chart data table so the
// printout carries the numbers too, then put them back (I-26).
let closedBeforePrint: HTMLDetailsElement[] = []
function openTablesForPrint() {
  // Adds to the list, so a second beforeprint event does not forget them.
  const closed = [...document.querySelectorAll<HTMLDetailsElement>('details.chart__table:not([open])')]
  closedBeforePrint.push(...closed)
  for (const details of closed) details.open = true
}
function restoreTablesAfterPrint() {
  for (const details of closedBeforePrint) details.open = false
  closedBeforePrint = []
}
onMounted(() => {
  window.addEventListener('beforeprint', openTablesForPrint)
  window.addEventListener('afterprint', restoreTablesAfterPrint)
})
onBeforeUnmount(() => {
  window.removeEventListener('beforeprint', openTablesForPrint)
  window.removeEventListener('afterprint', restoreTablesAfterPrint)
})

function printReport() {
  generatedAt.value = new Date().toISOString()
  window.print()
}
</script>

<template>
  <div class="page-stack reports">
    <PageHeader title="Reports" subtitle="Figures counted from the CleanLinis data for the chosen period.">
      <template #actions>
        <button type="button" class="btn btn--secondary no-print" @click="download">Download CSV</button>
        <button type="button" class="btn btn--secondary no-print" @click="printReport">Print or save as PDF</button>
      </template>
    </PageHeader>

    <section class="filters card no-print" aria-label="Report filters">
      <div class="field">
        <label for="report-kind" class="field__label">Period</label>
        <select id="report-kind" v-model="kind" class="field__input">
          <option v-for="k in PERIOD_KINDS" :key="k" :value="k">{{ PERIOD_LABEL[k] }}</option>
        </select>
      </div>
      <div class="field">
        <label for="report-date" class="field__label">Any date in the period</label>
        <input id="report-date" v-model="anchor" type="date" class="field__input" />
      </div>
      <div class="field">
        <label for="report-area" class="field__label">Area (city)</label>
        <select id="report-area" v-model="area" class="field__input">
          <option value="">All areas</option>
          <option v-for="a in areas" :key="a" :value="a">{{ a }}</option>
        </select>
      </div>
      <div class="field">
        <label for="report-role" class="field__label">Role (accounts and registrations)</label>
        <select id="report-role" v-model="role" class="field__input">
          <option value="">All roles</option>
          <option value="client">Clients</option>
          <option value="cleaner">Cleaners</option>
          <option value="admin">Admins</option>
        </select>
      </div>
      <div class="field">
        <label for="report-status" class="field__label">Job status</label>
        <select id="report-status" v-model="jobStatus" class="field__input">
          <option value="">All statuses</option>
          <option v-for="s in JOB_STATUSES" :key="s" :value="s">{{ statusLabel('job', s) }}</option>
        </select>
      </div>
    </section>

    <p class="report-meta">
      <strong>Period: {{ period.label }}</strong> ({{ period.start }} to {{ period.end }}) · compared with {{ previous.label }} ·
      generated {{ formatDateTime(generatedAt) }}<span v-if="area"> · area: {{ area }}</span><span v-if="role"> · role: {{ role }}</span><span v-if="jobStatus"> · job status: {{ statusLabel('job', jobStatus) }}</span>
    </p>

    <div role="tablist" aria-label="Report" class="tabs no-print">
      <button
        v-for="(t, i) in TABS"
        :id="`tab-${t.id}`"
        :key="t.id"
        type="button"
        role="tab"
        class="tabs__tab"
        :aria-selected="tab === t.id ? 'true' : 'false'"
        :aria-controls="`panel-${t.id}`"
        :tabindex="tab === t.id ? 0 : -1"
        @click="tab = t.id"
        @keydown="onTabKey($event, i)"
      >
        {{ t.label }}
      </button>
    </div>

    <section v-if="tab === 'admin'" id="panel-admin" role="tabpanel" aria-labelledby="tab-admin" class="page-stack" tabindex="0">
      <h2 class="section-title">Admin analytics</h2>
      <ul class="cards">
        <li v-for="c in cards" :key="c.label" class="stat">
          <p class="stat__label">{{ c.label }}</p>
          <p class="stat__value">{{ c.value }}</p>
          <p v-if="c.change" class="stat__note">{{ changeText(c.change) }}</p>
          <p v-else-if="c.note" class="stat__note">{{ c.note }}</p>
        </li>
      </ul>

      <section class="card" aria-labelledby="highlights-title">
        <h3 id="highlights-title" class="card__title">Highlights</h3>
        <ul class="highlights"><li v-for="line in highlights" :key="line">{{ line }}</li></ul>
      </section>

      <div class="charts">
        <ChartsLineChart :title="`Requests received (${period.kind === 'daily' ? 'last 7 days' : period.label})`" :points="trend" unit="requests" label-header="Day or month" />
        <ChartsDonutChart title="Job posts by status (by job date)" :points="statusShare" unit="job posts" label-header="Status" />
        <ChartsBarChart title="Demand by area (requests received)" :points="byArea" unit="requests" label-header="Area" />
        <ChartsBarChart title="Demand by day of the week (requested date)" :points="byWeekday" unit="requests" label-header="Day" />
        <ChartsBarChart title="Accounts by state (right now)" :points="byState" unit="accounts" label-header="State" />
      </div>

      <h3 class="section-title">Comparison with the previous period</h3>
      <SortableTable :columns="comparisonColumns" :rows="comparison" :row-key="(r) => r.metric" caption="This period compared with the previous period." :initial-sort="{ key: 'none', direction: 'asc' }" :min-width="560">
        <template #cell-change="{ row }">{{ row.change > 0 ? '+' : '' }}{{ row.change }}</template>
      </SortableTable>
    </section>

    <section v-else-if="tab === 'cleaners'" id="panel-cleaners" role="tabpanel" aria-labelledby="tab-cleaners" class="page-stack" tabindex="0">
      <h2 class="section-title">Cleaner report</h2>
      <p class="field__hint">Applications counted by the date applied; jobs by job date; documents and states as they are now.</p>
      <SortableTable :columns="cleanerColumns" :rows="cleanerRows" :row-key="(r) => r.email" caption="Cleaner report." :min-width="1200" empty-text="No cleaners match the filters.">
        <template #cell-name="{ row }"><NuxtLink :to="`/admin/accounts/${encodeURIComponent(row.email)}`" class="link">{{ row.name }}</NuxtLink></template>
        <template #cell-approval="{ row }"><StatusBadge kind="approval" :value="row.approvalStatus" /></template>
        <template #cell-state="{ row }"><StatusBadge kind="account" :value="row.accountState" /></template>
        <template #cell-docs="{ row }">{{ row.documentsApproved }} of 6</template>
        <template #cell-areas="{ row }"><span v-if="row.areas">{{ row.areas }}</span><span v-else class="muted">None</span></template>
      </SortableTable>
    </section>

    <section v-else id="panel-clients" role="tabpanel" aria-labelledby="tab-clients" class="page-stack" tabindex="0">
      <h2 class="section-title">Client report</h2>
      <p class="field__hint">Requests counted by the date received; jobs by job date; "repeat client" means two or more requests at any time.</p>
      <SortableTable :columns="clientColumns" :rows="clientRows" :row-key="(r) => r.email" caption="Client report." :min-width="1000" empty-text="No clients match the filters.">
        <template #cell-name="{ row }"><NuxtLink :to="`/admin/accounts/${encodeURIComponent(row.email)}`" class="link">{{ row.name }}</NuxtLink></template>
      </SortableTable>
    </section>
  </div>
</template>

<style scoped>
.filters { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; padding: 16px; }
.report-meta { margin: 0; font-size: 14px; color: var(--color-text-soft); }
.tabs { display: flex; flex-wrap: wrap; gap: 4px; border-bottom: 1px solid var(--color-card-border); }
.tabs__tab {
  font: inherit; font-size: 15px; font-weight: 700; padding: 10px 16px; border: none; background: none;
  color: var(--color-text-soft); border-bottom: 3px solid transparent; cursor: pointer; margin-bottom: -1px;
}
.tabs__tab[aria-selected='true'] { color: var(--color-teal-dark); border-bottom-color: var(--color-teal); }
.section-title { margin: 0; font-size: 20px; font-weight: 800; }
.cards { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
.stat { background: var(--color-card); border: 1px solid var(--color-card-border); border-radius: var(--radius-card); box-shadow: var(--shadow-card-sm); padding: 14px 16px; }
.stat__label { margin: 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-text-soft); }
.stat__value { margin: 4px 0 0; font-size: 28px; font-weight: 800; color: var(--color-text); font-variant-numeric: tabular-nums; }
.stat__note { margin: 2px 0 0; font-size: 13px; color: var(--color-text-soft); }
.highlights { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 6px; font-size: 15px; }
.charts { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; }
@media (max-width: 400px) { .charts { grid-template-columns: 1fr; } }
</style>
