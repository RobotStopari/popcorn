import { useEffect, useState } from 'react';
import { createBlockId, parseMedallionRoles } from '../utils/page-blocks';
import { getEventCoverStyle } from '../utils/event-cover-pattern';
import MedallionRoleTags from './MedallionRoleTags';
import PageBlockImageUpload from './PageBlockImageUpload';
import RichTextEditor from './RichTextEditor';
import SortableList from './SortableList';

function PersonThumb({ person }) {
  if (person.imageUrl) {
    return (
      <img
        src={person.imageUrl}
        alt=""
        className="admin-medallions__thumb-img"
      />
    );
  }

  return (
    <span
      className="admin-medallions__thumb-pattern"
      style={getEventCoverStyle(person.id)}
      aria-hidden="true"
    />
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function DragHandleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <circle cx="9" cy="7" r="1.5" />
      <circle cx="15" cy="7" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="17" r="1.5" />
      <circle cx="15" cy="17" r="1.5" />
    </svg>
  );
}

function PersonSummary({ person, index }) {
  const roles = parseMedallionRoles(person.roles);
  const title = person.name?.trim() || `Osoba ${index + 1}`;

  return (
    <span className="admin-medallions__person-copy">
      <span className="admin-medallions__person-title">{title}</span>
      <span className="admin-medallions__person-meta">
        {person.nick?.trim() && (
          <span className="admin-medallions__person-nick">{person.nick.trim()}</span>
        )}
        {roles.length > 0 && (
          <span className="admin-medallions__person-role-count">
            {roles.length === 1 ? '1 role' : roles.length < 5 ? `${roles.length} role` : `${roles.length} rolí`}
          </span>
        )}
        {!person.nick?.trim() && !roles.length && (
          <span className="admin-medallions__person-empty">Jméno, role, kontakty</span>
        )}
      </span>
    </span>
  );
}

function PersonFields({
  person,
  index,
  open,
  canRemove,
  onToggle,
  onChange,
  onRemove,
  onHandlePointerDown,
}) {
  const prefix = `medallion-${person.id}`;
  const panelId = `${prefix}-panel`;
  const roles = parseMedallionRoles(person.roles);
  const title = person.name?.trim() || `Osoba ${index + 1}`;

  return (
    <article className={`admin-medallions__person${open ? ' is-open' : ''}`}>
      <header className="admin-medallions__person-head">
        {onHandlePointerDown && (
          <button
            type="button"
            className="admin-sortable__handle admin-medallions__handle"
            aria-label={`Přesunout ${title}`}
            onPointerDown={onHandlePointerDown}
          >
            <DragHandleIcon />
          </button>
        )}
        <button
          type="button"
          className="admin-medallions__person-toggle"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
        >
          <span className="admin-medallions__thumb">
            <PersonThumb person={person} />
          </span>
          <PersonSummary person={person} index={index} />
          <span className="admin-medallions__chevron" aria-hidden="true">
            <ChevronIcon />
          </span>
        </button>

        {canRemove && (
          <button
            type="button"
            className="btn btn--outline btn--small admin-medallions__remove"
            onClick={onRemove}
          >
            Odebrat
          </button>
        )}
      </header>

      <div
        id={panelId}
        className="admin-medallions__person-panel"
        role="region"
        aria-hidden={!open}
        inert={!open ? true : undefined}
      >
        <div className="admin-medallions__person-panel-inner">
          <div className="admin-medallions__person-body">
            <div className="admin-medallions__identity">
              <PageBlockImageUpload
                variant="avatar"
                imageUrl={person.imageUrl}
                imagePublicId={person.imagePublicId}
                previewSeed={person.id}
                onChange={(image) => onChange({ ...person, ...image })}
              />

              <div className="admin-medallions__identity-fields">
                <label className="admin-form__label" htmlFor={`${prefix}-name`}>
                  Jméno
                </label>
                <input
                  id={`${prefix}-name`}
                  className="admin-form__input"
                  value={person.name || ''}
                  onChange={(event) => onChange({ ...person, name: event.target.value })}
                  placeholder="Celé jméno"
                />

                <label className="admin-form__label" htmlFor={`${prefix}-nick`}>
                  Přezdívka
                  <span className="admin-form__label-optional"> (nepovinné)</span>
                </label>
                <input
                  id={`${prefix}-nick`}
                  className="admin-form__input"
                  value={person.nick || ''}
                  onChange={(event) => onChange({ ...person, nick: event.target.value })}
                  placeholder="Přezdívka"
                />

                <label className="admin-form__label" htmlFor={`${prefix}-roles`}>
                  Role
                  <span className="admin-form__label-optional"> (nepovinné)</span>
                </label>
                <input
                  id={`${prefix}-roles`}
                  className="admin-form__input"
                  value={person.roles || ''}
                  onChange={(event) => onChange({ ...person, roles: event.target.value })}
                  placeholder="lektorka, produkce, dobrovolnice"
                />
                <p className="admin-medallions__field-hint">
                  Slova nebo skupiny slov oddělené čárkou. Zobrazí se jako štítky pod jménem.
                </p>
                {roles.length > 0 && (
                  <MedallionRoleTags roles={person.roles} className="admin-medallions__role-preview" />
                )}
              </div>
            </div>

            <div className="admin-medallions__contacts">
              <div className="admin-medallions__contact">
                <label className="admin-form__label" htmlFor={`${prefix}-email`}>
                  E-mail
                  <span className="admin-form__label-optional"> (nepovinné)</span>
                </label>
                <input
                  id={`${prefix}-email`}
                  type="email"
                  className="admin-form__input"
                  value={person.email || ''}
                  onChange={(event) => onChange({ ...person, email: event.target.value })}
                  placeholder="email@example.com"
                />
              </div>

              <div className="admin-medallions__contact">
                <label className="admin-form__label" htmlFor={`${prefix}-phone`}>
                  Telefon
                  <span className="admin-form__label-optional"> (nepovinné)</span>
                </label>
                <input
                  id={`${prefix}-phone`}
                  type="tel"
                  className="admin-form__input"
                  value={person.phone || ''}
                  onChange={(event) => onChange({ ...person, phone: event.target.value })}
                  placeholder="+420 …"
                />
              </div>

              <div className="admin-medallions__contact">
                <label className="admin-form__label" htmlFor={`${prefix}-instagram`}>
                  Instagram
                  <span className="admin-form__label-optional"> (nepovinné)</span>
                </label>
                <input
                  id={`${prefix}-instagram`}
                  className="admin-form__input"
                  value={person.instagram || ''}
                  onChange={(event) => onChange({ ...person, instagram: event.target.value })}
                  placeholder="@uzivatel nebo URL"
                />
              </div>

              <div className="admin-medallions__contact">
                <label className="admin-form__label" htmlFor={`${prefix}-facebook`}>
                  Facebook
                  <span className="admin-form__label-optional"> (nepovinné)</span>
                </label>
                <input
                  id={`${prefix}-facebook`}
                  className="admin-form__input"
                  value={person.facebook || ''}
                  onChange={(event) => onChange({ ...person, facebook: event.target.value })}
                  placeholder="Profil nebo URL"
                />
              </div>
            </div>

            <RichTextEditor
              value={person.descriptionHtml || ''}
              onChange={(descriptionHtml) => onChange({ ...person, descriptionHtml })}
              features="medallionDescription"
              label="Popis"
            />
          </div>
        </div>
      </div>
    </article>
  );
}

