// F-01 Phase 4.1b — mock user data for the midterm demo.
//
// Scope: midterm only. Passwords are plain text; this is explicitly called
// out in PLAN_F-01.md Phase 4 ("passwords stored as plain text in mock data
// are for the midterm demo only"). Hashing, tokens, and enforcement are
// Final-period work.
//
// Names and emails below are made-up, Filipino-style; they do not refer to
// real people. All emails use the IANA-reserved `example.com` domain.
// Wave 2.1 seed: 3 clients, 5 cleaners (approved / pending / rejected;
// activated / deactivated / suspended), 2 admins. Place names are real
// Philippine places; coordinates are approximate, for the demo only.
//
// clientType is carried only for clients. The sign-up form collects it
// (Phase 3 /register/client page), so the mock list needs the field too;
// it is unconfirmed as a user-data field because PLAN_F-01.md's Phase 4.1
// does not list it. Flagged in the Phase 4 run-status file.

// Wave 1.1 [F-04, F-06]: admins sign in on the same login screen
// (plan D9, Q22 unconfirmed). There is no admin sign-up.
export const USER_ROLES = ['client', 'cleaner', 'admin'] as const
export type UserRole = (typeof USER_ROLES)[number]
export type ClientType = 'homeowner' | 'company' | 'establishment' | 'business'

// Wave 0.3 [F-05] — the three account states stated by the user.
// Meaning of each is unconfirmed (Q12, plan D6).
export const ACCOUNT_STATES = ['activated', 'deactivated', 'suspended'] as const
export type AccountState = (typeof ACCOUNT_STATES)[number]

// Wave 0.3 [F-03] — only cleaners need approval; everyone else is
// 'not-required' so the field is never empty.
export const APPROVAL_STATUSES = ['approved', 'pending', 'rejected', 'not-required'] as const
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number]

export interface MockUser {
  name: string
  email: string
  mobileNumber: string
  password: string
  role: UserRole
  // Required when role === 'client', absent when role === 'cleaner'.
  clientType?: ClientType
  accountState: AccountState
  approvalStatus: ApprovalStatus
  // Only the main admin can create admin accounts (F-04).
  isMainAdmin?: boolean
  // ISO date the account was created (report: new registrations).
  registeredAt: string
  // Cleaner's pinned location for distance (F-24, plan D5). Null until pinned.
  pinnedLocation?: PinnedLocation | null
}

export interface PinnedLocation {
  lat: number
  lng: number
  label: string
}

// What a sign-up form provides; the store fills in the rest.
export type NewUserInput = Omit<MockUser, 'accountState' | 'approvalStatus' | 'registeredAt'>

export function initialMockUsers(): MockUser[] {
  // Returned fresh each call so the Pinia store can start from a clean
  // list on every page load (which is also what gives us "lost on refresh"
  // for Phase 4.4 — no persistence layer).
  return [
    // --- Clients ---
    {
      name: 'Maria Clara Santos',
      email: 'maria.santos@example.com',
      mobileNumber: '09171234567',
      password: 'StrongPass123',
      role: 'client',
      accountState: 'activated',
      approvalStatus: 'not-required',
      clientType: 'homeowner',
      registeredAt: '2026-05-12',
    },
    {
      name: 'Jose Dela Cruz',
      email: 'jose.delacruz@example.com',
      mobileNumber: '09182345678',
      password: 'Secure4567A',
      role: 'client',
      accountState: 'activated',
      approvalStatus: 'not-required',
      clientType: 'company',
      registeredAt: '2026-07-03',
    },
    {
      name: 'Juan Reyes',
      email: 'juan.reyes@example.com',
      mobileNumber: '09193456789',
      password: 'Password2024',
      role: 'client',
      accountState: 'activated',
      approvalStatus: 'not-required',
      clientType: 'business',
      registeredAt: '2026-09-18',
    },

    // --- Admins (placeholders, Q22 unconfirmed) ---
    {
      name: 'Teresa Navarro',
      email: 'admin.main@example.com',
      mobileNumber: '09170000001',
      password: 'AdminMain2026',
      role: 'admin',
      accountState: 'activated',
      approvalStatus: 'not-required',
      isMainAdmin: true,
      registeredAt: '2026-01-05',
    },
    {
      name: 'Ramon Castillo',
      email: 'admin.staff@example.com',
      mobileNumber: '09170000002',
      password: 'AdminStaff2026',
      role: 'admin',
      accountState: 'activated',
      approvalStatus: 'not-required',
      isMainAdmin: false,
      registeredAt: '2026-01-05',
    },

    // --- Cleaners ---
    {
      name: 'Rosa Garcia',
      email: 'rosa.garcia@example.com',
      mobileNumber: '09204567890',
      password: 'CleanBest2024',
      role: 'cleaner',
      accountState: 'activated',
      approvalStatus: 'approved',
      registeredAt: '2026-06-01',
      pinnedLocation: { lat: 14.565, lng: 121.031, label: 'Poblacion, Makati City' },
    },
    {
      name: 'Pedro Mendoza',
      email: 'pedro.mendoza@example.com',
      mobileNumber: '09215678901',
      password: 'WorkHard88',
      role: 'cleaner',
      accountState: 'activated',
      approvalStatus: 'approved',
      registeredAt: '2026-06-20',
      pinnedLocation: { lat: 14.6537, lng: 121.0687, label: 'Diliman, Quezon City' },
    },
    {
      name: 'Ana Villanueva',
      email: 'ana.villanueva@example.com',
      mobileNumber: '09226789012',
      password: 'TidyPro123',
      role: 'cleaner',
      accountState: 'deactivated',
      approvalStatus: 'approved',
      registeredAt: '2026-07-15',
      pinnedLocation: { lat: 10.3316, lng: 123.8996, label: 'Lahug, Cebu City' },
    },
    {
      name: 'Liza Fernandez',
      email: 'liza.fernandez@example.com',
      mobileNumber: '09237890123',
      password: 'Sparkle2026',
      role: 'cleaner',
      accountState: 'activated',
      approvalStatus: 'pending',
      registeredAt: '2026-10-14',
      pinnedLocation: { lat: 14.5712, lng: 121.0597, label: 'Kapitolyo, Pasig City' },
    },
    {
      name: 'Carlo Ramos',
      email: 'carlo.ramos@example.com',
      mobileNumber: '09248901234',
      password: 'Mopping2026',
      role: 'cleaner',
      accountState: 'suspended',
      approvalStatus: 'rejected',
      registeredAt: '2026-08-20',
      pinnedLocation: { lat: 8.948, lng: 125.527, label: 'Libertad, Butuan City' },
    },
  ]
}
