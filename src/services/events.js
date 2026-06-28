import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { normalizeEvent } from '../utils/event-format';

const eventsRef = collection(db, 'events');

export function subscribeEvents(onData, onError) {
  return onSnapshot(
    eventsRef,
    (snapshot) => {
      const events = snapshot.docs
        .map((item) => {
          try {
            return normalizeEvent({ id: item.id, ...item.data() });
          } catch {
            return null;
          }
        })
        .filter(Boolean);
      onData(events);
    },
    onError,
  );
}

export async function fetchAllEvents() {
  const snapshot = await getDocs(eventsRef);
  return snapshot.docs.map((item) => normalizeEvent({ id: item.id, ...item.data() }));
}

export async function fetchEventById(eventId) {
  const snapshot = await getDoc(doc(db, 'events', eventId));
  if (!snapshot.exists()) return null;
  return normalizeEvent({ id: snapshot.id, ...snapshot.data() });
}

const EMPTY_EVENT_FIELDS = {
  title: '',
  dateStart: '',
  timeStart: '',
  dateEnd: '',
  timeEnd: '',
  place: '',
  price: '',
  description: '',
  organisers: [],
  participants: [],
  registrationLink: '',
  report: '',
  galleryLink: '',
  coverImage: '',
  coverPublicId: '',
  promoImages: [],
  galleryPicks: [],
};

export async function createEvent(payload) {
  const docRef = await addDoc(eventsRef, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function createDraftEvent(formPayload = {}) {
  return createEvent({
    ...EMPTY_EVENT_FIELDS,
    ...formPayload,
    published: false,
  });
}

export async function updateEvent(eventId, payload) {
  await updateDoc(doc(db, 'events', eventId), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteEvent(eventId) {
  await deleteDoc(doc(db, 'events', eventId));
}
