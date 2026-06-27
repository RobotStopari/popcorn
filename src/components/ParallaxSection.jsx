import SocialBand from './SocialBand';

export default function ParallaxSection() {
  return (
    <section className="parallax-section">
      <div className="parallax-section__bg" id="parallaxBg" />
      <div className="parallax-section__overlay" />
      <div className="parallax-section__content container">
        <SocialBand />
      </div>
    </section>
  );
}
