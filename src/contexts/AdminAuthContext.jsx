import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { refreshPostAuthorsForUser } from '../services/blog-posts';
import { syncProfileFromAuth } from '../utils/sync-user-profile';

const AdminAuthContext = createContext(null);

const PHOTO_SYNC_INTERVAL_MS = 5 * 60 * 1000;

export function getProfileLabel(profile) {
  if (profile?.nick?.trim()) return profile.nick.trim();
  if (profile?.name?.trim()) return profile.name.trim().split(/\s+/)[0];
  return '';
}

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setError('');

      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const snapshot = await getDoc(userRef);

        if (snapshot.exists()) {
          const synced = await syncProfileFromAuth(firebaseUser, snapshot.data(), userRef);
          setProfile(synced);
        } else {
          const newProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || '',
            name: '',
            nick: '',
            admin: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(userRef, newProfile);
          setProfile(newProfile);
        }
      } catch (err) {
        setError(err.message || 'Nepodařilo se načíst profil.');
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return undefined;

    let cancelled = false;

    const refreshAuthProfile = async () => {
      try {
        await auth.currentUser?.reload();
        if (cancelled || !auth.currentUser) return;

        const freshUser = auth.currentUser;
        setUser(freshUser);

        const userRef = doc(db, 'users', freshUser.uid);
        const snapshot = await getDoc(userRef);
        if (!snapshot.exists()) return;

        const synced = await syncProfileFromAuth(freshUser, snapshot.data(), userRef);
        if (!cancelled) {
          setProfile((prev) => ({ ...prev, ...synced }));
        }
      } catch {
        // ignore reload/sync failures
      }
    };

    window.addEventListener('focus', refreshAuthProfile);
    const interval = setInterval(refreshAuthProfile, PHOTO_SYNC_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', refreshAuthProfile);
      clearInterval(interval);
    };
  }, [user?.uid]);

  const signInWithGoogle = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(err.message || 'Přihlášení se nezdařilo.');
      setLoading(false);
    }
  }, []);

  const signOutUser = useCallback(async () => {
    setError('');
    try {
      await signOut(auth);
      setProfile(null);
    } catch (err) {
      setError(err.message || 'Odhlášení se nezdařilo.');
    }
  }, []);

  const saveProfile = useCallback(async ({ name, nick }) => {
    if (!user || !name?.trim()) return false;

    try {
      await auth.currentUser?.reload();
      const freshUser = auth.currentUser || user;
      const userRef = doc(db, 'users', user.uid);
      const updated = {
        uid: user.uid,
        email: freshUser.email || '',
        displayName: freshUser.displayName || '',
        photoURL: freshUser.photoURL || '',
        name: name.trim(),
        nick: nick?.trim() || null,
        updatedAt: serverTimestamp(),
      };

      await setDoc(userRef, updated, { merge: true });
      setProfile((prev) => ({ ...prev, ...updated }));
      setUser(freshUser);

      if ((profile?.photoURL || '') !== (updated.photoURL || '')) {
        refreshPostAuthorsForUser(user.uid).catch(() => {});
      }

      setError('');
      return true;
    } catch (err) {
      setError(err.message || 'Uložení profilu se nezdařilo.');
      return false;
    }
  }, [user]);

  const deleteProfile = useCallback(async () => {
    if (!user) return false;

    try {
      await deleteDoc(doc(db, 'users', user.uid));
      await signOut(auth);
      setProfile(null);
      setError('');
      return true;
    } catch (err) {
      setError(err.message || 'Smazání profilu se nezdařilo.');
      return false;
    }
  }, [user]);

  const fetchAllUsers = useCallback(async () => {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() ?? 0;
        const bTime = b.createdAt?.toMillis?.() ?? 0;
        return bTime - aTime;
      });
  }, []);

  const setUserAdmin = useCallback(async (userId, admin) => {
    if (!user || userId === user.uid) return false;

    try {
      await updateDoc(doc(db, 'users', userId), {
        admin,
        updatedAt: serverTimestamp(),
      });
      setError('');
      return true;
    } catch (err) {
      setError(err.message || 'Změna oprávnění se nezdařila.');
      return false;
    }
  }, [user]);

  const deleteUser = useCallback(async (userId) => {
    if (!user || userId === user.uid) return false;

    try {
      const target = await getDoc(doc(db, 'users', userId));
      if (!target.exists() || target.data().admin === true) {
        setError('Totoho uživatele nelze smazat.');
        return false;
      }

      await deleteDoc(doc(db, 'users', userId));
      setError('');
      return true;
    } catch (err) {
      setError(err.message || 'Smazání uživatele se nezdařilo.');
      return false;
    }
  }, [user]);

  const photoURL = user?.photoURL || profile?.photoURL || '';
  const isAdmin = profile?.admin === true;
  const profileComplete = Boolean(profile?.name?.trim());
  const profileLabel = getProfileLabel(profile);
  const canAccessAdmin = Boolean(user && isAdmin && profileComplete);

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    error,
    setError,
    photoURL,
    isAdmin,
    profileComplete,
    profileLabel,
    canAccessAdmin,
    signInWithGoogle,
    signOutUser,
    saveProfile,
    deleteProfile,
    fetchAllUsers,
    setUserAdmin,
    deleteUser,
  }), [
    user,
    profile,
    loading,
    error,
    photoURL,
    isAdmin,
    profileComplete,
    profileLabel,
    canAccessAdmin,
    signInWithGoogle,
    signOutUser,
    saveProfile,
    deleteProfile,
    fetchAllUsers,
    setUserAdmin,
    deleteUser,
  ]);

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
}
