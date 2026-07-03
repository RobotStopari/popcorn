import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { fetchAnalyticsEvents } from '../services/analytics';
import { adminDocumentTitle, adminText } from '../utils/admin-text';
import {
  buildAnalyticsSummary,
  buildPageTimeSeries,
  getAnalyticsRangePresets,
} from '../utils/analytics-format';

const CHART_COLORS = ['#faa908', '#d62839', '#3d85c6', '#3da865', '#289e8f', '#6b6b6b', '#ffbe3d', '#e8354a'];
const MAX_SELECTED_PATHS = 5;

const TOOLTIP_WRAPPER_STYLE = {
  outline: 'none',
  pointerEvents: 'none',
  zIndex: 40,
  maxWidth: 'min(240px, calc(100vw - 2.5rem))',
};

function statisticsTooltipPosition(point, tooltipWidth, tooltipHeight, viewBox) {
  const padding = 8;
  const width = tooltipWidth || 196;
  const height = tooltipHeight || 72;
  const boxWidth = viewBox?.width ?? 320;
  const boxHeight = viewBox?.height ?? 300;

  let x = point.x + 10;
  let y = point.y - height / 2;

  if (x + width + padding > boxWidth) {
    x = point.x - width - 10;
  }

  x = Math.max(padding, Math.min(x, boxWidth - width - padding));
  y = Math.max(padding, Math.min(y, boxHeight - height - padding));

  return { x, y };
}

function chartTooltipProps(cursor) {
  return {
    isAnimationActive: false,
    wrapperStyle: TOOLTIP_WRAPPER_STYLE,
    wrapperClassName: 'admin-statistiky__tooltip-wrapper',
    allowEscapeViewBox: { x: true, y: true },
    position: statisticsTooltipPosition,
    ...(cursor ? { cursor } : {}),
  };
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const entry = payload[0];
  const title = label || entry.name || entry.payload?.label || '';

  return (
    <div className="admin-statistiky__tooltip">
      {title && <strong>{title}</strong>}
      <span>
        {adminText('statistikyPage.columns.views')}
        {': '}
        {entry.value}
      </span>
    </div>
  );
}

function ClickTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const entry = payload[0];
  const title = label || entry.payload?.label || entry.name || '';

  return (
    <div className="admin-statistiky__tooltip">
      {title && <strong>{title}</strong>}
      <span>
        {adminText('statistikyPage.columns.clicks')}
        {': '}
        {entry.value}
      </span>
    </div>
  );
}

function MultiLineChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="admin-statistiky__tooltip">
      {label && <strong>{label}</strong>}
      {payload.map((entry) => (
        <span key={entry.dataKey}>
          {entry.name}
          {': '}
          {entry.value}
        </span>
      ))}
    </div>
  );
}

function DurationTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;

  return (
    <div className="admin-statistiky__tooltip">
      <strong>{row.label}</strong>
      <span>{row.durationLabel}</span>
    </div>
  );
}

function KpiCard({ label, value, hint, desc }) {
  return (
    <article className="admin-statistiky__kpi">
      <p className="admin-statistiky__kpi-label">{label}</p>
      <p className="admin-statistiky__kpi-value">{value}</p>
      {hint && <p className="admin-statistiky__kpi-hint">{hint}</p>}
      {desc && <p className="admin-statistiky__kpi-desc">{desc}</p>}
    </article>
  );
}

function ChartPanel({ title, description, wide = false, hasData, emptyLabel, headerContent, children }) {
  return (
    <section className={`admin-statistiky__panel${wide ? ' admin-statistiky__panel--wide' : ''}`}>
      <div className="admin-statistiky__panel-head">
        <h3 className="admin-statistiky__panel-title">{title}</h3>
        {description && <p className="admin-statistiky__panel-desc">{description}</p>}
      </div>
      {headerContent}
      {hasData ? (
        <div className={`admin-statistiky__chart${wide ? '' : ' admin-statistiky__chart--pie'}`}>
          <ResponsiveContainer width="100%" height={wide ? 300 : 280}>
            {children}
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="admin-statistiky__empty">{emptyLabel}</p>
      )}
    </section>
  );
}

