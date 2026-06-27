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

export async function saveOrganiserPreset(organiser) {
  const payload = organiserToPresetPayload(organiser);
  const existing = await getDocs(query(presetsRef, where('email', '==', payload.email)));

  if (!existing.empty) {
    const presetId = existing.docs[0].id;
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
