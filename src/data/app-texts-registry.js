import { ADMIN_TEXTS, SITE_UI_TEXTS } from './admin-texts';

const FIELD_DESCRIPTIONS = {
  'admin.shell.documentTitle': 'Šablona titulku záložky pro stránky administrace. Použijte {section} pro název sekce.',
  'admin.shell.navbar.profileAria': 'Aria popisek profilového menu. Použijte {label} pro jméno uživatele.',
  'site.blog.card.editAriaLabel': 'Aria popisek tlačítka úpravy příspěvku. Použijte {title} pro název.',
  'site.blog.card.deleteAriaLabel': 'Aria popisek tlačítka smazání příspěvku. Použijte {title} pro název.',
  'site.blog.detail.editAriaLabel': 'Aria popisek úpravy na stránce příspěvku. Použijte {title}.',
  'site.blog.detail.deleteAriaLabel': 'Aria popisek smazání na stránce příspěvku. Použijte {title}.',
  'site.blog.stats.ariaLabel': 'Aria popisek počtu reakcí. Použijte {likeCount} a {commentCount}.',
  'site.blog.profile.menuAriaLabel': 'Aria popisek profilového menu na blogu. Použijte {label}.',
  'site.blog.card.externalLinkTitle': 'Tooltip ikony odkazu na externí článek v kartě příspěvku.',
  'site.blog.card.externalLinkAriaLabel': 'Aria popisek odkazu na externí článek. Použijte {title} pro název příspěvku.',
  'admin.blog.form.errors.keywordsTooMany': 'Chybová hláška při překročení počtu klíčových slov. Použijte {max} pro limit.',
  'site.events.pagination.status': 'Text stránkování akcí. Použijte {page} a {totalPages}.',
  'site.events.gallery.openImageWithAlt': 'Aria popisek galerie s popisem obrázku. Použijte {alt}.',
  'site.events.gallery.openImage': 'Aria popisek galerie bez popisu. Použijte {index} pro pořadí.',
  'site.instagram.openProfile': 'Tlačítko otevření profilu. Použijte {handle} pro @jméno.',
  'site.common.documentTitleSuffix': 'Přípona titulku záložky veřejných stránek (za názvem stránky).',
};

export const APP_TEXT_CATEGORIES = [
  {
    id: 'admin-shell',
    scope: 'admin',
    prefix: 'shell.',
    title: 'Administrace — navigace',
    description: 'Postranní panel, záhlaví administrace a titulky záložek.',
  },
  {
    id: 'admin-common',
    scope: 'admin',
    prefix: 'common.',
    title: 'Administrace — společné',
    description: 'Tlačítka, načítání, sloupce tabulek a sdílené hlášky v administraci.',
  },
  {
    id: 'admin-auth',
    scope: 'admin',
    prefix: 'auth.',
    title: 'Administrace — přihlášení',
    description: 'Přihlašovací obrazovka a chybové hlášky přístupu.',
  },
  {
    id: 'admin-profile',
    scope: 'admin',
    prefix: 'profile.',
    title: 'Administrace — profil',
    description: 'Úprava a mazání profilu v administraci.',
  },
  {
    id: 'admin-users',
    scope: 'admin',
    prefix: 'users.',
    title: 'Administrace — uživatelé',
    description: 'Seznam uživatelů, vyhledávání a dialogy mazání.',
  },
  {
    id: 'admin-blog',
    scope: 'admin',
    prefix: 'blog.',
    title: 'Administrace — blog',
    description: 'Správa příspěvků, formuláře a komentářů v administraci.',
  },
  {
    id: 'admin-events',
    scope: 'admin',
    prefix: 'events.',
    title: 'Administrace — akce',
    description: 'Správa akcí, filtry a stavy v administraci.',
  },
  {
    id: 'admin-notifications',
    scope: 'admin',
    prefix: 'notifications.',
    title: 'Administrace — upozornění',
    description: 'Vyskakovací upozornění a jejich formulář.',
  },
  {
    id: 'admin-pages',
    scope: 'admin',
    prefix: 'pages.',
    title: 'Administrace — stránky',
    description: 'Správa stránek a editor bloků.',
  },
  {
    id: 'admin-menu',
    scope: 'admin',
    prefix: 'menu.',
    title: 'Administrace — menu',
    description: 'Správa položek hlavní navigace webu.',
  },
  {
    id: 'admin-site-texts-page',
    scope: 'admin',
    prefix: 'siteTextsPage.',
    title: 'Administrace — stránka textů webu',
    description: 'Popisky editoru veřejných textů (hero, patička atd.).',
  },
  {
    id: 'admin-settings-page',
    scope: 'admin',
    prefix: 'settingsPage.',
    title: 'Administrace — stránka nastavení',
    description: 'Popisky stránky nastavení webu.',
  },
  {
    id: 'admin-colors',
    scope: 'admin',
    prefix: 'colors.',
    title: 'Administrace — barvy',
    description: 'Texty editoru barevné palety.',
  },
  {
    id: 'admin-combobox',
    scope: 'admin',
    prefix: 'combobox.',
    title: 'Administrace — výběrová pole',
    description: 'Vyhledávání uživatelů a stránek v comboboxech.',
  },
  {
    id: 'admin-page-blocks',
    scope: 'admin',
    prefix: 'pageBlocks.',
    title: 'Administrace — bloky stránek',
    description: 'Názvy, popisy a souhrny prvků v editoru stránek.',
  },
  {
    id: 'admin-ui-texts-page',
    scope: 'admin',
    prefix: 'uiTextsPage.',
    title: 'Administrace — tato stránka Texty',
    description: 'Popisky editoru všech textů (tato stránka).',
  },
  {
    id: 'site-common',
    scope: 'site',
    prefix: 'common.',
    title: 'Web — společné',
    description: 'Načítání, tlačítka, kontakty a titulky záložek na veřejném webu.',
  },
  {
    id: 'site-auth',
    scope: 'site',
    prefix: 'auth.',
    title: 'Web — přihlášení',
    description: 'Přihlášení a odhlášení na blogu a u komentářů.',
  },
  {
    id: 'site-nav',
    scope: 'site',
    prefix: 'nav.',
    title: 'Web — navigace',
    description: 'Hlavní menu a mobilní navigace.',
  },
  {
    id: 'site-not-found',
    scope: 'site',
    prefix: 'notFound.',
    title: 'Web — stránka nenalezena',
    description: 'Záložní texty pro chybějící stránky.',
  },
  {
    id: 'site-notifications',
    scope: 'site',
    prefix: 'notifications.',
    title: 'Web — upozornění',
    description: 'Vyskakovací upozornění pro návštěvníky.',
  },
  {
    id: 'site-blog',
    scope: 'site',
    prefix: 'blog.',
    title: 'Web — blog',
    description: 'Seznam příspěvků, detail, komentáře, profil a reakce.',
  },
  {
    id: 'site-events',
    scope: 'site',
    prefix: 'events.',
    title: 'Web — akce',
    description: 'Karty akcí, seznamy, detail akce a galerie.',
  },
  {
    id: 'site-calendar',
    scope: 'site',
    prefix: 'calendar.',
    title: 'Web — kalendář',
    description: 'Měsíční kalendář akcí včetně názvů měsíců a dnů.',
  },
  {
    id: 'site-instagram',
    scope: 'site',
    prefix: 'instagram.',
    title: 'Web — Instagram',
    description: 'Feed posledních příspěvků z Instagramu.',
  },
  {
    id: 'site-medallion',
    scope: 'site',
    prefix: 'medallion.',
    title: 'Web — medailonky',
    description: 'Detail osoby v prvku medailonek.',
  },
];

