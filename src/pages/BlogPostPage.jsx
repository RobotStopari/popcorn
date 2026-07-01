import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import BlogPostDetail from '../components/BlogPostDetail';
import { useBlogPosts } from '../contexts/BlogPostsContext';
import { useImageFrames } from '../hooks/useImageFrames';

export default function BlogPostPage() {
  const { postSlug } = useParams();
  const { getPostBySlug, loading } = useBlogPosts();
  const post = postSlug ? getPostBySlug(postSlug) : null;
  const contentKey = loading ? 'loading' : post ? post.id : 'missing';

  useImageFrames([postSlug, contentKey]);

  useEffect(() => {
    if (loading) return;
    if (!post) return;

    document.title = `${post.title} — Komunita Popcorn`;
  }, [postSlug, loading, post]);

  return <BlogPostDetail slug={postSlug} />;
}
