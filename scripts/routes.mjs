// Routes used by the screenshot and page-check scripts.
// `role` signs the browser in as that mock user before loading the page
// (front-end mock session in localStorage, see app/utils/persistence.ts).
export const SIGN_IN_AS = {
  client: 'maria.santos@example.com',
  cleaner: 'rosa.garcia@example.com',
  admin: 'admin.main@example.com',
}

export const ROUTES = [
  { name: 'login', path: '/login' },
  { name: 'register', path: '/register' },
  { name: 'register-client', path: '/register/client' },
  { name: 'register-cleaner', path: '/register/cleaner' },
  { name: 'client-requests', path: '/client/requests', role: 'client' },
  { name: 'cleaner-marketplace', path: '/cleaner/marketplace', role: 'cleaner' },
  { name: 'admin-jobs', path: '/admin/jobs', role: 'admin' },
  { name: 'admin-job-detail', path: '/admin/jobs/job-001', role: 'admin' },
  { name: 'admin-job-archived', path: '/admin/jobs/job-006', role: 'admin' },
  { name: 'admin-job-not-found', path: '/admin/jobs/job-404', role: 'admin' },
]
