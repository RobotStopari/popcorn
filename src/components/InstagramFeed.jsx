import { useEffect, useState } from 'react';
import { ICONS } from '../data/icons';
import { bindFrameImage } from '../hooks/useImageFrames';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { getInstagramProfileUrl, getInstagramUsername } from '../data/site-settings';
import { fetchInstagramPosts } from '../services/instagram';

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
  const { settings } = useSiteSettings();
  const profileUrl = getInstagramProfileUrl(settings);
  const profileHandle = `@${getInstagramUsername(settings)}`;
  const [posts, setPosts] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const username = getInstagramUsername(settings);

    setLoading(true);
    setLoadError('');
    fetchInstagramPosts(4, username)
      .then(({ posts: nextPosts, error }) => {
        if (cancelled) return;
        setPosts(nextPosts);
        setLoadError(error || '');
      })
      .catch(() => {
        if (!cancelled) {
          setPosts([]);
          setLoadError('Nepodařilo se načíst příspěvky z Instagramu.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [settings.brandLinks?.instagram, settings.instagramUsername]);

  useEffect(() => {
    if (!posts.length) return undefined;

    const frame = requestAnimationFrame(() => {
      document.querySelectorAll('#instagram .img-frame > img').forEach(bindFrameImage);
    });

    return () => cancelAnimationFrame(frame);
  }, [posts]);

  return (
    <section className="section section--instagram" id="instagram">
      <div className="container">
        <div className="instagram-feed__head reveal">
          <a
            href={profileUrl}
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
              <span className="instagram-feed__profile-handle">{profileHandle}</span>
            </span>
          </a>
        </div>

        {loading ? (
          <div className="instagram-feed reveal reveal--delay-1" aria-busy="true" aria-label="Načítám Instagram">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="instagram-feed__item-wrap">
                <div className="instagram-feed__item instagram-feed__item--placeholder" />
              </div>
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div className="instagram-feed reveal reveal--delay-1">
            {posts.map((post, index) => (
              <InstagramPost key={post.id} post={post} index={index} />
            ))}
          </div>
        ) : (
          <div className="instagram-feed__fallback reveal reveal--delay-1">
            <p className="instagram-feed__fallback-text">
              {loadError
                ? 'Příspěvky se teď nepodařilo načíst. Zkuste to později, nebo nás sledujte přímo na Instagramu.'
                : 'Zatím tu nejsou žádné příspěvky k zobrazení.'}
            </p>
            <a
              href={profileUrl}
              className="btn btn--primary shine-hover"
              target="_blank"
              rel="noopener noreferrer"
            >
              Otevřít profil {profileHandle}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
