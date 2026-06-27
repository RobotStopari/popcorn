import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { subscribeBlogPosts } from '../services/blog-posts';
import { sortPostsByPublished } from '../utils/blog-post-format';

const BlogPostsContext = createContext(null);

export function BlogPostsProvider({ children }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const sortedPosts = useMemo(() => sortPostsByPublished(posts), [posts]);

  const getPostBySlug = useCallback((slug) => (
    posts.find((post) => post.slug === slug) || null
  ), [posts]);

  const value = useMemo(() => ({
    posts: sortedPosts,
    loading,
    error,
    getPostBySlug,
  }), [sortedPosts, loading, error, getPostBySlug]);

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
