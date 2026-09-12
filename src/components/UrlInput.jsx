import { useRef } from 'react';
import { composeUrlInputValue, splitUrlInputValue } from '../utils/url-input';

export default function UrlInput({
  id,
  name,
  value = '',
  onChange,
  className = '',
  placeholder = '',
  disabled = false,
  readOnly = false,
  required = false,
  allowRelative = false,
  allowSpecialSchemes = false,
  autoFocus = false,
  inputMode = 'url',
  ...inputProps
}) {
  const inputRef = useRef(null);
  const options = { allowRelative, allowSpecialSchemes };
  const { prefix, rest, mode } = splitUrlInputValue(value, options);
  const showPrefix = mode === 'web';

  const emit = (nextText) => {
    onChange?.(composeUrlInputValue(nextText, options));
  };

  const handleWrapperMouseDown = (event) => {
    if (disabled || readOnly) return;
    if (event.target === inputRef.current) return;
    event.preventDefault();
    inputRef.current?.focus();
  };

  const handlePaste = (event) => {
    const pasted = event.clipboardData?.getData('text');
    if (pasted == null) return;

    const input = event.currentTarget;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    const next = `${input.value.slice(0, start)}${pasted}${input.value.slice(end)}`;

    event.preventDefault();
    emit(next);
  };

  return (
    <div
      className={[
        'url-input',
        'admin-form__input',
        className,
        disabled ? 'url-input--disabled' : '',
        readOnly ? 'url-input--readonly' : '',
        showPrefix ? '' : 'url-input--bare',
      ].filter(Boolean).join(' ')}
      onMouseDown={handleWrapperMouseDown}
    >
      {showPrefix && (
        <span className="url-input__prefix" aria-hidden="true">{prefix}</span>
      )}
      <input
        {...inputProps}
        ref={inputRef}
        id={id}
        name={name}
        type="text"
        className="url-input__field"
        value={rest}
        onChange={(event) => emit(event.target.value)}
        onPaste={handlePaste}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        autoFocus={autoFocus}
        inputMode={inputMode}
        autoComplete="url"
        spellCheck={false}
      />
    </div>
  );
}
