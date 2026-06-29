import { SECTIONS } from '../../data/site.js';
import { CARD_EVENTS, eventUrl } from '../../data/events.js';

function renderEventCard(event, index, past = false) {
  const pastClass = past ? ' event-card--past' : '';
  const delayClass = ` reveal--delay-${index + 1}`;
  const href = event.action?.href || eventUrl(event.id);
  const actionLabel = event.action?.label || (past ? 'Přečíst o akci' : 'Více informací');

  return `
    <a href="${href}" class="event-card shine-parent${pastClass} reveal${delayClass}">
      <div class="event-card__image-wrap img-frame">
        <img src="${event.image}" alt="${event.imageAlt}" class="event-card__image">
      </div>
      <div class="event-card__body">
        <h2 class="event-card__name">${event.name}</h2>
        <time class="event-card__date" datetime="${event.dateStart}">${event.dateLabel}</time>
        <span class="btn btn--outline">${actionLabel}</span>
      </div>
    </a>
  `;
}

function renderSectionLabel(label) {
  return `
    <div class="section__label reveal reveal--scale">
      <span class="section__label-line section__label-line--red"></span>
      <span class="section__label-text">${label}</span>
      <span class="section__label-line section__label-line--red"></span>
    </div>
  `;
}

function renderCta(cta) {
  return `<a href="${cta.href}" class="btn btn--${cta.variant}">${cta.label}</a>`;
}

export function renderUpcomingEvents({ labelEl, gridEl, ctaEl }) {
  const section = SECTIONS.upcoming;

  if (labelEl) labelEl.innerHTML = renderSectionLabel(section.label);
  if (gridEl) {
    gridEl.innerHTML = CARD_EVENTS.upcoming
      .map((event, index) => renderEventCard(event, index, false))
      .join('');
  }
  if (ctaEl) {
    ctaEl.innerHTML = `
      <div class="section__cta reveal">
        ${renderCta(section.cta)}
      </div>
    `;
  }
}

export function renderPastEvents({ labelEl, gridEl, ctaEl }) {
  const section = SECTIONS.past;

  if (labelEl) labelEl.innerHTML = renderSectionLabel(section.label);
  if (gridEl) {
    gridEl.innerHTML = CARD_EVENTS.past
      .map((event, index) => renderEventCard(event, index, true))
      .join('');
  }
  if (ctaEl) {
    ctaEl.innerHTML = `
      <div class="section__cta section__cta--double reveal-stagger">
        ${section.ctas.map((cta) => `<a href="${cta.href}" class="btn btn--${cta.variant} reveal">${cta.label}</a>`).join('')}
      </div>
    `;
  }
}
