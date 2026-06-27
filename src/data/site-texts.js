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
};

export const SITE_TEXT_FIELDS = [
  {
    id: 'heroQuote',
    label: 'Úvodní citát',
    hint: 'Hlavní stránka — velký citát pod logem',
    minRows: 2,
  },
  {
    id: 'upcomingIntro',
    label: 'Úvodní text VyPUKne',
    hint: 'Stránka se všemi nadcházejícími akcemi',
    minRows: 2,
  },
  {
    id: 'pastIntro',
    label: 'Úvodní text Proběhlé',
    hint: 'Stránka se všemi proběhlými akcemi',
    minRows: 2,
  },
  {
    id: 'blogIntro',
    label: 'Úvodní text Blog',
    hint: 'Stránka se všemi blogovými příspěvky',
    minRows: 2,
  },
];
