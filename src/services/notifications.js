import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { normalizeNotification } from '../utils/notification-format';

const notificationsRef = collection(db, 'notifications');

export function subscribeNotifications(onData, onError) {
  return onSnapshot(
    notificationsRef,
    (snapshot) => {
      const items = snapshot.docs
        .map((item) => {
          try {
            return normalizeNotification({ id: item.id, ...item.data() });
          } catch {
            return null;
          }
        })
        .filter(Boolean);
      onData(items);
    },
    onError,
  );
}

export async function fetchNotificationById(notificationId) {
  const snapshot = await getDoc(doc(db, 'notifications', notificationId));
  if (!snapshot.exists()) return null;
  return normalizeNotification({ id: snapshot.id, ...snapshot.data() });
}

export async function createNotification(payload) {
  const docRef = await addDoc(notificationsRef, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateNotification(notificationId, payload) {
  await updateDoc(doc(db, 'notifications', notificationId), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteNotification(notificationId) {
  await deleteDoc(doc(db, 'notifications', notificationId));
}

export async function setNotificationManualActive(notificationId, manualActive) {
  await updateDoc(doc(db, 'notifications', notificationId), {
    scheduleMode: 'manual',
    manualActive: Boolean(manualActive),
    updatedAt: serverTimestamp(),
  });
}
