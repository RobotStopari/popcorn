export function getAdminTabDirection(tabs, fromId, toId) {
  const order = tabs.map((tab) => tab.id);
  const from = order.indexOf(fromId);
  const to = order.indexOf(toId);
  if (to === from || to < 0 || from < 0) return 0;
  return to > from ? 1 : -1;
}

export function AdminTabPanel({
  id,
  activeTab,
  direction = 0,
  idPrefix = 'admin',
  children,
}) {
  if (activeTab !== id) return null;

  const directionClass = direction > 0
    ? ' admin-event-tabs__panel--forward'
    : direction < 0
      ? ' admin-event-tabs__panel--back'
      : '';

  return (
    <div
      id={`${idPrefix}-panel-${id}`}
      role="tabpanel"
      aria-labelledby={`${idPrefix}-tab-${id}`}
      className={`admin-event-tabs__panel${directionClass}`}
    >
      {children}
    </div>
  );
}

export default function AdminTabs({
  tabs,
  activeTab,
  onChange,
  idPrefix = 'admin',
  label,
  badges = {},
  attentionTabs = new Set(),
}) {
  return (
    <div className="admin-event-tabs" role="tablist" aria-label={label}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          id={`${idPrefix}-tab-${tab.id}`}
          aria-selected={activeTab === tab.id}
          aria-controls={`${idPrefix}-panel-${tab.id}`}
          className={`admin-event-tabs__tab admin-event-tabs__tab--${tab.id}${activeTab === tab.id ? ' admin-event-tabs__tab--active' : ''}${attentionTabs.has(tab.id) ? ' admin-event-tabs__tab--attention' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon ? (
            <span
              className="admin-event-tabs__icon"
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: tab.icon }}
            />
          ) : null}
          <span className="admin-event-tabs__copy">
            <span className="admin-event-tabs__label">{tab.label}</span>
            {tab.hint && <span className="admin-event-tabs__hint">{tab.hint}</span>}
          </span>
          {badges[tab.id] != null && badges[tab.id] !== '' ? (
            <span className="admin-event-tabs__badge">{badges[tab.id]}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
