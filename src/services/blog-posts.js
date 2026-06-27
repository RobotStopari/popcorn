import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { buildAuthorSnapshot, normalizeBlogPost } from '../utils/blog-post-format';

const blogPostsRef = collection(db, 'blogPosts');

export function subscribeBlogPosts(onData, onError) {
  return onSnapshot(
    blogPostsRef,
    (snapshot) => {
      const posts = snapshot.docs
        .map((item) => {
          try {
            return normalizeBlogPost({ id: item.id, ...item.data() });
          } catch {
            return null;
          }
        })
        .filter(Boolean);
      onData(posts);
    },
    onError,
  );
}

export async function createBlogPost(payload) {
  const docRef = await addDoc(blogPostsRef, {
    ...payload,
    likeCount: 0,
    commentCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateBlogPost(postId, payload) {
  await updateDoc(doc(db, 'blogPosts', postId), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteBlogPost(postId) {
  await deleteDoc(doc(db, 'blogPosts', postId));
}

export function isSlugTaken(posts, slug, excludeId = null) {
  return posts.some((post) => post.slug === slug && post.id !== excludeId);
}

export async function fetchAuthorSnapshot(uid) {
  if (!uid) return null;

  const snapshot = await getDoc(doc(db, 'users', uid));
  if (!snapshot.exists()) return null;

  const data = snapshot.data();
  return buildAuthorSnapshot(data, {
    uid,
    displayName: data.displayName,
    photoURL: data.photoURL,
    email: data.email,
  });
}

export async function refreshPostAuthorsForUser(uid) {
  if (!uid) return 0;

  const author = await fetchAuthorSnapshot(uid);
  if (!author) return 0;

  const snapshot = await getDocs(
    query(blogPostsRef, where('author.uid', '==', uid)),
  );

  await Promise.all(
    snapshot.docs.map((item) => updateDoc(item.ref, { author })),
  );

  return snapshot.size;
}
