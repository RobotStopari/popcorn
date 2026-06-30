import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { subscribeBlogPosts } from '../services/blog-posts';
import { normalizeBlogPost, sortPostsByPublished } from '../utils/blog-post-format';

const BlogPostsContext = createContext(null);

function normalizeInitialPosts(initialPosts) {
  if (!initialPosts?.length) return [];
  return initialPosts
    .map((item) => {
      try {
        return normalizeBlogPost(item);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

export function BlogPostsProvider({ children, initialPosts = null }) {
  const [posts, setPosts] = useState(() => normalizeInitialPosts(initialPosts));
  const [loading, setLoading] = useState(initialPosts === null);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeBlogPosts(
      (data) => {
        setPosts(data);
        setLoading(false);
        setError('');
      },
      (err) => {
        setError(err.message || 'Nepodařilo se načíst blog.');
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const prependPost = useCallback((post) => {
    if (!post?.id) return;

    setPosts((current) => {
      if (current.some((item) => item.id === post.id)) return current;
      return [post, ...current];
    });
  }, []);

  const sortedPosts = useMemo(() => sortPostsByPublished(posts), [posts]);

  const getPostBySlug = useCallback((slug) => (
    posts.find((post) => post.slug === slug) || null
  ), [posts]);

  const value = useMemo(() => ({
    posts: sortedPosts,
    loading,
    error,
    getPostBySlug,
    prependPost,
  }), [sortedPosts, loading, error, getPostBySlug, prependPost]);

  return (
    <BlogPostsContext.Provider value={value}>
      {children}
    </BlogPostsContext.Provider>
  );
}

export function useBlogPosts() {
  const context = useContext(BlogPostsContext);
  if (!context) {
    throw new Error('useBlogPosts must be used within BlogPostsProvider');
  }
  return context;
}
