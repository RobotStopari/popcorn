import { SITE } from '../data/site';
import NavMenu from './NavMenu';

export default function Navbar() {
  return (
    <header className="navbar" id="navbar">
      <div className="navbar__inner container">
        <a href="/" className="navbar__brand">
          <img src={SITE.logo} alt={SITE.logoAlt} className="navbar__logo" />
          <span className="navbar__title">
            <span>{SITE.brand.line1}</span>
            <span>{SITE.brand.line2}</span>
          </span>
        </a>

        <button className="navbar__toggle" id="navToggle" type="button" aria-label="Otevřít menu" aria-expanded="false">
          <span /><span /><span />
        </button>

        <NavMenu />
      </div>
    </header>
  );
}
