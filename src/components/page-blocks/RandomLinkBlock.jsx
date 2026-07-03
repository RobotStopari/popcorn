import { useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { pagePath, USEFUL_LINKS_PAGE_ID } from '../../data/pages';
import { usePages } from '../../contexts/PagesContext';
import { useUsefulLinks } from '../../contexts/UsefulLinksContext';
import { ADMIN_SIDEBAR_ICONS } from '../../data/admin-sidebar-icons';
import { siteText } from '../../utils/admin-text';
import PageBlockLinkButton from './PageBlockLinkButton';
import RandomPickFrame from './RandomPickFrame';

export default function RandomLinkBlock() {
  const { links, loading } = useUsefulLinks();
  const { getPageById } = usePages();
  const pickedIdRef = useRef(null);

  const listPage = getPageById(USEFUL_LINKS_PAGE_ID);
  const listHref = listPage ? pagePath(listPage) : '/odkazy';
  const listLabel = listPage?.title || siteText('usefulLinks.random.fallbackTitle');

  const link = useMemo(() => {
    if (!links.length) return null;

    if (!pickedIdRef.current || !links.some((item) => item.id === pickedIdRef.current)) {
      pickedIdRef.current = links[Math.floor(Math.random() * links.length)].id;
    }

    return links.find((item) => item.id === pickedIdRef.current) || null;
  }, [links]);

  return (
    <section className="page-block page-block--random-pick reveal">
      <div className="container">
        <RandomPickFrame
          variant="link"
          badge={siteText('usefulLinks.random.badge')}
          icon={ADMIN_SIDEBAR_ICONS.odkazy}
          footer={(
            <Link to={listHref} className="btn btn--external">
              {siteText('usefulLinks.random.viewAll', { title: listLabel })}
            </Link>
          )}
        >
          {loading ? (
            <p className="section__empty">{siteText('usefulLinks.random.loading')}</p>
          ) : link ? (
            <>
              <div className="random-pick__cta">
                <PageBlockLinkButton
                  label={link.title}
                  href={link.url}
                  openInNewTab
                  large
                  color="blue"
                />
              </div>
              {link.description && (
                <p className="random-pick__description">{link.description}</p>
              )}
            </>
          ) : (
            <p className="section__empty">{siteText('usefulLinks.random.empty')}</p>
          )}
        </RandomPickFrame>
      </div>
    </section>
  );
}
