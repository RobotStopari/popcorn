import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { normalizeOrganiserPreset, organiserToPresetPayload } from '../utils/organiser';

const presetsRef = collection(db, 'organiserPresets');

function sortPresets(presets) {
  return [...presets].sort((left, right) => (
    left.name.localeCompare(right.name, 'cs', { sensitivity: 'base' })
  ));
}

export function subscribeOrganiserPresets(onData, onError) {
  return onSnapshot(
    presetsRef,
    (snapshot) => {
      const presets = sortPresets(
        snapshot.docs.map((item) => normalizeOrganiserPreset({ id: item.id, ...item.data() })),
      );
      onData(presets);
    },
    onError,
  );
}

async function findExistingPresetDocs(payload) {
  if (payload.email) {
    const existing = await getDocs(query(presetsRef, where('email', '==', payload.email)));
    return existing.docs;
  }

  const existing = await getDocs(query(presetsRef, where('name', '==', payload.name)));
  return existing.docs.filter((docSnap) => {
    const data = docSnap.data();
    return !(data.email || '').trim()
      && (data.nick || '').trim() === payload.nick;
  });
}

export async function saveOrganiserPreset(organiser) {
  const payload = organiserToPresetPayload(organiser);
  const existingDocs = await findExistingPresetDocs(payload);

  if (existingDocs.length) {
    const presetId = existingDocs[0].id;
    await updateDoc(doc(db, 'organiserPresets', presetId), {
      ...payload,
      updatedAt: serverTimestamp(),
    });
    return presetId;
  }

  const docRef = await addDoc(presetsRef, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function deleteOrganiserPreset(presetId) {
  await deleteDoc(doc(db, 'organiserPresets', presetId));
}
