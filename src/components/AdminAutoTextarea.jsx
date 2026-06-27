import { useEffect, useRef } from 'react';

export default function AdminAutoTextarea({
  value,
  onChange,
  className = '',
  minRows = 2,
  ...props
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.style.height = 'auto';
    const lineHeight = Number.parseFloat(getComputedStyle(el).lineHeight) || 22;
    const minHeight = lineHeight * minRows + 24;
    el.style.height = `${Math.max(minHeight, el.scrollHeight)}px`;
  }, [value, minRows]);

  return (
    <textarea
      ref={ref}
      className={className}
      value={value}
      onChange={onChange}
      rows={minRows}
      {...props}
    />
  );
}
