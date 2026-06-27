import { SITE } from '../data/site';

export default function Loader() {
  return (
    <div id="pageLoader" className="loader" role="status" aria-live="polite" aria-label="Načítání stránky">
      <div className="loader__inner">
        <div className="loader__burst" aria-hidden="true">
          <span /><span /><span /><span /><span /><span />
        </div>
        <div className="loader__logo-wrap">
          <img src={SITE.logo} alt="" className="loader__logo" width="120" height="120" />
        </div>
        <p className="loader__tagline">{SITE.tagline}</p>
        <div className="loader__bar" aria-hidden="true">
          <span className="loader__bar-fill" />
        </div>
      </div>
    </div>
  );
}
