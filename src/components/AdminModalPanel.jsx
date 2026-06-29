import { forwardRef } from 'react';

const AdminModalPanel = forwardRef(function AdminModalPanel(
  { className = '', children, footer = null, panelRef = null, onClick, onMouseDown, bare = false },
  scrollRef,
) {
  if (bare) {
    return (
      <div
        ref={scrollRef}
        className={['event-share-form__content', className].filter(Boolean).join(' ')}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      className={['admin-modal__panel', className].filter(Boolean).join(' ')}
      onClick={onClick}
      onMouseDown={onMouseDown}
    >
      <div ref={scrollRef} className="admin-modal__scroll">
        {children}
      </div>
      {footer}
    </div>
  );
});

export default AdminModalPanel;
