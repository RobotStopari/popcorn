export default function SectionLabel({ label }) {
  return (
    <div className="section__label reveal reveal--scale">
      <span className="section__label-line section__label-line--orange" />
      <span className="section__label-text">{label}</span>
      <span className="section__label-line section__label-line--red" />
    </div>
  );
}