function DataTable({ title, description, columns, rows, emptyLabel }) {
  return (
    <section className="admin-statistiky__panel">
      <div className="admin-statistiky__panel-head">
        <h3 className="admin-statistiky__panel-title">{title}</h3>
        {description && <p className="admin-statistiky__panel-desc">{description}</p>}
      </div>
      {rows.length ? (
        <div className="admin-statistiky__table-wrap">
          <table className="admin-statistiky__table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key} scope="col">{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {columns.map((column) => (
                    <td key={column.key} data-label={column.label}>{row[column.key]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="admin-statistiky__empty">{emptyLabel}</p>
      )}
    </section>
  );
}

export default function AdminStatistikyPage() {
  const { canAccessAdmin, loading } = useAdminAuth();
  const presets = useMemo(() => getAnalyticsRangePresets(), []);
  const [rangeId, setRangeId] = useState('30');
  const [events, setEvents] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPaths, setSelectedPaths] = useState([]);

  const selectedRange = presets.find((item) => item.id === rangeId) || presets[1];

  useEffect(() => {
    document.title = adminDocumentTitle(adminText('statistikyPage.title'));
  }, []);

  useEffect(() => {
    if (!canAccessAdmin) return undefined;

    let active = true;

    const load = async () => {
      setListLoading(true);
      setError('');

      try {
        const data = await fetchAnalyticsEvents({
          from: selectedRange.from,
          to: selectedRange.to,
        });
        if (active) setEvents(data);
      } catch (err) {
        if (active) {
          setError(err.message || adminText('statistikyPage.loadFailed'));
          setEvents([]);
        }
      } finally {
        if (active) setListLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [canAccessAdmin, selectedRange.from, selectedRange.to]);

  const summary = useMemo(() => buildAnalyticsSummary(events), [events]);

  useEffect(() => {
    setSelectedPaths((current) => {
      if (current.length) return current;
      return summary.topPaths.slice(0, 3).map((item) => item.key);
    });
  }, [summary.topPaths]);

  const pathLabelByKey = useMemo(() => {
    const map = new Map();
    summary.topPaths.forEach((item) => map.set(item.key, item.label));
    return map;
  }, [summary.topPaths]);

  const pageTimeSeries = useMemo(
    () => buildPageTimeSeries(summary.pageViewsByDayByPath, summary.allDayKeys, selectedPaths),
    [summary.allDayKeys, summary.pageViewsByDayByPath, selectedPaths],
  );

  const toggleSelectedPath = (path) => {
    setSelectedPaths((current) => {
      if (current.includes(path)) return current.filter((item) => item !== path);
      if (current.length >= MAX_SELECTED_PATHS) return current;
      return [...current, path];
    });
  };

  if (loading) {
    return (
      <div className="admin-content">
        <p className="admin-loading">{adminText('common.loading')}</p>
      </div>
    );
  }

  if (!canAccessAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const sessionRows = summary.sessions.map((session) => ({
    id: session.id,
    started: session.startedLabel,
    lastSeen: session.lastSeenLabel,
    device: session.deviceLabel,
    os: session.os,
    browser: session.browser,
    pages: session.pagesViewed,
    time: session.durationLabel,
    journey: session.pathsLabel,
  }));

  const articleRows = summary.articles.map((item) => ({
    id: item.key,
    title: item.label,
    views: item.value,
  }));

  const eventRows = summary.events.map((item) => ({
    id: item.key,
    title: item.label,
    views: item.value,
  }));

  const pathRows = summary.topPaths.map((item) => ({
    id: item.key,
    path: item.label,
    views: item.value,
  }));

  const clickTableRows = (items) => items.map((item) => ({
    id: item.key,
    target: item.label,
    clicks: item.value,
  }));

  const entryRows = summary.entryPages.map((item) => ({
    id: item.key,
    path: item.label,
    views: item.value,
  }));

  const exitRows = summary.exitPages.map((item) => ({
    id: item.key,
    path: item.label,
    views: item.value,
  }));

  return (
    <div className="admin-content container admin-statistiky-page">
      <header className="admin-content__header admin-content__header--actions">
        <div>
          <h1 className="admin-content__title">{adminText('statistikyPage.title')}</h1>
          <p className="admin-content__subtitle">{adminText('statistikyPage.subtitle')}</p>
        </div>
        <div className="admin-statistiky__range">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`btn btn--outline btn--small${rangeId === preset.id ? ' admin-statistiky__range-btn--active' : ''}`}
              onClick={() => setRangeId(preset.id)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </header>

      {error && <p className="admin-error admin-content__error">{error}</p>}

      {listLoading ? (
        <p className="admin-loading">{adminText('statistikyPage.loading')}</p>
      ) : (
        <>
          <div className="admin-statistiky__kpis">
            <KpiCard
              label={adminText('statistikyPage.kpis.pageViews')}
              value={summary.totals.pageViews}
              desc={adminText('statistikyPage.kpis.pageViewsDesc')}
            />
            <KpiCard
              label={adminText('statistikyPage.kpis.sessions')}
              value={summary.totals.uniqueSessions}
              desc={adminText('statistikyPage.kpis.sessionsDesc')}
            />
            <KpiCard
              label={adminText('statistikyPage.kpis.avgTime')}
              value={summary.totals.avgSessionLabel}
              desc={adminText('statistikyPage.kpis.avgTimeDesc')}
            />
            <KpiCard
              label={adminText('statistikyPage.kpis.mobileShare')}
              value={`${summary.totals.mobileShare}%`}
              desc={adminText('statistikyPage.kpis.mobileShareHint')}
            />
            <KpiCard
              label={adminText('statistikyPage.kpis.totalClicks')}
              value={summary.totals.totalClicks}
              desc={adminText('statistikyPage.kpis.totalClicksDesc')}
            />
            <KpiCard
              label={adminText('statistikyPage.kpis.socialClicks')}
              value={summary.totals.socialClicks}
              desc={adminText('statistikyPage.kpis.socialClicksDesc')}
            />
            <KpiCard
              label={adminText('statistikyPage.kpis.outboundClicks')}
              value={summary.totals.outboundClicks}
              desc={adminText('statistikyPage.kpis.outboundClicksDesc')}
            />
            <KpiCard
              label={adminText('statistikyPage.kpis.navClicks')}
              value={summary.totals.navClicks}
              desc={adminText('statistikyPage.kpis.navClicksDesc')}
            />
          </div>

          <div className="admin-statistiky__charts">
            <ChartPanel
              wide
              title={adminText('statistikyPage.charts.viewsOverTime')}
              description={adminText('statistikyPage.charts.viewsOverTimeDesc')}
              hasData={summary.viewsByDay.length > 0}
              emptyLabel={adminText('statistikyPage.empty')}
            >
              <LineChart data={summary.viewsByDay} margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(17,17,17,0.12)" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} height={44}>
                  <Label value={adminText('statistikyPage.axes.date')} position="insideBottom" offset={-2} style={{ fontSize: 12, fontWeight: 700, fill: '#6b6b6b' }} />
                </XAxis>
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={52}>
                  <Label value={adminText('statistikyPage.axes.views')} angle={-90} position="insideLeft" style={{ fontSize: 12, fontWeight: 700, fill: '#6b6b6b', textAnchor: 'middle' }} />
                </YAxis>
                <Tooltip content={<ChartTooltip />} {...chartTooltipProps({ stroke: 'rgba(17,17,17,0.2)' })} />
                <Line type="monotone" dataKey="value" name={adminText('statistikyPage.axes.views')} stroke="#faa908" strokeWidth={3} dot={{ r: 4, fill: '#111111' }} isAnimationActive={false} />
              </LineChart>
            </ChartPanel>

            <ChartPanel
              wide
              title={adminText('statistikyPage.charts.pageViewsOverTime')}
              description={adminText('statistikyPage.charts.pageViewsOverTimeDesc')}
              hasData={pageTimeSeries.length > 0 && selectedPaths.length > 0}
              emptyLabel={adminText('statistikyPage.empty')}
              headerContent={(
                <div className="admin-statistiky__path-picker">
                  <p className="admin-statistiky__path-picker-label">{adminText('statistikyPage.pagePicker.label')}</p>
                  <div className="admin-statistiky__path-picker-list">
                    {summary.topPaths.map((item) => {
                      const active = selectedPaths.includes(item.key);
                      const disabled = !active && selectedPaths.length >= MAX_SELECTED_PATHS;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          className={`admin-statistiky__path-chip${active ? ' admin-statistiky__path-chip--active' : ''}`}
                          onClick={() => toggleSelectedPath(item.key)}
                          disabled={disabled}
                          title={disabled ? adminText('statistikyPage.pagePicker.maxReached') : undefined}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="admin-statistiky__path-picker-hint">{adminText('statistikyPage.pagePicker.hint')}</p>
                </div>
              )}
            >
              <LineChart data={pageTimeSeries} margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(17,17,17,0.12)" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} height={44}>
                  <Label value={adminText('statistikyPage.axes.date')} position="insideBottom" offset={-2} style={{ fontSize: 12, fontWeight: 700, fill: '#6b6b6b' }} />
                </XAxis>
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={52}>
                  <Label value={adminText('statistikyPage.axes.views')} angle={-90} position="insideLeft" style={{ fontSize: 12, fontWeight: 700, fill: '#6b6b6b', textAnchor: 'middle' }} />
                </YAxis>
                <Tooltip content={<MultiLineChartTooltip />} {...chartTooltipProps({ stroke: 'rgba(17,17,17,0.2)' })} />
                <Legend verticalAlign="top" height={28} iconType="line" wrapperStyle={{ fontSize: 12 }} />
                {selectedPaths.map((path, index) => (
                  <Line
                    key={path}
                    type="monotone"
                    dataKey={path}
                    name={pathLabelByKey.get(path) || path}
                    stroke={CHART_COLORS[index % CHART_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ChartPanel>

            <ChartPanel
              title={adminText('statistikyPage.charts.viewsByHour')}
              description={adminText('statistikyPage.charts.viewsByHourDesc')}
              hasData={summary.viewsByHour.length > 0}
              emptyLabel={adminText('statistikyPage.empty')}
            >
              <BarChart data={summary.viewsByHour} margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(17,17,17,0.12)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} height={44}>
                  <Label value={adminText('statistikyPage.axes.hour')} position="insideBottom" offset={-2} style={{ fontSize: 12, fontWeight: 700, fill: '#6b6b6b' }} />
                </XAxis>
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={52}>
                  <Label value={adminText('statistikyPage.axes.views')} angle={-90} position="insideLeft" style={{ fontSize: 12, fontWeight: 700, fill: '#6b6b6b', textAnchor: 'middle' }} />
                </YAxis>
                <Tooltip content={<ChartTooltip />} {...chartTooltipProps({ fill: 'rgba(17,17,17,0.05)' })} />
                <Bar dataKey="value" name={adminText('statistikyPage.axes.views')} fill="#d62839" radius={[8, 8, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ChartPanel>

            <ChartPanel
              title={adminText('statistikyPage.charts.devices')}
              description={adminText('statistikyPage.charts.devicesDesc')}
              hasData={summary.devices.length > 0}
              emptyLabel={adminText('statistikyPage.empty')}
            >
              <PieChart>
                <Pie
                  data={summary.devices}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="45%"
                  innerRadius={52}
                  outerRadius={88}
                  paddingAngle={2}
                  isAnimationActive={false}
                >
                  {summary.devices.map((entry, index) => (
                    <Cell key={entry.key} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} {...chartTooltipProps()} />
                <Legend verticalAlign="bottom" height={32} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ChartPanel>

            <ChartPanel
              wide
              title={adminText('statistikyPage.charts.topPages')}
              description={adminText('statistikyPage.charts.topPagesDesc')}
              hasData={summary.topPaths.length > 0}
              emptyLabel={adminText('statistikyPage.empty')}
            >
              <BarChart data={summary.topPaths} layout="vertical" margin={{ top: 8, left: 8, right: 24, bottom: 24 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(17,17,17,0.12)" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} height={44}>
                  <Label value={adminText('statistikyPage.axes.views')} position="insideBottom" offset={-2} style={{ fontSize: 12, fontWeight: 700, fill: '#6b6b6b' }} />
                </XAxis>
                <YAxis type="category" dataKey="label" width={150} tick={{ fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} {...chartTooltipProps({ fill: 'rgba(17,17,17,0.05)' })} />
                <Bar dataKey="value" name={adminText('statistikyPage.axes.views')} fill="#3d85c6" radius={[0, 8, 8, 0]} isAnimationActive={false} />
              </BarChart>
            </ChartPanel>

            <ChartPanel
              title={adminText('statistikyPage.charts.os')}
              description={adminText('statistikyPage.charts.osDesc')}
              hasData={summary.os.length > 0}
              emptyLabel={adminText('statistikyPage.empty')}
            >
              <BarChart data={summary.os} margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(17,17,17,0.12)" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} height={44}>
                  <Label value={adminText('statistikyPage.axes.os')} position="insideBottom" offset={-2} style={{ fontSize: 12, fontWeight: 700, fill: '#6b6b6b' }} />
                </XAxis>
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={52}>
                  <Label value={adminText('statistikyPage.axes.views')} angle={-90} position="insideLeft" style={{ fontSize: 12, fontWeight: 700, fill: '#6b6b6b', textAnchor: 'middle' }} />
                </YAxis>
                <Tooltip content={<ChartTooltip />} {...chartTooltipProps({ fill: 'rgba(17,17,17,0.05)' })} />
                <Bar dataKey="value" name={adminText('statistikyPage.axes.views')} fill="#3da865" radius={[8, 8, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ChartPanel>

            <ChartPanel
              title={adminText('statistikyPage.charts.browsers')}
              description={adminText('statistikyPage.charts.browsersDesc')}
              hasData={summary.browsers.length > 0}
              emptyLabel={adminText('statistikyPage.empty')}
            >
              <BarChart data={summary.browsers} margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(17,17,17,0.12)" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} height={44}>
                  <Label value={adminText('statistikyPage.axes.browser')} position="insideBottom" offset={-2} style={{ fontSize: 12, fontWeight: 700, fill: '#6b6b6b' }} />
                </XAxis>
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={52}>
                  <Label value={adminText('statistikyPage.axes.views')} angle={-90} position="insideLeft" style={{ fontSize: 12, fontWeight: 700, fill: '#6b6b6b', textAnchor: 'middle' }} />
                </YAxis>
                <Tooltip content={<ChartTooltip />} {...chartTooltipProps({ fill: 'rgba(17,17,17,0.05)' })} />
                <Bar dataKey="value" name={adminText('statistikyPage.axes.views')} fill="#289e8f" radius={[8, 8, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ChartPanel>

            <ChartPanel
              wide
              title={adminText('statistikyPage.charts.engagementByPage')}
              description={adminText('statistikyPage.charts.engagementByPageDesc')}
              hasData={summary.engagementByPath.length > 0}
              emptyLabel={adminText('statistikyPage.empty')}
            >
              <BarChart data={summary.engagementByPath} layout="vertical" margin={{ top: 8, left: 8, right: 24, bottom: 24 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(17,17,17,0.12)" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} height={44}>
                  <Label value={adminText('statistikyPage.axes.time')} position="insideBottom" offset={-2} style={{ fontSize: 12, fontWeight: 700, fill: '#6b6b6b' }} />
                </XAxis>
                <YAxis type="category" dataKey="label" width={150} tick={{ fontSize: 11 }} />
                <Tooltip content={<DurationTooltip />} {...chartTooltipProps({ fill: 'rgba(17,17,17,0.05)' })} />
                <Bar dataKey="value" name={adminText('statistikyPage.axes.time')} fill="#6b6b6b" radius={[0, 8, 8, 0]} isAnimationActive={false} />
              </BarChart>
            </ChartPanel>

            <ChartPanel
              wide
              title={adminText('statistikyPage.charts.socialClicks')}
              description={adminText('statistikyPage.charts.socialClicksDesc')}
              hasData={summary.socialClicks.length > 0}
              emptyLabel={adminText('statistikyPage.empty')}
            >
              <BarChart data={summary.socialClicks} margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(17,17,17,0.12)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} height={44}>
                  <Label value={adminText('statistikyPage.columns.target')} position="insideBottom" offset={-2} style={{ fontSize: 12, fontWeight: 700, fill: '#6b6b6b' }} />
                </XAxis>
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={52}>
                  <Label value={adminText('statistikyPage.axes.clicks')} angle={-90} position="insideLeft" style={{ fontSize: 12, fontWeight: 700, fill: '#6b6b6b', textAnchor: 'middle' }} />
                </YAxis>
                <Tooltip content={<ClickTooltip />} {...chartTooltipProps({ fill: 'rgba(17,17,17,0.05)' })} />
                <Bar dataKey="value" name={adminText('statistikyPage.axes.clicks')} fill="#ffbe3d" radius={[8, 8, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ChartPanel>
          </div>

          <div className="admin-statistiky__tables">
            <DataTable
              title={adminText('statistikyPage.tables.topPages')}
              description={adminText('statistikyPage.tables.topPagesDesc')}
              emptyLabel={adminText('statistikyPage.empty')}
              columns={[
                { key: 'path', label: adminText('statistikyPage.columns.path') },
                { key: 'views', label: adminText('statistikyPage.columns.views') },
              ]}
              rows={pathRows}
            />

            <DataTable
              title={adminText('statistikyPage.tables.entryPages')}
              description={adminText('statistikyPage.tables.entryPagesDesc')}
              emptyLabel={adminText('statistikyPage.empty')}
              columns={[
                { key: 'path', label: adminText('statistikyPage.columns.path') },
                { key: 'views', label: adminText('statistikyPage.columns.views') },
              ]}
              rows={entryRows}
            />

            <DataTable
              title={adminText('statistikyPage.tables.exitPages')}
              description={adminText('statistikyPage.tables.exitPagesDesc')}
              emptyLabel={adminText('statistikyPage.empty')}
              columns={[
                { key: 'path', label: adminText('statistikyPage.columns.path') },
                { key: 'views', label: adminText('statistikyPage.columns.views') },
              ]}
              rows={exitRows}
            />

            <DataTable
              title={adminText('statistikyPage.tables.socialClicks')}
              description={adminText('statistikyPage.tables.socialClicksDesc')}
              emptyLabel={adminText('statistikyPage.empty')}
              columns={[
                { key: 'target', label: adminText('statistikyPage.columns.target') },
                { key: 'clicks', label: adminText('statistikyPage.columns.clicks') },
              ]}
              rows={clickTableRows(summary.socialClicks)}
            />

            <DataTable
              title={adminText('statistikyPage.tables.navClicks')}
              description={adminText('statistikyPage.tables.navClicksDesc')}
              emptyLabel={adminText('statistikyPage.empty')}
              columns={[
                { key: 'target', label: adminText('statistikyPage.columns.target') },
                { key: 'clicks', label: adminText('statistikyPage.columns.clicks') },
              ]}
              rows={clickTableRows(summary.navClicks)}
            />

            <DataTable
              title={adminText('statistikyPage.tables.outboundClicks')}
              description={adminText('statistikyPage.tables.outboundClicksDesc')}
              emptyLabel={adminText('statistikyPage.empty')}
              columns={[
                { key: 'target', label: adminText('statistikyPage.columns.target') },
                { key: 'clicks', label: adminText('statistikyPage.columns.clicks') },
              ]}
              rows={clickTableRows(summary.outboundClicks)}
            />

            <DataTable
              title={adminText('statistikyPage.tables.notificationClicks')}
              description={adminText('statistikyPage.tables.notificationClicksDesc')}
              emptyLabel={adminText('statistikyPage.empty')}
              columns={[
                { key: 'target', label: adminText('statistikyPage.columns.target') },
                { key: 'clicks', label: adminText('statistikyPage.columns.clicks') },
              ]}
              rows={clickTableRows(summary.notificationClicks)}
            />

            <DataTable
              title={adminText('statistikyPage.tables.contactClicks')}
              description={adminText('statistikyPage.tables.contactClicksDesc')}
              emptyLabel={adminText('statistikyPage.empty')}
              columns={[
                { key: 'target', label: adminText('statistikyPage.columns.target') },
                { key: 'clicks', label: adminText('statistikyPage.columns.clicks') },
              ]}
              rows={clickTableRows(summary.contactClicks)}
            />

            <DataTable
              title={adminText('statistikyPage.tables.blogLikes')}
              description={adminText('statistikyPage.tables.blogLikesDesc')}
              emptyLabel={adminText('statistikyPage.empty')}
              columns={[
                { key: 'target', label: adminText('statistikyPage.columns.article') },
                { key: 'clicks', label: adminText('statistikyPage.columns.clicks') },
              ]}
              rows={clickTableRows(summary.blogLikes)}
            />

            <DataTable
              title={adminText('statistikyPage.tables.blogComments')}
              description={adminText('statistikyPage.tables.blogCommentsDesc')}
              emptyLabel={adminText('statistikyPage.empty')}
              columns={[
                { key: 'target', label: adminText('statistikyPage.columns.article') },
                { key: 'clicks', label: adminText('statistikyPage.columns.clicks') },
              ]}
              rows={clickTableRows(summary.blogComments)}
            />

            <DataTable
              title={adminText('statistikyPage.tables.articles')}
              description={adminText('statistikyPage.tables.articlesDesc')}
              emptyLabel={adminText('statistikyPage.empty')}
              columns={[
                { key: 'title', label: adminText('statistikyPage.columns.article') },
                { key: 'views', label: adminText('statistikyPage.columns.views') },
              ]}
              rows={articleRows}
            />

            <DataTable
              title={adminText('statistikyPage.tables.events')}
              description={adminText('statistikyPage.tables.eventsDesc')}
              emptyLabel={adminText('statistikyPage.empty')}
              columns={[
                { key: 'title', label: adminText('statistikyPage.columns.event') },
                { key: 'views', label: adminText('statistikyPage.columns.views') },
              ]}
              rows={eventRows}
            />

            <DataTable
              title={adminText('statistikyPage.tables.sessions')}
              description={adminText('statistikyPage.tables.sessionsDesc')}
              emptyLabel={adminText('statistikyPage.empty')}
              columns={[
                { key: 'started', label: adminText('statistikyPage.columns.started') },
                { key: 'device', label: adminText('statistikyPage.columns.device') },
                { key: 'os', label: adminText('statistikyPage.columns.os') },
                { key: 'browser', label: adminText('statistikyPage.columns.browser') },
                { key: 'pages', label: adminText('statistikyPage.columns.pages') },
                { key: 'time', label: adminText('statistikyPage.columns.time') },
                { key: 'journey', label: adminText('statistikyPage.columns.journey') },
              ]}
              rows={sessionRows}
            />
          </div>
        </>
      )}
    </div>
  );
}
