import { createBlockId } from '../utils/page-blocks';
import PageBlockImageUpload from './PageBlockImageUpload';
import RichTextEditor from './RichTextEditor';

function PersonFields({ person, index, canRemove, onChange, onRemove }) {
  const prefix = `medallion-${person.id}`;

  return (
    <article className="admin-medallions__person">
      <header className="admin-medallions__person-head">
        <h4 className="admin-medallions__person-title">
          {person.name?.trim() || `Osoba ${index + 1}`}
        </h4>
        {canRemove && (
          <button
            type="button"
            className="btn btn--outline btn--small"
            onClick={onRemove}
          >
            Odebrat
          </button>
        )}
      </header>

      <PageBlockImageUpload
        variant="square"
        imageUrl={person.imageUrl}
        imagePublicId={person.imagePublicId}
        previewSeed={person.id}
        onChange={(image) => onChange({ ...person, ...image })}
      />

      <div className="admin-medallions__fields">
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

        <label className="admin-form__label" htmlFor={`${prefix}-instagram`}>
          Instagram
          <span className="admin-form__label-optional"> (nepovinné)</span>
        </label>
        <input
          id={`${prefix}-instagram`}
          className="admin-form__input"
          value={person.instagram || ''}
          onChange={(event) => onChange({ ...person, instagram: event.target.value })}
          placeholder="@uzivatel nebo celá URL"
        />

        <label className="admin-form__label" htmlFor={`${prefix}-facebook`}>
          Facebook
          <span className="admin-form__label-optional"> (nepovinné)</span>
        </label>
        <input
          id={`${prefix}-facebook`}
          className="admin-form__input"
          value={person.facebook || ''}
          onChange={(event) => onChange({ ...person, facebook: event.target.value })}
          placeholder="Profil nebo celá URL"
        />
      </div>

      <RichTextEditor
        value={person.descriptionHtml || ''}
        onChange={(descriptionHtml) => onChange({ ...person, descriptionHtml })}
        features="medallionDescription"
        label="Popis"
      />
    </article>
  );
}

export default function AdminMedallionsEditor({ people = [], onChange }) {
  const updatePerson = (index, nextPerson) => {
    onChange({
      people: people.map((person, personIndex) => (
        personIndex === index ? nextPerson : person
      )),
    });
  };

  const addPerson = () => {
    onChange({
      people: [
        ...people,
        {
          id: createBlockId(),
          name: '',
          nick: '',
          email: '',
          phone: '',
          instagram: '',
          facebook: '',
          descriptionHtml: '',
          imageUrl: '',
          imagePublicId: '',
        },
      ],
    });
  };

  const removePerson = (index) => {
    if (people.length <= 1) return;
    onChange({
      people: people.filter((_, personIndex) => personIndex !== index),
    });
  };

  return (
    <div className="admin-medallions">
      {people.map((person, index) => (
        <PersonFields
          key={person.id}
          person={person}
          index={index}
          canRemove={people.length > 1}
          onChange={(nextPerson) => updatePerson(index, nextPerson)}
          onRemove={() => removePerson(index)}
        />
      ))}

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
