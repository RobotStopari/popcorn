import { ICONS } from './icons.js';

/** Social links shown in the parallax band and footer */
export const SOCIALS = [
  {
    id: 'instagram',
    label: 'Instagram',
    href: 'https://www.instagram.com/popcorn_puk/',
    icon: ICONS.instagram,
    showInBand: true,
    showInFooter: true,
  },
  {
    id: 'facebook',
    label: 'Facebook',
    href: 'https://www.facebook.com/groups/popcorn.puk',
    icon: ICONS.facebook,
    showInBand: true,
    showInFooter: true,
  },
  {
    id: 'komunita',
    label: 'Komunita',
    href: 'mailto:popcorn@kurzzapalovac.cz',
    icon: ICONS.email,
    showInBand: true,
    showInFooter: false,
  },
  {
    id: 'email',
    label: 'E-mail',
    href: 'mailto:popcorn@kurzzapalovac.cz',
    icon: ICONS.email,
    showInBand: false,
    showInFooter: true,
  },
];
