export const MENU = [
  {
    type: 'dropdown',
    label: 'O Popcornu',
    items: [
      { label: 'Co je Popcorn', href: '/co-je-popcorn' },
      { label: 'Vedení – Kontakt', href: '/vedeni-kontakt' },
      { label: 'Pro nováčky', href: '/pro-novacky' },
    ],
  },
  {
    type: 'dropdown',
    label: 'Akce',
    items: [
      { label: 'VyPUKne', href: '/vypukne' },
      { label: 'Proběhlé', href: '/probehle' },
      { label: 'Uspořádej akci!', href: '/usporadej' },
      { label: 'Kurz Zapalovač', href: 'https://kurzzapalovac.cz', external: true },
    ],
  },
  {
    type: 'dropdown',
    label: 'Inspirace',
    items: [
      { label: 'Blog', href: '/blog' },
      { label: 'Odkazy', href: '/odkazy' },
      { label: 'Zappka', href: 'https://kurzzapalovac.cz/zappka', external: true },
    ],
  },
];
