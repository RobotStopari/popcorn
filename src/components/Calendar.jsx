import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CALENDAR_LOCALE, eventUrl } from '../data/events';
import { useEvents } from '../contexts/EventsContext';

const { months: MONTHS, weekdays: WEEKDAYS } = CALENDAR_LOCALE;

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

function assignLanes(segments, eventLanes) {
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

function DayCell({ dayInfo, colIndex }) {
  const { date, otherMonth } = dayInfo;
  const today = new Date();
  const isToday = date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate();

  const classes = ['cal__day'];
  if (otherMonth) classes.push('cal__day--other');
  if (isToday) classes.push('cal__day--today');

  return (
    <div className={classes.join(' ')} style={{ gridColumn: colIndex + 1 }} role="gridcell">
      <span className="cal__day-num">{date.getDate()}</span>
    </div>
  );
}

function EventBar({ seg }) {
  const { event, colStart, span, isStart, isEnd, lane } = seg;
  const type = event.past ? 'past' : 'upcoming';
  const classes = ['cal__event', `cal__event--${type}`];
  if (isStart) classes.push('cal__event--segment-start');
  if (isEnd) classes.push('cal__event--segment-end');
  if (!isStart) classes.push('cal__event--segment-continue');
  if (!isEnd) classes.push('cal__event--segment-continues');

  return (
    <a
      href={eventUrl(event.id)}
      className={classes.join(' ')}
      style={{ gridColumn: `${colStart + 1} / span ${span}`, gridRow: lane + 2 }}
      title={event.name}
    >
      {event.name}
    </a>
  );
}

function Week({ weekDays, eventLanes, events }) {
  const segments = events
    .map((event) => getWeekSegment(event, weekDays))
    .filter(Boolean);

  const barRows = assignLanes(segments, eventLanes);
  const totalRows = Math.max(barRows, 1);

  return (
    <div className="cal__week" style={{ '--cal-bar-rows': totalRows }}>
      <div className="cal__week-grid">
        {weekDays.map((day, i) => (
          <DayCell key={day.date.toISOString()} dayInfo={day} colIndex={i} />
        ))}
        {segments.map((seg) => (
          <EventBar key={`${seg.event.id}-${seg.colStart}`} seg={seg} />
        ))}
      </div>
    </div>
  );
}

export default function Calendar() {
  const { calendarEvents } = useEvents();
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [animClass, setAnimClass] = useState('');
  const eventLanesRef = useRef(new Map());
  const animatingRef = useRef(false);

  const weeks = useMemo(() => {
    eventLanesRef.current = new Map();
    return getMonthWeeks(viewYear, viewMonth);
  }, [viewYear, viewMonth]);

  const goToMonth = useCallback((year, month, direction = 0) => {
    if (animatingRef.current) return;
    if (year === viewYear && month === viewMonth) return;

    if (direction === 0) {
      setViewYear(year);
      setViewMonth(month);
      return;
    }

    animatingRef.current = true;
    const outClass = direction < 0 ? 'cal__body--out-prev' : 'cal__body--out-next';
    const inClass = direction < 0 ? 'cal__body--in-prev' : 'cal__body--in-next';

    setAnimClass(outClass);

    setTimeout(() => {
      setViewYear(year);
      setViewMonth(month);
      setAnimClass(inClass);
      requestAnimationFrame(() => {
        setTimeout(() => {
          setAnimClass('');
          animatingRef.current = false;
        }, 300);
      });
    }, 200);
  }, [viewYear, viewMonth]);

  const onPrev = () => {
    if (viewMonth === 0) goToMonth(viewYear - 1, 11, -1);
    else goToMonth(viewYear, viewMonth - 1, -1);
  };

  const onNext = () => {
    if (viewMonth === 11) goToMonth(viewYear + 1, 0, 1);
    else goToMonth(viewYear, viewMonth + 1, 1);
  };

  const onToday = () => {
    const todayY = today.getFullYear();
    const todayM = today.getMonth();
    const dir = viewYear < todayY || (viewYear === todayY && viewMonth < todayM) ? 1
      : viewYear > todayY || (viewYear === todayY && viewMonth > todayM) ? -1
        : 0;
    goToMonth(todayY, todayM, dir);
  };

  return (
    <section className="section section--calendar" id="calendar">
      <div className="container">
        <div className="cal reveal">
          <div className="cal__toolbar">
            <div className="cal__toolbar-start">
              <button type="button" className="cal__nav" id="calPrev" onClick={onPrev} aria-label="Předchozí měsíc">‹</button>
              <button type="button" className="cal__nav" id="calNext" onClick={onNext} aria-label="Další měsíc">›</button>
            </div>
            <h2 className="cal__title" id="calTitle">
              {capitalize(MONTHS[viewMonth])} {viewYear}
            </h2>
            <button type="button" className="cal__today" id="calToday" onClick={onToday}>Dnes</button>
          </div>
          <div className="cal__weekdays" id="calWeekdays">
            {WEEKDAYS.map((day) => (
              <div key={day} className="cal__weekday">{day}</div>
            ))}
          </div>
          <div className={`cal__body ${animClass}`} id="calGrid">
            {weeks.map((weekDays) => (
              <Week
                key={weekDays[0].date.toISOString()}
                weekDays={weekDays}
                eventLanes={eventLanesRef.current}
                events={calendarEvents}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
