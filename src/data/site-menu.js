export const SITE_MENU_DOC_ID = 'config';
export const MAX_DROPDOWN_ITEMS = 8;

export const MENU_ITEM_TYPES = {
  link: 'link',
  dropdown: 'dropdown',
};

export const MENU_LINK_TYPES = {
  page: 'page',
  custom: 'custom',
};

export const DEFAULT_SITE_MENU = {
  items: [
    {
      id: 'menu-o-popcornu',
      type: 'dropdown',
      label: 'O Popcornu',
      items: [
        {
          id: 'menu-co-je-popcorn',
          label: 'Co je Popcorn',
          linkType: 'page',
          pageId: 'co-je-popcorn',
          external: false,
        },
        {
          id: 'menu-vedeni-kontakt',
          label: 'Vedení – Kontakt',
          linkType: 'page',
          pageId: 'vedeni-kontakt',
          external: false,
        },
        {
          id: 'menu-pro-novacky',
          label: 'Pro nováčky',
          linkType: 'page',
          pageId: 'pro-novacky',
          external: false,
        },
      ],
    },
    {
      id: 'menu-akce',
      type: 'dropdown',
      label: 'Akce',
      items: [
        {
          id: 'menu-vypukne',
          label: 'VyPUKne',
          linkType: 'page',
          pageId: 'vypukne',
          external: false,
        },
        {
          id: 'menu-probehle',
          label: 'Proběhlé',
          linkType: 'page',
          pageId: 'probehle',
          external: false,
        },
        {
          id: 'menu-usporadej',
          label: 'Uspořádej akci!',
          linkType: 'page',
          pageId: 'usporadej',
          external: false,
        },
        {
          id: 'menu-kurz-zapalovac',
          label: 'Kurz Zapalovač',
          linkType: 'custom',
          href: 'https://kurzzapalovac.cz',
          external: true,
        },
      ],
    },
    {
      id: 'menu-inspirace',
      type: 'dropdown',
      label: 'Inspirace',
      items: [
        {
          id: 'menu-blog',
          label: 'Blog',
          linkType: 'page',
          pageId: 'blog',
          external: false,
        },
        {
          id: 'menu-odkazy',
          label: 'Odkazy',
          linkType: 'page',
          pageId: 'odkazy',
          external: false,
        },
        {
          id: 'menu-zappka',
          label: 'Zappka',
          linkType: 'custom',
          href: 'https://kurzzapalovac.cz/zappka',
          external: true,
        },
      ],
    },
  ],
};

export function createMenuId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `menu-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptyLink() {
  return {
    id: createMenuId(),
    label: '',
    linkType: MENU_LINK_TYPES.page,
    pageId: '',
    href: '',
    external: false,
  };
}

export function createEmptyTopLink() {
  return {
    id: createMenuId(),
    type: MENU_ITEM_TYPES.link,
    ...createEmptyLink(),
  };
}

export function createEmptyDropdown() {
  return {
    id: createMenuId(),
    type: MENU_ITEM_TYPES.dropdown,
    label: '',
    items: [],
  };
}

function normalizeLink(raw = {}) {
  const linkType = raw.linkType === MENU_LINK_TYPES.custom
    ? MENU_LINK_TYPES.custom
    : MENU_LINK_TYPES.page;

  return {
    id: raw.id || createMenuId(),
    label: (raw.label || '').trim(),
    linkType,
    pageId: linkType === MENU_LINK_TYPES.page ? (raw.pageId || '') : '',
    href: linkType === MENU_LINK_TYPES.custom ? (raw.href || '').trim() : '',
    external: Boolean(raw.external),
  };
}

function normalizeDropdown(raw = {}) {
  const items = Array.isArray(raw.items) ? raw.items.slice(0, MAX_DROPDOWN_ITEMS) : [];
  return {
    id: raw.id || createMenuId(),
    type: MENU_ITEM_TYPES.dropdown,
    label: (raw.label || '').trim(),
    items: items.map(normalizeLink),
  };
}

export function normalizeMenuItems(rawItems) {
  if (!Array.isArray(rawItems)) {
    return DEFAULT_SITE_MENU.items.map((item) => (
      item.type === MENU_ITEM_TYPES.dropdown
        ? normalizeDropdown(item)
        : { ...normalizeLink(item), type: MENU_ITEM_TYPES.link }
    ));
  }

  return rawItems.map((item) => {
    if (item?.type === MENU_ITEM_TYPES.dropdown) {
      return normalizeDropdown(item);
    }
    return {
      type: MENU_ITEM_TYPES.link,
      ...normalizeLink(item),
    };
  });
}

export function validateMenuLink(link) {
  if (!link.label.trim()) {
    throw new Error('Vyplňte název položky menu.');
  }

  if (link.linkType === MENU_LINK_TYPES.page) {
    if (!link.pageId) {
      throw new Error('Vyberte stránku pro položku menu.');
    }
    return;
  }

  if (!link.href.trim()) {
    throw new Error('Vyplňte vlastní odkaz.');
  }

  try {
    const url = new URL(link.href);
    if (!url.protocol.startsWith('http')) {
      throw new Error('invalid');
    }
  } catch {
    throw new Error('Zadejte platnou URL adresu (včetně https://).');
  }
}

export function validateMenuItem(item) {
  if (item.type === MENU_ITEM_TYPES.dropdown) {
    if (!item.label.trim()) {
      throw new Error('Vyplňte název dropdownu.');
    }
    if (!item.items.length) {
      throw new Error('Dropdown musí mít alespoň jednu položku.');
    }
    if (item.items.length > MAX_DROPDOWN_ITEMS) {
      throw new Error(`Dropdown může mít maximálně ${MAX_DROPDOWN_ITEMS} položek.`);
    }
    item.items.forEach(validateMenuLink);
    return;
  }

  validateMenuLink(item);
}

export function validateMenuItems(items) {
  items.forEach(validateMenuItem);
}
