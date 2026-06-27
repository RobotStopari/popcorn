import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { buildAuthorSnapshot } from '../utils/blog-post-format';
import { normalizeComment } from '../utils/blog-comment-format';

function postRef(postId) {
  return doc(db, 'blogPosts', postId);
}

function likeRef(postId, likeId) {
  return doc(db, 'blogPosts', postId, 'likes', likeId);
}

function commentsRef(postId) {
  return collection(db, 'blogPosts', postId, 'comments');
}

function commentRef(postId, commentId) {
  return doc(db, 'blogPosts', postId, 'comments', commentId);
}

export function resolveLikeId(user, anonymousId) {
  if (user?.uid) return user.uid;
  return anonymousId || null;
}

export async function fetchUserHasLiked(postId, likeId) {
  if (!likeId) return false;
  const snapshot = await getDoc(likeRef(postId, likeId));
  return snapshot.exists();
}

function sortCommentsByCreated(comments) {
  return [...comments].sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() ?? 0;
    const bTime = b.createdAt?.toMillis?.() ?? 0;
    return aTime - bTime;
  });
}

export function subscribePostComments(postId, onData, onError) {
  if (!postId) return () => {};

  return onSnapshot(
    commentsRef(postId),
    (snapshot) => {
      const comments = snapshot.docs.map((item) => normalizeComment({
        id: item.id,
        postId,
        ...item.data(),
      }));
      onData(sortCommentsByCreated(comments));
    },
    onError,
  );
}

export async function togglePostLike(postId, { user, anonymousId }) {
  const likeId = resolveLikeId(user, anonymousId);
  if (!likeId) throw new Error('Like ID is missing.');

  await runTransaction(db, async (transaction) => {
    const likeDoc = likeRef(postId, likeId);
    const postDoc = postRef(postId);
    const likeSnap = await transaction.get(likeDoc);
    const postSnap = await transaction.get(postDoc);

    if (!postSnap.exists()) {
      throw new Error('Příspěvek neexistuje.');
    }

    const currentCount = postSnap.data().likeCount || 0;

    if (likeSnap.exists()) {
      transaction.delete(likeDoc);
      transaction.update(postDoc, {
        likeCount: Math.max(0, currentCount - 1),
        updatedAt: serverTimestamp(),
      });
      return;
    }

    transaction.set(likeDoc, {
      uid: user?.uid || null,
      anonymous: !user?.uid,
      createdAt: serverTimestamp(),
    });
    transaction.update(postDoc, {
      likeCount: currentCount + 1,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function createPostComment(postId, { body, profile, user }) {
  const commentDoc = doc(commentsRef(postId));
  const author = buildAuthorSnapshot(profile, user);
  const trimmed = body.trim();

  await runTransaction(db, async (transaction) => {
    const postDoc = postRef(postId);
    const postSnap = await transaction.get(postDoc);

    if (!postSnap.exists()) {
      throw new Error('Příspěvek neexistuje.');
    }

    const currentCount = postSnap.data().commentCount || 0;

    transaction.set(commentDoc, {
      body: trimmed,
      author,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      editedAt: null,
    });
    transaction.update(postDoc, {
      commentCount: currentCount + 1,
      updatedAt: serverTimestamp(),
    });
  });

  return commentDoc.id;
}

export async function updatePostComment(postId, commentId, body) {
  await updateDoc(commentRef(postId, commentId), {
    body: body.trim(),
    updatedAt: serverTimestamp(),
    editedAt: serverTimestamp(),
  });
}

export async function deletePostComment(postId, commentId) {
  await runTransaction(db, async (transaction) => {
    const postDoc = postRef(postId);
    const commentDoc = commentRef(postId, commentId);
    const postSnap = await transaction.get(postDoc);
    const commentSnap = await transaction.get(commentDoc);

    if (!postSnap.exists() || !commentSnap.exists()) return;

    const currentCount = postSnap.data().commentCount || 0;

    transaction.delete(commentDoc);
    transaction.update(postDoc, {
      commentCount: Math.max(0, currentCount - 1),
      updatedAt: serverTimestamp(),
    });
  });
}

export async function fetchPostComments(postId) {
  if (!postId) return [];

  const snapshot = await getDocs(commentsRef(postId));

  return sortCommentsByCreated(snapshot.docs.map((item) => normalizeComment({
    id: item.id,
    postId,
    ...item.data(),
  })));
}
