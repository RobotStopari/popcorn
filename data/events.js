/** Build URL for an event detail page */
export function eventUrl(id) {
  return `event.html?id=${encodeURIComponent(id)}`;
}

/** Card events for upcoming / past sections */
export const CARD_EVENTS = {
  upcoming: [
    {
      id: 'leto',
      name: 'Letní setkání Popcorn',
      dateStart: '2026-07-11',
      dateEnd: '2026-07-12',
      timeStart: '10:00',
      timeEnd: '16:00',
      dateLabel: '11.–12. července 2026',
      image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=400&fit=crop',
      imageAlt: 'Letní setkání Popcorn',
      description:
        'Letní setkání celé komunity Popcorn na louce u lesa. Dva dny sdílení, her, ohně a společného času. Přijď s nápadem na aktivitu nebo jen tak — prostor je pro všechny.',
      sraz: 'Sobota 11. 7., 10:00',
      navrat: 'Neděle 12. 7., cca 16:00',
      misto: 'Areál U Popelky, Jílové u Prahy',
      cena: '800 Kč / účastník',
      organisers: {
        label: 'Organizátoři',
        contacts: [
          { name: 'Jana Nováková', email: 'jana@example.cz', phone: '+420 777 111 222' },
          { name: 'Petr Svoboda', email: 'petr@example.cz' },
        ],
      },
      participants: [
        'Marie Horáková',
        'Tomáš Dvořák',
        'Lucie Černá',
        'Martin Procházka',
        'Eva Malá',
      ],
      registerHref: 'mailto:popcornvedeni@kurzzapalovac.cz?subject=Přihláška%20–%20Letní%20setkání',
      images: [
        {
          src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=600&fit=crop',
          alt: 'Skupina u ohně',
        },
        {
          src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
          alt: 'Letní krajina',
        },
        {
          src: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800&h=600&fit=crop',
          alt: 'Stanování',
        },
      ],
      action: { type: 'link', label: 'Více informací', href: eventUrl('leto') },
    },
    {
      id: 'workshop',
      name: 'Workshop sdílení',
      dateStart: '2026-08-22',
      dateEnd: '2026-08-23',
      timeStart: '09:30',
      timeEnd: '17:00',
      dateLabel: '22.–23. srpna 2026',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop',
      imageAlt: 'Workshop sdílení',
      description:
        'Praktický workshop zaměřený na sdílení zkušeností z kurzu Zapalovač. Probereme facilitaci kruhu, práci s emocemi ve skupině a jak vést bezpečný prostor.',
      sraz: 'Sobota 22. 8., 9:30',
      navrat: 'Neděle 23. 8., 17:00',
      misto: 'Centrum Zapalovač, Praha 3',
      cena: '500 Kč / účastník',
      organisers: {
        label: 'Organizátoři',
        contacts: [{ name: 'Klára Benešová', email: 'klara@example.cz', phone: '+420 603 444 555' }],
      },
      participants: ['David Kučera', 'Hana Veselá'],
      registerHref: 'mailto:popcornvedeni@kurzzapalovac.cz?subject=Přihláška%20–%20Workshop%20sdílení',
      images: [
        {
          src: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop',
          alt: 'Workshop v kruhu',
        },
      ],
      action: { type: 'link', label: 'Více informací', href: eventUrl('workshop') },
    },
    {
      id: 'podzim',
      name: 'Podzimní vypuknutí',
      dateStart: '2026-10-03',
      dateEnd: '2026-10-04',
      timeStart: '11:00',
      timeEnd: '15:30',
      dateLabel: '3.–4. října 2026',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop',
      imageAlt: 'Podzimní vypuknutí',
      description:
        'Podzimní vypuknutí komunity — společné uvítání nového ročníku, reflexe léta a plánování akcí na zimu. Včetně večerního kruhu a podzimního grilování.',
      sraz: 'Sobota 3. 10., 11:00',
      navrat: 'Neděle 4. 10., 15:30',
      misto: 'Chata Popcorn, Brdy',
      cena: '650 Kč / účastník',
      organisers: {
        label: 'Organizátoři',
        contacts: [
          { name: 'Popcorn vedení', email: 'popcornvedeni@kurzzapalovac.cz' },
        ],
      },
      participants: [],
      registerHref: 'mailto:popcornvedeni@kurzzapalovac.cz?subject=Přihláška%20–%20Podzimní%20vypuknutí',
      images: [],
      action: { type: 'link', label: 'Více informací', href: eventUrl('podzim') },
    },
  ],
  past: [
    {
      id: 'jaro',
      name: 'Jarní vypuknutí 2026',
      dateStart: '2026-03-14',
      dateLabel: '14.–15. března 2026',
      image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop',
      imageAlt: 'Jarní vypuknutí 2026',
      report: [
        'Jarní vypuknutí 2026 přivítalo rekordních 42 účastníků z celé republiky. Sobota začala ranním kruhem sdílení, kde každý přinesl jednu věc, kterou chce v komunitě rozvíjet.',
        'Odpoledne patřilo workshopům v menších skupinách — facilitace, práce s konfliktem a tvorba komunitních rituálů. Večer jsme seděli u ohně až do půlnoci.',
        'Neděli jsme zakončili společným plánováním akcí na rok. Vzniklo pět nových nápadů na setkání a dva týmy se přihlásily k organizaci letního tábora.',
      ],
      gallery: [
        {
          src: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=600&fit=crop',
          alt: 'Ranní kruh',
        },
        {
          src: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&h=600&fit=crop',
          alt: 'Workshop ve skupině',
        },
        {
          src: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800&h=600&fit=crop',
          alt: 'Večer u ohně',
        },
        {
          src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=600&fit=crop',
          alt: 'Společná fotka',
        },
      ],
      galleryDriveHref: 'https://drive.google.com/drive/folders/example-jaro-2026',
      action: { type: 'link', label: 'Přečíst o akci', href: eventUrl('jaro') },
    },
    {
      id: 'zima',
      name: 'Zimní setkání',
      dateStart: '2026-01-17',
      dateLabel: '17.–18. ledna 2026',
      image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&h=400&fit=crop',
      imageAlt: 'Zimní setkání',
      report: [
        'Zimní setkání v horách nás spojilo kolem společného vaření, procházek v zasněženém lese a večerních her u krbu.',
        'Hlavním tématem bylo udržení kontaktu v zimním období — sdíleli jsme tipy, jak si navzájem držet energii, když se komunita vidí méně často.',
      ],
      gallery: [
        {
          src: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&h=600&fit=crop',
          alt: 'Zimní chata',
        },
        {
          src: 'https://images.unsplash.com/photo-1418985991508-e47386d96a71?w=800&h=600&fit=crop',
          alt: 'Procházka v lese',
        },
      ],
      galleryDriveHref: 'https://drive.google.com/drive/folders/example-zima-2026',
      action: { type: 'link', label: 'Přečíst o akci', href: eventUrl('zima') },
    },
    {
      id: 'silvestr',
      name: 'Silvestrovské vypuknutí',
      dateStart: '2025-12-28',
      dateLabel: '28.–29. prosince 2025',
      image: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=600&h=400&fit=crop',
      imageAlt: 'Silvestrovské vypuknutí',
      report: [
        'Silvestrovské vypuknutí bylo oslavou konce roku a přivítání nového. Společně jsme reflektovali, co komunita Popcorn zvládla v roce 2025.',
        'Silvestrovská noc patřila hudbě, tanci a přípitku na další rok plný setkávání. Ráno 29. prosince jsme se rozešli s plnými srdci a novými přátelstvími.',
      ],
      gallery: [
        {
          src: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&h=600&fit=crop',
          alt: 'Silvestrovská oslava',
        },
        {
          src: 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=800&h=600&fit=crop',
          alt: 'Ohňostroj',
        },
        {
          src: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&h=600&fit=crop',
          alt: 'Společná večeře',
        },
      ],
      galleryDriveHref: 'https://drive.google.com/drive/folders/example-silvestr-2025',
      action: { type: 'link', label: 'Přečíst o akci', href: eventUrl('silvestr') },
    },
  ],
};

