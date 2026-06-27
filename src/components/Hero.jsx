import { useSiteTexts } from '../contexts/SiteTextsContext';

export default function Hero() {
  const { texts } = useSiteTexts();

  return (
    <section className="hero">
      <blockquote className="hero__quote reveal reveal--scale">
        <p className="hero__text">
          <span className="hero__mark hero__mark--open" aria-hidden="true">„</span>
          {texts.heroQuote}
          <span className="hero__mark hero__mark--close" aria-hidden="true">“</span>
        </p>
      </blockquote>
    </section>
  );
}
