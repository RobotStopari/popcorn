import { forwardRef } from 'react';

const AdminModalPanel = forwardRef(function AdminModalPanel(
  { className = '', children, onClick, onMouseDown, bare = false },
  ref,
) {
  if (bare) {
    return (
      <div
        ref={ref}
        className={['event-share-form__content', className].filter(Boolean).join(' ')}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={['admin-modal__panel', className].filter(Boolean).join(' ')}
      onClick={onClick}
      onMouseDown={onMouseDown}
    >
      <div ref={ref} className="admin-modal__scroll">
        {children}
      </div>
    </div>
  );
});

export default AdminModalPanel;
