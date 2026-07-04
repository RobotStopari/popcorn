import { useCallback, useEffect, useMemo, useState } from 'react';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { db } from '../firebase';
import { ADMIN_STAR_FIELDS, isStarred, normalizeStarredIds, toggleStarredId } from '../utils/admin-stars';

export default function useAdminStars(scope) {
  const field = ADMIN_STAR_FIELDS[scope];
  const { user, profile, patchProfile } = useAdminAuth();
  const [starredIds, setStarredIds] = useState([]);

  useEffect(() => {
    setStarredIds(normalizeStarredIds(profile?.[field]));
  }, [field, profile, user?.uid]);

  const toggleStar = useCallback(async (itemId) => {
    if (!user?.uid || !itemId || !field) return;

    const previous = starredIds;
    const next = toggleStarredId(starredIds, itemId);

    setStarredIds(next);

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        [field]: next,
        updatedAt: serverTimestamp(),
      });
      patchProfile({ [field]: next });
    } catch {
      setStarredIds(previous);
    }
  }, [field, patchProfile, starredIds, user?.uid]);

  const isItemStarred = useCallback(
    (itemId) => isStarred(starredIds, itemId),
    [starredIds],
  );

  return useMemo(() => ({
    starredIds,
    isStarred: isItemStarred,
    toggleStar,
  }), [isItemStarred, starredIds, toggleStar]);
}
