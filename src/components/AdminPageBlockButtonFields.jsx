import { PAGE_BLOCK_BUTTON_COLORS } from '../data/page-block-button-colors';

function BlockEditorField({ label, htmlFor, hint, children }) {
  const Tag = htmlFor ? 'label' : 'div';
  return (
    <div className="admin-page-block-field">
      {label && (
        <Tag className="admin-page-block-field__label" htmlFor={htmlFor}>
          {label}
        </Tag>
      )}
      {hint && <p className="admin-page-block-field__hint">{hint}</p>}
      {children}
    </div>
  );
}

export default function AdminPageBlockButtonFields({
  prefix,
  button,
  onChange,
}) {
  const update = (patch) => onChange({ ...button, ...patch });
  const selectedColor = button.color || 'orange';

  return (
    <>
      <BlockEditorField label="Text tlačítka" htmlFor={`${prefix}-label`}>
        <input
          id={`${prefix}-label`}
          className="admin-form__input admin-page-block-field__input"
          value={button.label || ''}
          onChange={(event) => update({ label: event.target.value })}
          placeholder="Např. Více informací"
        />
      </BlockEditorField>

      <BlockEditorField
        label="Odkaz"
        htmlFor={`${prefix}-href`}
        hint="Interní stránka (/kontakt) nebo celá URL."
      >
        <input
          id={`${prefix}-href`}
          className="admin-form__input admin-page-block-field__input"
          type="text"
          value={button.href || ''}
          onChange={(event) => update({ href: event.target.value })}
          placeholder="https://… nebo /stranka"
        />
      </BlockEditorField>

      <BlockEditorField label="Barva tlačítka">
        <div className="admin-notification-form__swatches">
          {PAGE_BLOCK_BUTTON_COLORS.map((color) => (
            <label
              key={color.id}
              className={`admin-notification-form__swatch${selectedColor === color.id ? ' admin-notification-form__swatch--active' : ''}`}
              style={{ '--swatch-color': `var(--${color.token})` }}
            >
              <input
                type="radio"
                name={`${prefix}-color`}
                value={color.id}
                checked={selectedColor === color.id}
                onChange={() => update({ color: color.id })}
              />
              <span>{color.label}</span>
            </label>
          ))}
        </div>
      </BlockEditorField>

      <label className="admin-toggle admin-page-block-button__toggle">
        <input
          type="checkbox"
          checked={Boolean(button.openInNewTab)}
          onChange={(event) => update({ openInNewTab: event.target.checked })}
        />
        <span className="admin-toggle__track" aria-hidden="true">
          <span className="admin-toggle__thumb" />
        </span>
        <span className="admin-toggle__label">Otevřít v novém okně</span>
      </label>
    </>
  );
}
