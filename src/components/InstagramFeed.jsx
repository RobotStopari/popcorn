import { useEffect, useState } from 'react';
import { ICONS } from '../data/icons';
import { bindFrameImage } from '../hooks/useImageFrames';
import { fetchInstagramPosts, INSTAGRAM_PROFILE_URL } from '../services/instagram';

function InstagramPost({ post, index }) {
  const handleImageReady = (event) => {
    event.currentTarget.parentElement?.classList.add('is-loaded');
  };
  const delayClass = ` reveal--delay-${Math.min(index + 1, 4)}`;

  return (
    <article className={`instagram-feed__item-wrap${delayClass} reveal`}>
      <a
        href={post.permalink}
        className="instagram-feed__item shine-parent"
        target="_blank"
        rel="noopener noreferrer"
        aria-label={post.caption || 'Příspěvek na Instagramu'}
      >
        <div className="instagram-feed__media img-frame shine-hover">
          <img
            src={post.imageUrl}
            alt=""
            className="instagram-feed__image"
            loading="lazy"
            decoding="async"
            onLoad={handleImageReady}
            onError={handleImageReady}
          />
          {post.isVideo && (
            <span className="instagram-feed__video-badge" aria-hidden="true">▶</span>
          )}
        </div>
      </a>
    </article>
  );
}

export default function InstagramFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchInstagramPosts(4)
      .then((data) => {
        if (!cancelled) setPosts(data);
      })
      .catch(() => {
        if (!cancelled) setPosts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!posts.length) return undefined;

    const frame = requestAnimationFrame(() => {
      document.querySelectorAll('#instagram .img-frame > img').forEach(bindFrameImage);
    });

    return () => cancelAnimationFrame(frame);
  }, [posts]);

  if (!loading && !posts.length) return null;

  return (
    <section className="section section--instagram" id="instagram">
      <div className="container">
        <div className="instagram-feed__head reveal">
          <a
            href={INSTAGRAM_PROFILE_URL}
            className="instagram-feed__profile"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span
              className="instagram-feed__profile-icon"
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: ICONS.instagram }}
            />
            <span className="instagram-feed__profile-copy">
              <span className="instagram-feed__profile-label">Sleduj nás na Instagramu</span>
              <span className="instagram-feed__profile-handle">@popcorn_puk</span>
            </span>
          </a>
        </div>

        {loading ? (
          <div className="instagram-feed reveal" aria-busy="true" aria-label="Načítám Instagram">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="instagram-feed__item-wrap">
                <div className="instagram-feed__item instagram-feed__item--placeholder" />
              </div>
            ))}
          </div>
        ) : (
          <div className="instagram-feed">
            {posts.map((post, index) => (
              <InstagramPost key={post.id} post={post} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
