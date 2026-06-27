import { SOCIALS } from '../data/socials';

export default function SocialBand() {
  const bandSocials = SOCIALS.filter((s) => s.showInBand);

  return (
    <div className="social-row reveal-stagger">
      {bandSocials.map((social) => (
        <a
          key={social.id}
          href={social.href}
          className={`social-btn social-btn--${social.id} shine-hover reveal`}
          aria-label={social.label}
        >
          <span dangerouslySetInnerHTML={{ __html: social.icon }} />
          <span>{social.label}</span>
        </a>
      ))}
    </div>
  );
}