const MONTH_NAMES = [
  'leden', 'únor', 'březen', 'duben', 'květen', 'červen',
  'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec',
];

const WEEKDAY_NAMES = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];

function humanizeSegment(segment) {
  if (/^\d+$/.test(segment)) {
    const index = Number(segment);
    if (segment.length <= 2 && index >= 0 && index <= 11) {
      return MONTH_NAMES[index] || `položka ${index + 1}`;
    }
    if (index >= 0 && index <= 6) {
      return WEEKDAY_NAMES[index] || `den ${index + 1}`;
    }
    return `položka ${index + 1}`;
  }

  return segment
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ');
}

function describeField(scope, path, defaultValue) {
  const fullId = `${scope}.${path}`;
  if (FIELD_DESCRIPTIONS[fullId]) {
    return FIELD_DESCRIPTIONS[fullId];
  }

  const segments = path.split('.').map(humanizeSegment);
  const tail = segments[segments.length - 1];
  const context = segments.slice(0, -1).join(' › ');

  let description = context
    ? `Text v sekci ${context} — ${tail}.`
    : `Text pro ${tail}.`;

  if (/\{[a-zA-Z]+\}/.test(defaultValue)) {
    description += ' Může obsahovat zástupné výrazy v složených závorkách.';
  }

  return description;
}

function flattenStringTexts(tree, scope, prefix = '') {
  const items = [];

  Object.entries(tree).forEach(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string') {
      items.push({
        id: `${scope}.${path}`,
        scope,
        path,
        defaultValue: value,
        label: path,
        description: describeField(scope, path, value),
      });
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry, index) => {
        if (typeof entry !== 'string') return;
        const arrayPath = `${path}.${index}`;
        items.push({
          id: `${scope}.${arrayPath}`,
          scope,
          path: arrayPath,
          defaultValue: entry,
          label: arrayPath,
          description: describeField(scope, arrayPath, entry),
        });
      });
      return;
    }

    if (value && typeof value === 'object') {
      items.push(...flattenStringTexts(value, scope, path));
    }
  });

  return items;
}

export const APP_TEXT_FIELDS = [
  ...flattenStringTexts(ADMIN_TEXTS, 'admin'),
  ...flattenStringTexts(SITE_UI_TEXTS, 'site'),
];

export function getCategoryForField(field) {
  const category = APP_TEXT_CATEGORIES.find((item) => (
    field.id.startsWith(`${item.scope}.${item.prefix}`)
  ));

  if (category) return category;

  return {
    id: `${field.scope}-misc`,
    scope: field.scope,
    prefix: '',
    title: field.scope === 'admin' ? 'Administrace — ostatní' : 'Web — ostatní',
    description: 'Další texty bez vlastní kategorie.',
  };
}

export function groupFieldsByCategory(fields = APP_TEXT_FIELDS) {
  const groups = new Map();

  fields.forEach((field) => {
    const category = getCategoryForField(field);
    if (!groups.has(category.id)) {
      groups.set(category.id, { category, fields: [] });
    }
    groups.get(category.id).fields.push(field);
  });

  return APP_TEXT_CATEGORIES
    .map((category) => groups.get(category.id))
    .filter(Boolean)
    .concat(
      [...groups.values()].filter((group) => (
        !APP_TEXT_CATEGORIES.some((category) => category.id === group.category.id)
      )),
    );
}

export function filterTextFieldGroups(groups, query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return groups;

  return groups
    .map((group) => ({
      ...group,
      fields: group.fields.filter((field) => {
        const currentValue = field.currentValue ?? field.defaultValue;
        return [
          field.id,
          field.label,
          field.description,
          field.defaultValue,
          currentValue,
        ].some((value) => String(value).toLowerCase().includes(normalized));
      }),
    }))
    .filter((group) => group.fields.length > 0);
}
