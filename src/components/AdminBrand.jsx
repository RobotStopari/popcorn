import { SITE } from '../data/site';

export default function AdminBrand({ className = '', onClick }) {
  return (
    <a
      href="/admin"
      className={`navbar__brand admin-navbar__brand${className ? ` ${className}` : ''}`}
      onClick={onClick}
    >
      <img src={SITE.logo} alt={SITE.logoAlt} className="navbar__logo" />
      <span className="navbar__title admin-navbar__title">
        <span>Administrace webu</span>
        <span>Popcornu</span>
      </span>
    </a>
  );
}
