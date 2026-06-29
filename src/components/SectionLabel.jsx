export default function SectionLabel({ label, as: Tag = 'span' }) {
  return (
    <div className="section__label reveal reveal--scale">
      <span className="section__label-line section__label-line--red" aria-hidden="true" />
      <Tag className="section__label-text">{label}</Tag>
      <span className="section__label-line section__label-line--red" aria-hidden="true" />
    </div>
  );
}
