import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { refreshPostAuthorsForUser } from '../services/blog-posts';

export async function syncProfileFromAuth(firebaseUser, existingProfile, userRef = null) {
  if (!firebaseUser || !existingProfile) return existingProfile;

  const ref = userRef || doc(db, 'users', firebaseUser.uid);
  const authPhoto = firebaseUser.photoURL || '';
  const authEmail = firebaseUser.email || '';
  const authDisplayName = firebaseUser.displayName || '';

  const photoChanged = (existingProfile.photoURL || '') !== authPhoto;
  const needsUpdate = photoChanged
    || (existingProfile.email || '') !== authEmail
    || (existingProfile.displayName || '') !== authDisplayName;

  if (!needsUpdate) return existingProfile;

  const updated = {
    photoURL: authPhoto,
    email: authEmail,
    displayName: authDisplayName,
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, updated, { merge: true });

  if (photoChanged) {
    refreshPostAuthorsForUser(firebaseUser.uid).catch(() => {});
  }

  return { ...existingProfile, ...updated };
}
