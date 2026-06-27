import BlogProfileMenu from './BlogProfileMenu';

export default function BlogPageToolbar({ canCreate = false, onCreate }) {
  return (
    <div className="blog-page-toolbar">
      <BlogProfileMenu />
      {canCreate && (
        <button
          type="button"
          className="btn btn--primary btn--small blog-page-toolbar__create"
          onClick={onCreate}
        >
          Nový příspěvek
        </button>
      )}
    </div>
  );
}
