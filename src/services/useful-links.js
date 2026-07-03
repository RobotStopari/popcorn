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
import { normalizeUsefulLink } from '../utils/useful-link-format';

const usefulLinksRef = collection(db, 'usefulLinks');

export function subscribeUsefulLinks(onData, onError) {
  return onSnapshot(
    usefulLinksRef,
    (snapshot) => {
      const items = snapshot.docs
        .map((item) => {
          try {
            return normalizeUsefulLink({ id: item.id, ...item.data() });
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

export async function fetchUsefulLinkById(linkId) {
  const snapshot = await getDoc(doc(db, 'usefulLinks', linkId));
  if (!snapshot.exists()) return null;
  return normalizeUsefulLink({ id: snapshot.id, ...snapshot.data() });
}

export async function createUsefulLink(payload) {
  const docRef = await addDoc(usefulLinksRef, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateUsefulLink(linkId, payload) {
  await updateDoc(doc(db, 'usefulLinks', linkId), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteUsefulLink(linkId) {
  await deleteDoc(doc(db, 'usefulLinks', linkId));
}
