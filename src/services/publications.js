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
import { normalizePublication } from '../utils/publication-format';

const publicationsRef = collection(db, 'publications');

export function subscribePublications(onData, onError) {
  return onSnapshot(
    publicationsRef,
    (snapshot) => {
      const items = snapshot.docs
        .map((item) => {
          try {
            return normalizePublication({ id: item.id, ...item.data() });
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

export async function fetchPublicationById(publicationId) {
  const snapshot = await getDoc(doc(db, 'publications', publicationId));
  if (!snapshot.exists()) return null;
  return normalizePublication({ id: snapshot.id, ...snapshot.data() });
}

export async function createPublication(payload) {
  const docRef = await addDoc(publicationsRef, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updatePublication(publicationId, payload) {
  await updateDoc(doc(db, 'publications', publicationId), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePublication(publicationId) {
  await deleteDoc(doc(db, 'publications', publicationId));
}
