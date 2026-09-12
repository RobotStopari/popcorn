export default function AdminFormBlock({ title, hint, accent = '', children }) {
  return (
    <section className={`admin-event-block${accent ? ` admin-event-block--${accent}` : ''}`}>
      {(title || hint) && (
        <div className="admin-event-block__head">
          {title && <h3 className="admin-event-block__title">{title}</h3>}
          {hint && <p className="admin-event-block__hint">{hint}</p>}
        </div>
      )}
      <div className="admin-event-block__content">{children}</div>
    </section>
  );
}
