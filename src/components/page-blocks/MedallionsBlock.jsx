import { useMemo, useState } from 'react';
import { buildPersonContactLinks } from '../../utils/contact-links';
import { getEventCoverStyle } from '../../utils/event-cover-pattern';
import { stripMedallionDescriptionPreview } from '../../utils/page-blocks';
import MedallionDetailModal from '../MedallionDetailModal';
import PersonContactLink from '../PersonContactLink';

function MedallionPhoto({ person }) {
  if (person.imageUrl) {
    return (
      <img
        src={person.imageUrl}
        alt={person.name || ''}
        className="page-block__medallion-photo-img"
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <div
      className="page-block__medallion-photo-pattern"
      style={getEventCoverStyle(person.id)}
      aria-hidden="true"
    />
  );
}

function MedallionCard({ person, onOpen }) {
  const links = buildPersonContactLinks(person);
  const descriptionPreview = useMemo(
    () => stripMedallionDescriptionPreview(person.descriptionHtml),
    [person.descriptionHtml],
  );

  const hasContacts = Boolean(
    links.emailHref
    || links.phoneHref
    || links.instagramHref
    || links.facebookHref,
  );
  const hasDescription = Boolean(descriptionPreview.plain);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpen(person);
    }
  };

  return (
    <article
      className="page-block__medallion-card reveal"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(person)}
      onKeyDown={handleKeyDown}
      aria-label={`Otevřít medailonek: ${person.name}`}
    >
      <div className="page-block__medallion-top">
        <div className="page-block__medallion-photo">
          <MedallionPhoto person={person} />
        </div>
      </div>

      <div className="page-block__medallion-body">
        <div className="page-block__medallion-heading">
          <h3 className="page-block__medallion-name">{person.name}</h3>
          {person.nick?.trim() && (
            <p className="page-block__medallion-nick">{person.nick.trim()}</p>
          )}
        </div>

        {hasContacts && (
          <div
            className="page-block__medallion-links"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <PersonContactLink type="email" href={links.emailHref} label={person.email} />
            <PersonContactLink type="phone" href={links.phoneHref} label={person.phone} />
            <PersonContactLink
              type="instagram"
              href={links.instagramHref}
              label="Instagram"
              tooltip={person.instagram}
              external
            />
            <PersonContactLink
              type="facebook"
              href={links.facebookHref}
              label="Facebook"
              tooltip={person.facebook}
              external
            />
          </div>
        )}

        {hasDescription && (
          <p className="page-block__medallion-description">
            {descriptionPreview.plain}
            {descriptionPreview.truncated && '…'}
          </p>
        )}

        <span className="page-block__medallion-cta">
          {descriptionPreview.truncated ? 'Číst více' : 'Zobrazit profil'}
        </span>
      </div>
    </article>
  );
}

export default function MedallionsBlock({ block }) {
  const [activePerson, setActivePerson] = useState(null);
  const people = (block.people || []).filter((person) => person?.name?.trim());

  if (!people.length) return null;

  return (
    <>
      <section className="page-block page-block--medallions">
        <div className="container">
          <div className="page-block__content">
            <div className="page-block__medallions-grid">
              {people.map((person) => (
                <MedallionCard
                  key={person.id}
                  person={person}
                  onOpen={setActivePerson}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <MedallionDetailModal
        person={activePerson}
        open={Boolean(activePerson)}
        onClose={() => setActivePerson(null)}
      />
    </>
  );
}
