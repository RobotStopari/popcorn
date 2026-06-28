export default function FlowConnector({ compact = false }) {
  return (
    <div
      className={`flow-connector reveal${compact ? ' flow-connector--compact' : ''}`}
      aria-hidden="true"
    >
      <span className="flow-connector__line flow-connector__line--orange" />
      <span className="flow-connector__dot" />
      <span className="flow-connector__line flow-connector__line--red" />
    </div>
  );
}
