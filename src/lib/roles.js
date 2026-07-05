// Role display helpers.
//
// The database role VALUE stays 'user' | 'admin' (used by RLS, is_admin(), and
// all auth checks — never change it). These helpers only control the LABEL the
// UI shows, so members are presented as "Student" throughout the portal.

export function roleLabel(role) {
  return role === 'admin' ? 'Administrator' : 'Student';
}

// Plural noun for a group of non-admin members.
export const STUDENT_NOUN = 'Student';
export const STUDENT_NOUN_PLURAL = 'Students';
