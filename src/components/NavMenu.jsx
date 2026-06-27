import { Link } from 'react-router-dom';
import { ICONS } from '../data/icons';
import { MENU_ITEM_TYPES } from '../data/site-menu';
import { useSiteMenu } from '../contexts/SiteMenuContext';

function NavLinkContent({ link }) {
  return (
    <>
      <span className="nav-link__label">{link.label}</span>
      {link.external && (
        <span
          className="nav-link__external"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: ICONS.externalLink }}
        />
      )}
    </>
  );
}

function NavLink({ link, topLevel = false }) {
  const className = topLevel ? 'nav-btn nav-link' : 'nav-link';
  const isInternal = link.href.startsWith('/') && !link.href.startsWith('//');

  if (isInternal && !link.external) {
    return (
      <Link to={link.href} className={className}>
        <NavLinkContent link={link} />
      </Link>
    );
  }

  return (
    <a
      href={link.href}
      className={className}
      target={link.external ? '_blank' : undefined}
      rel={link.external ? 'noopener noreferrer' : undefined}
    >
      <NavLinkContent link={link} />
    </a>
  );
}

function NavDropdown({ item }) {
  return (
    <div className="nav-dropdown">
      <button type="button" className="nav-btn nav-btn--dropdown" aria-expanded="false">
        {item.label}
        <span dangerouslySetInnerHTML={{ __html: ICONS.chevron }} />
      </button>
      <ul className="nav-dropdown__menu">
        {item.items.map((link) => (
          <li key={link.id}>
            <NavLink link={link} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function NavMenu() {
  const { menu, loading } = useSiteMenu();

  if (loading) {
    return (
      <nav className="navbar__nav" id="navMenu" aria-label="Hlavní navigace">
        <span className="navbar__nav-loading">Načítám menu…</span>
      </nav>
    );
  }

  return (
    <nav className="navbar__nav" id="navMenu" aria-label="Hlavní navigace">
      {menu.map((item) => (
        item.type === MENU_ITEM_TYPES.dropdown
          ? <NavDropdown key={item.id} item={item} />
          : <NavLink key={item.id} link={item} topLevel />
      ))}
    </nav>
  );
}
