import { useCallback } from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { buildAdminActor, logAdminChange } from '../utils/admin-activity';

export function useAdminActivityLogger() {
  const { user, profile } = useAdminAuth();

  return useCallback((details) => {
    const actor = buildAdminActor(user, profile);
    return logAdminChange(actor, details);
  }, [user, profile]);
}
