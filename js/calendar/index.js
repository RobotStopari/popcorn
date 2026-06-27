import { CALENDAR_EVENTS, CALENDAR_LOCALE } from '../../data/events.js';

const { months: MONTHS, weekdays: WEEKDAYS } = CALENDAR_LOCALE;
const EVENTS = CALENDAR_EVENTS;

export function initCalendar() {
  const titleEl = document.getElementById('calTitle');
  const weekdaysEl = document.getElementById('calWeekdays');
  const bodyEl = document.getElementById('calGrid');
  const prevBtn = document.getElementById('calPrev');
  const nextBtn = document.getElementById('calNext');
  const todayBtn = document.getElementById('calToday');

  if (!titleEl || !weekdaysEl || !bodyEl) return;

  let viewYear;
  let viewMonth;
  const eventLanes = new Map();

  const today = new Date();
  const todayY = today.getFullYear();
  const todayM = today.getMonth();
  const todayD = today.getDate();

  function parseDate(str) {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function getMonthWeeks(year, month) {
    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();

    const dates = [];

    for (let i = 0; i < startOffset; i += 1) {
      const d = daysInPrev - startOffset + i + 1;
      const m = month === 0 ? 11 : month - 1;
      const y = month === 0 ? year - 1 : year;
      dates.push({ date: new Date(y, m, d), otherMonth: true });
    }

    for (let d = 1; d <= daysInMonth; d += 1) {
      dates.push({ date: new Date(year, month, d), otherMonth: false });
    }

    const trailing = (7 - (dates.length % 7)) % 7;
    for (let i = 1; i <= trailing; i += 1) {
      const m = month === 11 ? 0 : month + 1;
      const y = month === 11 ? year + 1 : year;
      dates.push({ date: new Date(y, m, i), otherMonth: true });
    }

    const weeks = [];
    for (let i = 0; i < dates.length; i += 7) {
      weeks.push(dates.slice(i, i + 7));
    }
    return weeks;
  }

  function getWeekSegment(event, weekDays) {
    const start = parseDate(event.start);
    const end = parseDate(event.end);
    let colStart = -1;
    let colEnd = -1;

    weekDays.forEach((day, i) => {
      if (day.date >= start && day.date <= end) {
        if (colStart === -1) colStart = i;
        colEnd = i;
      }
    });

    if (colStart === -1) return null;

    return {
      event,
      colStart,
      span: colEnd - colStart + 1,
      isStart: sameDay(weekDays[colStart].date, start),
      isEnd: sameDay(weekDays[colEnd].date, end),
    };
  }

  function segmentsOverlap(a, b) {
    return !(a.colStart + a.span <= b.colStart || b.colStart + b.span <= a.colStart);
  }

  function assignLanes(segments) {
    const laneEnds = [];
    const sorted = [...segments].sort((a, b) => {
      const startDiff = parseDate(a.event.start) - parseDate(b.event.start);
      if (startDiff !== 0) return startDiff;
      const durA = parseDate(a.event.end) - parseDate(a.event.start);
      const durB = parseDate(b.event.end) - parseDate(b.event.start);
      return durB - durA;
    });

    let maxLane = 0;

    sorted.forEach((seg) => {
      let lane = eventLanes.get(seg.event.id);

      if (lane === undefined || laneEnds[lane]?.some((s) => segmentsOverlap(s, seg))) {
        lane = 0;
        while (laneEnds[lane]?.some((s) => segmentsOverlap(s, seg))) {
          lane += 1;
        }
        if (!eventLanes.has(seg.event.id)) {
          eventLanes.set(seg.event.id, lane);
        }
      }

      if (!laneEnds[lane]) laneEnds[lane] = [];
      laneEnds[lane].push(seg);
      seg.lane = lane;
      maxLane = Math.max(maxLane, lane);
    });

    return maxLane + 1;
  }

  function renderWeekdays() {
    weekdaysEl.innerHTML = WEEKDAYS
      .map((day) => `<div class="cal__weekday">${day}</div>`)
      .join('');
  }

  function buildDayCell(dayInfo, colIndex) {
    const { date, otherMonth } = dayInfo;
    const d = date.getDate();
    const isToday = date.getFullYear() === todayY
      && date.getMonth() === todayM
      && date.getDate() === todayD;

    const classes = ['cal__day'];
    if (otherMonth) classes.push('cal__day--other');
    if (isToday) classes.push('cal__day--today');

    return `
      <div class="${classes.join(' ')}" style="grid-column: ${colIndex + 1}" role="gridcell">
        <span class="cal__day-num">${d}</span>
      </div>
    `;
  }

  function buildEventBar(seg) {
    const { event, colStart, span, isStart, isEnd, lane } = seg;
    const type = event.past ? 'past' : 'upcoming';
    const classes = ['cal__event', `cal__event--${type}`];
    if (isStart) classes.push('cal__event--segment-start');
    if (isEnd) classes.push('cal__event--segment-end');
    if (!isStart) classes.push('cal__event--segment-continue');
    if (!isEnd) classes.push('cal__event--segment-continues');

    const col = colStart + 1;

    return `
      <div
        class="${classes.join(' ')}"
        style="grid-column: ${col} / span ${span}; grid-row: ${lane + 2}"
        title="${event.name}"
        role="gridcell"
      >${event.name}</div>
    `;
  }

  function buildWeek(weekDays) {
    const segments = EVENTS
      .map((event) => getWeekSegment(event, weekDays))
      .filter(Boolean);

    const barRows = assignLanes(segments);
    const totalRows = Math.max(barRows, 1);

    const daysHtml = weekDays.map((day, i) => buildDayCell(day, i)).join('');
    const barsHtml = segments.map(buildEventBar).join('');

    return `
      <div class="cal__week" style="--cal-bar-rows: ${totalRows}">
        <div class="cal__week-grid">
          ${daysHtml}
          ${barsHtml}
        </div>
      </div>
    `;
  }

  function paintMonth() {
    titleEl.textContent = `${capitalize(MONTHS[viewMonth])} ${viewYear}`;
    eventLanes.clear();
    bodyEl.innerHTML = getMonthWeeks(viewYear, viewMonth).map(buildWeek).join('');
  }

  let animating = false;

  function renderMonth(direction = 0) {
    if (animating) return;

    if (direction === 0 || !bodyEl.innerHTML) {
      paintMonth();
      return;
    }

    animating = true;
    const outClass = direction < 0 ? 'cal__body--out-prev' : 'cal__body--out-next';
    const inClass = direction < 0 ? 'cal__body--in-prev' : 'cal__body--in-next';

    bodyEl.classList.add(outClass);

    const onOutEnd = (e) => {
      if (e.target !== bodyEl) return;
      bodyEl.removeEventListener('animationend', onOutEnd);
      bodyEl.classList.remove(outClass);
      paintMonth();
      bodyEl.classList.add(inClass);

      requestAnimationFrame(() => {
        const onInEnd = (ev) => {
          if (ev.target !== bodyEl) return;
          bodyEl.removeEventListener('animationend', onInEnd);
          bodyEl.classList.remove(inClass);
          animating = false;
        };
        bodyEl.addEventListener('animationend', onInEnd);
      });
    };

    bodyEl.addEventListener('animationend', onOutEnd);
  }

  function goToMonth(year, month, direction = 0) {
    if (year === viewYear && month === viewMonth) return;
    viewYear = year;
    viewMonth = month;
    renderMonth(direction);
  }

  prevBtn?.addEventListener('click', () => {
    if (viewMonth === 0) goToMonth(viewYear - 1, 11, -1);
    else goToMonth(viewYear, viewMonth - 1, -1);
  });

  nextBtn?.addEventListener('click', () => {
    if (viewMonth === 11) goToMonth(viewYear + 1, 0, 1);
    else goToMonth(viewYear, viewMonth + 1, 1);
  });

  todayBtn?.addEventListener('click', () => {
    const dir = viewYear < todayY || (viewYear === todayY && viewMonth < todayM) ? 1
      : viewYear > todayY || (viewYear === todayY && viewMonth > todayM) ? -1
      : 0;
    goToMonth(todayY, todayM, dir);
  });

  renderWeekdays();
  goToMonth(todayY, todayM);
}
