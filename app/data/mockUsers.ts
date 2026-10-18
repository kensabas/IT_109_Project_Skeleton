// F-01 Phase 4.1b — mock user data for the midterm demo.
//
// Scope: midterm only. Passwords are plain text; this is explicitly called
// out in PLAN_F-01.md Phase 4 ("passwords stored as plain text in mock data
// are for the midterm demo only"). Hashing, tokens, and enforcement are
// Final-period work.
//
// Names and emails below are made-up, Filipino-style; they do not refer to
// real people. All emails use the IANA-reserved `example.com` domain.
//
// clientType is carried only for clients. The sign-up form collects it
// (Phase 3 /register/client page), so the mock list needs the field too;
// it is unconfirmed as a user-data field because PLAN_F-01.md's Phase 4.1
// does not list it. Flagged in the Phase 4 run-status file.

export type UserRole = 'client' | 'cleaner'
export type ClientType = 'homeowner' | 'company' | 'establishment' | 'business'

export interface MockUser {
  name: string
  email: string
  mobileNumber: string
  password: string
  role: UserRole
  // Required when role === 'client', absent when role === 'cleaner'.
  clientType?: ClientType
}

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
      clientType: 'homeowner',
    },
    {
      name: 'Jose Dela Cruz',
      email: 'jose.delacruz@example.com',
      mobileNumber: '09182345678',
      password: 'Secure4567A',
      role: 'client',
      clientType: 'company',
    },
    {
      name: 'Juan Reyes',
      email: 'juan.reyes@example.com',
      mobileNumber: '09193456789',
      password: 'Password2024',
      role: 'client',
      clientType: 'business',
    },

    // --- Cleaners ---
    {
      name: 'Rosa Garcia',
      email: 'rosa.garcia@example.com',
      mobileNumber: '09204567890',
      password: 'CleanBest2024',
      role: 'cleaner',
    },
    {
      name: 'Pedro Mendoza',
      email: 'pedro.mendoza@example.com',
      mobileNumber: '09215678901',
      password: 'WorkHard88',
      role: 'cleaner',
    },
    {
      name: 'Ana Villanueva',
      email: 'ana.villanueva@example.com',
      mobileNumber: '09226789012',
      password: 'TidyPro123',
      role: 'cleaner',
    },
  ]
}
