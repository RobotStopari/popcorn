export default function SectionLabel({ label, as: Tag = 'span', theme }) {
  const lineClass = theme === 'blue'
    ? 'section__label-line section__label-line--blue'
    : theme === 'red'
      ? 'section__label-line section__label-line--red'
      : 'section__label-line section__label-line--red';

  const textClass = theme
    ? `section__label-text section__label-text--${theme}`
    : 'section__label-text';

  return (
    <div className="section__label reveal reveal--scale">
      <span className={lineClass} aria-hidden="true" />
      <Tag className={textClass}>{label}</Tag>
      <span className={lineClass} aria-hidden="true" />
    </div>
  );
}
