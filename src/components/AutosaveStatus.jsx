const LABELS = {
  saving: 'Ukládám…',
  saved: 'Uloženo',
  error: 'Uložení se nezdařilo',
};

export default function AutosaveStatus({ status = 'idle' }) {
  if (status === 'idle') return <span className="autosave-status" aria-hidden="true" />;

  return (
    <p className={`autosave-status autosave-status--${status}`} role="status">
      {LABELS[status] || ''}
    </p>
  );
}
