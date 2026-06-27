import { ICONS } from '../../data/icons.js';
import { MENU } from '../../data/menu.js';

function renderDropdown(item) {
  const links = item.items
    .map((link) => `<li><a href="${link.href}">${link.label}</a></li>`)
    .join('');

  return `
    <div class="nav-dropdown">
      <button class="nav-btn nav-btn--dropdown" aria-expanded="false">
        ${item.label}
        ${ICONS.chevron}
      </button>
      <ul class="nav-dropdown__menu">${links}</ul>
    </div>
  `;
}

function renderLink(item) {
  return `<a href="${item.href}" class="nav-btn">${item.label}</a>`;
}

export function renderMenu(container) {
  if (!container) return;

  container.innerHTML = MENU
    .map((item) => (item.type === 'dropdown' ? renderDropdown(item) : renderLink(item)))
    .join('');
}
