import { EVENT_CATEGORIES } from './event-categories';

export const SITE_TEXTS_DOC_ID = 'config';

export const DEFAULT_SITE_TEXTS = {
  heroQuote:
    'Komunita absolventů kurzu Zapalovač s cílem neformálně se rozvíjet a sdílet své zkušenosti.',
  upcomingIntro:
    'Těšíme se na setkání s vámi na těchto akcích. Vyberte si tu svou a přijďte zažít společné chvíle s komunitou Popcorn.',
  pastIntro:
    'Za námi už je spousta skvělých setkání a zážitků. Prohlédněte si, co všechno jsme společně prožili.',
  blogIntro:
    'Inspirace, zkušenosti a příběhy z komunity Popcorn. Prohlédněte si naše blogové příspěvky.',
  eventCategoryPublicLabel: EVENT_CATEGORIES.public.label,
  eventCategoryPublicDescription: EVENT_CATEGORIES.public.description,
  eventCategoryPrivateLabel: EVENT_CATEGORIES.private.label,
  eventCategoryPrivateDescription: EVENT_CATEGORIES.private.description,
  eventCategoryExternalLabel: EVENT_CATEGORIES.external.label,
  eventCategoryExternalDescription: EVENT_CATEGORIES.external.description,
};

export const SITE_TEXT_SECTIONS = [
  { id: 'general', title: 'Obecné texty' },
  { id: 'eventCategories', title: 'Kategorie akcí' },
];

export const SITE_TEXT_FIELDS = [
  {
    id: 'heroQuote',
    section: 'general',
    label: 'Úvodní citát',
    hint: 'Hlavní stránka — velký citát pod logem',
    minRows: 2,
    inputType: 'textarea',
  },
  {
    id: 'upcomingIntro',
    section: 'general',
    label: 'Úvodní text VyPUKne',
    hint: 'Stránka se všemi nadcházejícími akcemi',
    minRows: 2,
    inputType: 'textarea',
  },
  {
    id: 'pastIntro',
    section: 'general',
    label: 'Úvodní text Proběhlé',
    hint: 'Stránka se všemi proběhlými akcemi',
    minRows: 2,
    inputType: 'textarea',
  },
  {
    id: 'blogIntro',
    section: 'general',
    label: 'Úvodní text Blog',
    hint: 'Stránka se všemi blogovými příspěvky',
    minRows: 2,
    inputType: 'textarea',
  },
  {
    id: 'eventCategoryPublicLabel',
    section: 'eventCategories',
    label: 'Veřejná akce — název',
    hint: 'Karty, kalendář, legenda, admin i stránka akce',
    inputType: 'text',
  },
  {
    id: 'eventCategoryPublicDescription',
    section: 'eventCategories',
    label: 'Veřejná akce — popis na stránce akce',
    hint: 'Zobrazí se za dvojtečkou pod názvem akce',
    minRows: 2,
    inputType: 'textarea',
  },
  {
    id: 'eventCategoryPrivateLabel',
    section: 'eventCategories',
    label: 'Soukromá akce — název',
    hint: 'Karty, kalendář, legenda, admin i stránka akce',
    inputType: 'text',
  },
  {
    id: 'eventCategoryPrivateDescription',
    section: 'eventCategories',
    label: 'Soukromá akce — popis na stránce akce',
    hint: 'Zobrazí se za dvojtečkou pod názvem akce',
    minRows: 2,
    inputType: 'textarea',
  },
  {
    id: 'eventCategoryExternalLabel',
    section: 'eventCategories',
    label: 'Akce mimo Popcorn — název',
    hint: 'Karty, kalendář, legenda, admin i stránka akce',
    inputType: 'text',
  },
  {
    id: 'eventCategoryExternalDescription',
    section: 'eventCategories',
    label: 'Akce mimo Popcorn — popis na stránce akce',
    hint: 'Zobrazí se za dvojtečkou pod názvem akce',
    minRows: 2,
    inputType: 'textarea',
  },
];

export const SITE_TEXT_FIELD_IDS = SITE_TEXT_FIELDS.map((field) => field.id);
