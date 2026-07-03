import KeywordFilter from './KeywordFilter';

export default function BlogKeywordFilter({ posts, ...props }) {
  return <KeywordFilter {...props} items={posts} textPrefix="blog.list" />;
}
