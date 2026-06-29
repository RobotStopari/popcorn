import { useSiteTexts } from '../contexts/SiteTextsContext';

export default function Hero() {
  const { texts } = useSiteTexts();

  return (
    <section className="hero">
      <div className="hero__quote reveal reveal--scale">
        <h1 className="hero__text">
          <span className="hero__mark hero__mark--open" aria-hidden="true">„</span>
          {texts.heroQuote}
          <span className="hero__mark hero__mark--close" aria-hidden="true">“</span>
        </h1>
      </div>
    </section>
  );
}
