import {
  CARD_CAROUSEL_DESCRIPTION_MAX,
  CARD_CAROUSEL_MAX_CARDS,
  CARD_CAROUSEL_MIN_CARDS,
} from '../data/page-blocks';
import { pagePath } from '../data/pages';
import { MENU_LINK_TYPES } from '../data/site-menu';
import { usePages } from '../contexts/PagesContext';
import { createBlockId } from '../utils/page-blocks';
import PageBlockImageUpload from './PageBlockImageUpload';
import PageCombobox from './PageCombobox';
import UrlInput from './UrlInput';

function ExternalToggle({ checked, onChange }) {
  return (
    <div className="admin-toggle admin-carousel-cards__toggle" role="group">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className="admin-carousel-cards__switch"
        onClick={() => onChange(!checked)}
      >
        <span className={`admin-toggle__track${checked ? ' admin-toggle__track--on' : ''}`} aria-hidden="true">
          <span className="admin-toggle__thumb" />
        </span>
      </button>
      <span className="admin-toggle__label">Otevřít v novém okně</span>
    </div>
  );
}

function CardFields({ card, index, canRemove, onChange, onRemove, pages }) {
  const prefix = `carousel-card-${card.id}`;
  const isPageLink = card.linkType !== MENU_LINK_TYPES.custom;
  const selectedPage = pages.find((page) => page.id === card.pageId);

  const handleLinkTypeChange = (linkType) => {
    if (linkType === MENU_LINK_TYPES.page) {
      onChange({
        ...card,
        linkType,
        href: '',
      });
      return;
    }

    onChange({
      ...card,
      linkType,
      pageId: '',
      external: true,
    });
  };

  return (
    <article className="admin-carousel-cards__card">
      <header className="admin-carousel-cards__card-head">
        <h4 className="admin-carousel-cards__card-title">
          {card.title?.trim() || `Karta ${index + 1}`}
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
        imageUrl={card.imageUrl}
        imagePublicId={card.imagePublicId}
        previewSeed={card.id}
        onChange={(image) => onChange({ ...card, ...image })}
      />

      <div className="admin-carousel-cards__fields">
        <label className="admin-form__label" htmlFor={`${prefix}-title`}>
          Nadpis
        </label>
        <input
          id={`${prefix}-title`}
          className="admin-form__input"
          value={card.title || ''}
          onChange={(event) => onChange({ ...card, title: event.target.value })}
          placeholder="Název karty"
        />

        <label className="admin-form__label" htmlFor={`${prefix}-description`}>
          Krátký popis
          <span className="admin-form__label-optional">
            {' '}
            (max. {CARD_CAROUSEL_DESCRIPTION_MAX} znaků)
          </span>
        </label>
        <textarea
          id={`${prefix}-description`}
          className="admin-form__input admin-form__textarea"
          value={card.description || ''}
          maxLength={CARD_CAROUSEL_DESCRIPTION_MAX}
          rows={3}
          onChange={(event) => onChange({ ...card, description: event.target.value })}
          placeholder="Krátký popis karty"
        />

        <span className="admin-form__label">Odkaz</span>
        <div className="admin-menu-link-types" role="group" aria-label="Typ odkazu">
          <button
            type="button"
            className={`admin-menu-link-types__btn${isPageLink ? ' admin-menu-link-types__btn--active' : ''}`}
            onClick={() => handleLinkTypeChange(MENU_LINK_TYPES.page)}
          >
            Stránka webu
          </button>
          <button
            type="button"
            className={`admin-menu-link-types__btn${!isPageLink ? ' admin-menu-link-types__btn--active' : ''}`}
            onClick={() => handleLinkTypeChange(MENU_LINK_TYPES.custom)}
          >
            Vlastní odkaz
          </button>
        </div>

        {isPageLink ? (
          <>
            <label className="admin-form__label" htmlFor={`${prefix}-page`}>
              Stránka
            </label>
            <PageCombobox
              id={`${prefix}-page`}
              pages={pages}
              value={card.pageId}
              onChange={(pageId) => onChange({ ...card, pageId })}
            />
            {selectedPage && (
              <p className="admin-form__hint">
                Cíl: {pagePath(selectedPage)}
              </p>
            )}
            <ExternalToggle
              checked={Boolean(card.external)}
              onChange={(external) => onChange({ ...card, external })}
            />
          </>
        ) : (
          <>
            <label className="admin-form__label" htmlFor={`${prefix}-href`}>
              URL adresa
            </label>
            <UrlInput
              id={`${prefix}-href`}
              value={card.href || ''}
              onChange={(next) => onChange({ ...card, href: next })}
            />
            <p className="admin-form__hint">
              Externí odkaz se vždy otevře v novém okně.
            </p>
          </>
        )}
      </div>
    </article>
  );
}

export default function AdminCarouselCardsEditor({ cards = [], onChange }) {
  const { pages } = usePages();

  const updateCard = (index, nextCard) => {
    onChange({
      cards: cards.map((card, cardIndex) => (
        cardIndex === index ? nextCard : card
      )),
    });
  };

  const addCard = () => {
    if (cards.length >= CARD_CAROUSEL_MAX_CARDS) return;
    onChange({
      cards: [
        ...cards,
        {
          id: createBlockId(),
          title: '',
          description: '',
          imageUrl: '',
          imagePublicId: '',
          imageAlt: '',
          linkType: MENU_LINK_TYPES.page,
          pageId: '',
          href: '',
          external: false,
        },
      ],
    });
  };

  const removeCard = (index) => {
    if (cards.length <= CARD_CAROUSEL_MIN_CARDS) return;
    onChange({
      cards: cards.filter((_, cardIndex) => cardIndex !== index),
    });
  };

  return (
    <div className="admin-carousel-cards">
      {cards.map((card, index) => (
        <CardFields
          key={card.id}
          card={card}
          index={index}
          pages={pages}
          canRemove={cards.length > CARD_CAROUSEL_MIN_CARDS}
          onChange={(nextCard) => updateCard(index, nextCard)}
          onRemove={() => removeCard(index)}
        />
      ))}

      {cards.length < CARD_CAROUSEL_MAX_CARDS && (
        <button
          type="button"
          className="btn btn--outline admin-carousel-cards__add"
          onClick={addCard}
        >
          Přidat kartu
        </button>
      )}
    </div>
  );
}
