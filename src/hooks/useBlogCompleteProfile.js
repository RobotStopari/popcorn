import { useEffect, useState } from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';

export function useBlogCompleteProfile({ autoOpen = true } = {}) {
  const { user, profileComplete, loading } = useAdminAuth();
  const [completeOpen, setCompleteOpen] = useState(false);

  useEffect(() => {
    if (!autoOpen || loading || !user || profileComplete) return;
    setCompleteOpen(true);
  }, [autoOpen, loading, user, profileComplete]);

  return {
    user,
    profileComplete,
    loading,
    completeOpen,
    setCompleteOpen,
    openCompleteProfile: () => setCompleteOpen(true),
    closeCompleteProfile: () => setCompleteOpen(false),
    showCompleteProfileModal: completeOpen && Boolean(user) && !profileComplete,
  };
}
