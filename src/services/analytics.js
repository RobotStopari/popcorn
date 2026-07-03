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
} from 'firebase/firestore';
import { db } from '../firebase';

const analyticsEventsRef = collection(db, 'analyticsEvents');

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

export async function fetchAnalyticsEvents({ from, to, max = 5000 }) {
  const start = Timestamp.fromDate(from);
  const end = Timestamp.fromDate(to);

  const snapshot = await getDocs(query(
    analyticsEventsRef,
    where('createdAt', '>=', start),
    where('createdAt', '<=', end),
    orderBy('createdAt', 'desc'),
    limit(max),
  ));

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}