/** Calendar events (multi-day bars) */
export const CALENDAR_EVENTS = [
  { id: 'silvestr', name: 'Silvestrovské vypuknutí', start: '2025-12-28', end: '2025-12-29', past: true },
  { id: 'zima', name: 'Zimní setkání', start: '2026-01-17', end: '2026-01-18', past: true },
  { id: 'jaro', name: 'Jarní vypuknutí 2026', start: '2026-03-14', end: '2026-03-15', past: true },
  { id: 'vikend', name: 'Komunitní víkend', start: '2026-06-20', end: '2026-06-22', past: true },
  { id: 'openspace', name: 'Open space', start: '2026-06-21', end: '2026-06-23', past: true },
  { id: 'kafe', name: 'Ranní kafe', start: '2026-06-24', end: '2026-06-24', past: true },
  { id: 'sdileni', name: 'Večerní sdílení', start: '2026-06-24', end: '2026-06-24', past: true },
  { id: 'vedeni', name: 'Setkání vedení', start: '2026-06-24', end: '2026-06-24', past: true },
  { id: 'tabor', name: 'Popcorn tábor', start: '2026-06-28', end: '2026-07-05', past: false },
  { id: 'leto', name: 'Letní setkání Popcorn', start: '2026-07-11', end: '2026-07-12', past: false },
  { id: 'workshop', name: 'Workshop sdílení', start: '2026-08-22', end: '2026-08-23', past: false },
  { id: 'workshop2', name: 'Workshop facilitace', start: '2026-08-22', end: '2026-08-22', past: false },
  { id: 'podzim', name: 'Podzimní vypuknutí', start: '2026-10-03', end: '2026-10-04', past: false },
];

export const CALENDAR_LOCALE = {
  months: [
    'leden', 'únor', 'březen', 'duben', 'květen', 'červen',
    'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec',
  ],
  weekdays: ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'],
};

/** Find a card event by id; returns { event, past } or null */
export function getEventById(id) {
  const upcoming = CARD_EVENTS.upcoming.find((e) => e.id === id);
  if (upcoming) return { event: upcoming, past: false };

  const past = CARD_EVENTS.past.find((e) => e.id === id);
  if (past) return { event: past, past: true };

  return null;
}