export default function AdminMedallionsEditor({ people = [], onChange }) {
  const [openIds, setOpenIds] = useState(() => new Set());

  useEffect(() => {
    const ids = new Set(people.map((person) => person.id));
    setOpenIds((current) => {
      const next = new Set([...current].filter((id) => ids.has(id)));
      if (next.size === current.size && [...next].every((id) => current.has(id))) {
        return current;
      }
      return next;
    });
  }, [people]);

  const togglePerson = (id) => {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const updatePerson = (index, nextPerson) => {
    onChange({
      people: people.map((person, personIndex) => (
        personIndex === index ? nextPerson : person
      )),
    });
  };

  const addPerson = () => {
    const next = {
      id: createBlockId(),
      name: '',
      nick: '',
      roles: '',
      email: '',
      phone: '',
      instagram: '',
      facebook: '',
      descriptionHtml: '',
      imageUrl: '',
      imagePublicId: '',
    };
    onChange({ people: [...people, next] });
    setOpenIds((current) => new Set([...current, next.id]));
  };

  const removePerson = (index) => {
    if (people.length <= 1) return;
    const removed = people[index];
    onChange({
      people: people.filter((_, personIndex) => personIndex !== index),
    });
    setOpenIds((current) => {
      const next = new Set(current);
      next.delete(removed.id);
      return next;
    });
  };

  return (
    <div className="admin-medallions">
      <SortableList
        items={people}
        onReorder={(nextPeople) => onChange({ people: nextPeople })}
        integratedHandle
        listClassName="admin-medallions__list"
        itemClassName="admin-medallions__item admin-sortable__item"
        ghostClassName="admin-medallions__ghost"
        handleLabel="Přesunout medailonek"
        renderItem={(person, index, onHandlePointerDown) => (
          <PersonFields
            person={person}
            index={index}
            open={openIds.has(person.id)}
            canRemove={people.length > 1}
            onToggle={() => togglePerson(person.id)}
            onChange={(nextPerson) => updatePerson(index, nextPerson)}
            onRemove={() => removePerson(index)}
            onHandlePointerDown={people.length > 1 ? onHandlePointerDown : null}
          />
        )}
        renderGhostItem={(person, index) => (
          <article className="admin-medallions__person admin-medallions__person--ghost">
            <header className="admin-medallions__person-head">
              <span className="admin-sortable__handle admin-sortable__handle--ghost admin-medallions__handle">
                <DragHandleIcon />
              </span>
              <span className="admin-medallions__thumb">
                <PersonThumb person={person} />
              </span>
              <PersonSummary person={person} index={index} />
            </header>
          </article>
        )}
      />

      <button
        type="button"
        className="btn btn--outline admin-medallions__add"
        onClick={addPerson}
      >
        Přidat osobu
      </button>
    </div>
  );
}
