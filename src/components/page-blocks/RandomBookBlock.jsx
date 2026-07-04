import { useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { pagePath, PUBLICATIONS_PAGE_ID } from '../../data/pages';
import { usePages } from '../../contexts/PagesContext';
import { usePublications } from '../../contexts/PublicationsContext';
import { ADMIN_SIDEBAR_ICONS } from '../../data/admin-sidebar-icons';
import { siteText } from '../../utils/admin-text';
import RandomPickFrame from './RandomPickFrame';

export default function RandomBookBlock({ block }) {
  const align = block?.align === 'right' ? 'right' : 'left';
  const { publications, loading } = usePublications();
  const { getPageById } = usePages();
  const pickedIdRef = useRef(null);

  const listPage = getPageById(PUBLICATIONS_PAGE_ID);
  const listHref = listPage ? pagePath(listPage) : '/publikace';
  const listLabel = listPage?.title || siteText('publications.random.fallbackTitle');

  const publication = useMemo(() => {
    if (!publications.length) return null;

    if (!pickedIdRef.current || !publications.some((item) => item.id === pickedIdRef.current)) {
      pickedIdRef.current = publications[Math.floor(Math.random() * publications.length)].id;
    }

    return publications.find((item) => item.id === pickedIdRef.current) || null;
  }, [publications]);

  return (
    <section className="page-block page-block--random-pick reveal">
      <div className="container">
        <RandomPickFrame
          variant="book"
          align={align}
          badge={siteText('publications.random.badge')}
          icon={ADMIN_SIDEBAR_ICONS.publikace}
          footer={(
            <Link to={listHref} className="btn btn--secondary">
              {siteText('publications.random.viewAll', { title: listLabel.toLocaleLowerCase('cs') })}
            </Link>
          )}
        >
          {loading ? (
            <p className="section__empty">{siteText('publications.random.loading')}</p>
          ) : publication ? (
            <div className="random-pick__book">
              <h3 className="random-pick__book-title">{publication.title}</h3>
              {publication.author && (
                <p className="random-pick__book-author">
                  <span
                    className="random-pick__book-author-icon"
                    aria-hidden="true"
                    dangerouslySetInnerHTML={{ __html: ADMIN_SIDEBAR_ICONS.author }}
                  />
                  <span>{publication.author}</span>
                </p>
              )}
              {publication.description && (
                <p className="random-pick__description">{publication.description}</p>
              )}
            </div>
          ) : (
            <p className="section__empty">{siteText('publications.random.empty')}</p>
          )}
        </RandomPickFrame>
      </div>
    </section>
  );
}
