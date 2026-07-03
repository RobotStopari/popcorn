import { recordAdminActivity } from '../services/admin-activity-log';

export function buildAdminActor(user, profile) {
  if (!user?.uid) return null;

  return {
    uid: user.uid,
    email: user.email || profile?.email || '',
    name: profile?.name?.trim()
      || profile?.displayName?.trim()
      || user.displayName?.trim()
      || user.email?.trim()
      || 'Admin',
  };
}

export async function logAdminChange(actor, details) {
  if (!actor) return;
  await recordAdminActivity(actor, details);
}
