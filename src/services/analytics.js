import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';

const analyticsEventsRef = collection(db, 'analyticsEvents');
const DELETE_BATCH_SIZE = 500;

export async function trackAnalyticsEvent(payload) {
  try {
    await addDoc(analyticsEventsRef, {
      type: payload.type,
      sessionId: payload.sessionId,
      path: payload.path,
      device: payload.device,
      os: payload.os,
      browser: payload.browser,
      articleSlug: payload.articleSlug || '',
      eventId: payload.eventId || '',
      eventSlug: payload.eventSlug || '',
      clickTarget: payload.clickTarget || '',
      clickLabel: payload.clickLabel || '',
      durationSec: payload.durationSec || 0,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.debug('Analytics track failed:', error);
  }
}

export async function fetchAnalyticsEvents({ from, to, all = false, max = 5000 }) {
  const snapshot = await getDocs(all
    ? query(
      analyticsEventsRef,
      orderBy('createdAt', 'desc'),
      limit(max),
    )
    : query(
      analyticsEventsRef,
      where('createdAt', '>=', Timestamp.fromDate(from)),
      where('createdAt', '<=', Timestamp.fromDate(to)),
      orderBy('createdAt', 'desc'),
      limit(max),
    ));

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

export async function clearAllAnalyticsEvents() {
  let deleted = 0;

  while (true) {
    const snapshot = await getDocs(query(analyticsEventsRef, limit(DELETE_BATCH_SIZE)));
    if (snapshot.empty) break;

    const batch = writeBatch(db);
    snapshot.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
    deleted += snapshot.docs.length;

    if (snapshot.docs.length < DELETE_BATCH_SIZE) break;
  }

  return deleted;
}
