import { parseMedallionRoles } from '../utils/page-blocks';

export default function MedallionRoleTags({
  roles,
  className = '',
}) {
  const items = parseMedallionRoles(roles);
  if (!items.length) return null;

  return (
    <ul className={`medallion-roles${className ? ` ${className}` : ''}`}>
      {items.map((role) => (
        <li key={role} className="medallion-roles__tag">
          {role}
        </li>
      ))}
    </ul>
  );
}
