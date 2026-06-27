import { getEventById } from '../../data/events.js';
import { ICONS } from '../../data/icons.js';
import { buildGoogleCalendarUrl } from '../utils/google-calendar.js';

const FIELD_ICONS = {
  Sraz: ICONS.eventSraz,
  Návrat: ICONS.eventNavrat,
  Místo: ICONS.eventMisto,
  Cena: ICONS.eventCena,
};

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderInfoField(label, value) {
  const icon = FIELD_ICONS[label] || '';

  return `
    <div class="event-detail__field">
      <div class="event-detail__field-head">
        ${icon ? `<span class="event-detail__field-icon" aria-hidden="true">${icon}</span>` : ''}
        <div class="event-detail__field-copy">
          <dt class="event-detail__field-label">${label}</dt>
          <dd class="event-detail__field-value">${escapeHtml(value)}</dd>
        </div>
      </div>
    </div>
  `;
}

function renderFieldPart(label, value) {
  const icon = FIELD_ICONS[label] || '';

  return `
    <div class="event-detail__field-part">
      <div class="event-detail__field-head">
        ${icon ? `<span class="event-detail__field-icon" aria-hidden="true">${icon}</span>` : ''}
        <div class="event-detail__field-copy">
          <dt class="event-detail__field-label">${label}</dt>
          <dd class="event-detail__field-value event-detail__field-value--compact">${escapeHtml(value)}</dd>
        </div>
      </div>
    </div>
  `;
}

function renderScheduleRow(event) {
  const calendarUrl = buildGoogleCalendarUrl(event);

  return `
    <div class="event-detail__schedule-row">
      <div class="event-detail__field event-detail__field--combined">
        ${renderFieldPart('Sraz', event.sraz)}
        <div class="event-detail__field-divider" aria-hidden="true"></div>
        ${renderFieldPart('Návrat', event.navrat)}
      </div>
      <a
        href="${calendarUrl}"
        class="event-detail__calendar-btn btn btn--outline"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span class="event-detail__calendar-icon" aria-hidden="true">${ICONS.eventCalendar}</span>
        <span class="event-detail__calendar-label">Přidat do kalendáře</span>
      </a>
    </div>
  `;
}

function renderOrganisers(organisers) {
  const contacts = organisers.contacts
    .map((contact) => {
      const parts = [`<strong>${escapeHtml(contact.name)}</strong>`];
      if (contact.email) {
        parts.push(`<a href="mailto:${escapeHtml(contact.email)}">${escapeHtml(contact.email)}</a>`);
      }
      if (contact.phone) {
        parts.push(`<span>${escapeHtml(contact.phone)}</span>`);
      }
      return `<li class="event-detail__contact">${parts.join(' · ')}</li>`;
    })
    .join('');

  return `
    <section class="event-detail__block event-detail__block--inline reveal">
      <h2 class="event-detail__block-title">${escapeHtml(organisers.label)}</h2>
      <ul class="event-detail__contacts">${contacts}</ul>
    </section>
  `;
}

function renderParticipants(participants) {
  const list = participants.length
    ? `<ul class="event-detail__participants">${participants.map((name) => `<li>${escapeHtml(name)}</li>`).join('')}</ul>`
    : `<p class="event-detail__empty">Zatím nikdo — buď první!</p>`;

  return `
    <section class="event-detail__block reveal">
      <h2 class="event-detail__block-title">Přihlášení účastníci</h2>
      ${list}
    </section>
  `;
}

function renderImageGrid(images, className = 'event-detail__media', galleryId = 'event-gallery') {
  if (!images?.length) return '';

  const items = images
    .map(
      (img, index) => `
        <button type="button" class="event-detail__figure img-frame" data-lightbox-index="${index}" aria-label="Otevřít obrázek: ${escapeHtml(img.alt)}">
          <img src="${img.src}" alt="${escapeHtml(img.alt)}" class="event-detail__img" loading="lazy">
        </button>
      `,
    )
    .join('');

  return `<div class="${className} reveal-stagger" data-lightbox-gallery="${galleryId}">${items}</div>`;
}

function renderUpcomingDetail(event) {
  return `
    <div class="event-detail__columns reveal-stagger">
      <div class="event-detail__main reveal">
        <h2 class="event-detail__section-label">Popis:</h2>
        <div class="event-detail__description">
          <p>${escapeHtml(event.description)}</p>
        </div>
        ${renderOrganisers(event.organisers)}
      </div>
      <aside class="event-detail__sidebar reveal">
        <div class="event-detail__fields">
          ${renderScheduleRow(event)}
          ${renderInfoField('Místo', event.misto)}
          ${renderInfoField('Cena', event.cena)}
        </div>
      </aside>
    </div>

    ${renderParticipants(event.participants)}

    <div class="event-detail__register reveal">
      <a href="${event.registerHref}" class="btn btn--primary btn--large">Přihlásit se</a>
    </div>

    ${renderImageGrid(event.images)}
  `;
}

function renderPastDetail(event) {
  const report = event.report
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join('');

  const gallery = renderImageGrid(event.gallery, 'event-detail__gallery reveal-stagger', 'past-gallery');
  const driveLink = event.galleryDriveHref
    ? `
      <div class="event-detail__gallery-link reveal">
        <a href="${event.galleryDriveHref}" class="btn btn--outline" target="_blank" rel="noopener noreferrer">
          Otevřít celou galerii na Google Drive
        </a>
      </div>
    `
    : '';

  return `
    <section class="event-detail__report reveal">
      <h2 class="event-detail__report-title">Zápis z akce</h2>
      <div class="event-detail__report-body">${report}</div>
    </section>

    ${gallery}
    ${driveLink}
  `;
}

function renderBackLink(className = 'event-detail__back') {
  return `<a href="index.html" class="${className} reveal">← Zpět</a>`;
}

function renderNotFound() {
  return `
    <div class="event-detail__not-found reveal">
      <h1 class="event-detail__title">Akce nenalezena</h1>
      <p class="event-detail__date">Tato akce neexistuje nebo byla odstraněna.</p>
      <a href="index.html" class="btn btn--primary">Zpět na hlavní stránku</a>
    </div>
  `;
}

export function renderEventDetail(container) {
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const result = id ? getEventById(id) : null;

  if (!result) {
    container.innerHTML = renderNotFound();
    document.title = 'Akce nenalezena — Komunita Popcorn';
    return;
  }

  const { event, past } = result;
  document.title = `${event.name} — Komunita Popcorn`;

  const dateClass = past ? 'event-detail__date event-detail__date--past' : 'event-detail__date';
  const body = past ? renderPastDetail(event) : renderUpcomingDetail(event);

  container.innerHTML = `
    ${renderBackLink()}

    <header class="event-detail__header reveal reveal--scale">
      <h1 class="event-detail__title">${escapeHtml(event.name)}</h1>
      <time class="${dateClass}" datetime="${event.dateStart}">${escapeHtml(event.dateLabel)}</time>
    </header>

    ${body}

    <div class="event-detail__back-bottom reveal">
      ${renderBackLink('event-detail__back event-detail__back--bottom')}
    </div>
  `;
}
