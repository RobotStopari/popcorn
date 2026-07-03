import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

const adminActivityLogRef = collection(db, 'adminActivityLog');

export async function recordAdminActivity(actor, {
  action = 'update',
  targetType = '',
  targetId = '',
  summary,
} = {}) {
  if (!actor?.uid || !summary?.trim()) return;

  try {
    await addDoc(adminActivityLogRef, {
      actorUid: actor.uid,
      actorName: actor.name?.trim() || actor.email?.trim() || 'Admin',
      action: action.trim(),
      targetType: targetType.trim(),
      targetId: targetId.trim(),
      summary: summary.trim().slice(0, 500),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.debug('Admin activity log failed:', error);
  }
}

export function subscribeAdminActivityLog(onData, onError, max = 500) {
  return onSnapshot(
    query(adminActivityLogRef, orderBy('createdAt', 'desc'), limit(max)),
    (snapshot) => {
      onData(snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })));
    },
    onError,
  );
}
