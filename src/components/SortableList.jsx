import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

function DragHandleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <circle cx="9" cy="7" r="1.5" />
      <circle cx="15" cy="7" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="17" r="1.5" />
      <circle cx="15" cy="17" r="1.5" />
    </svg>
  );
}

function getDropIndex(clientY, baseRects, dragIndex) {
  if (!baseRects.length) return dragIndex ?? 0;

  const dragRect = baseRects[dragIndex];
  if (dragRect && clientY >= dragRect.top && clientY <= dragRect.bottom) {
    if (clientY <= dragRect.top + dragRect.height / 2) {
      return dragIndex;
    }
    return dragIndex < baseRects.length - 1 ? dragIndex + 1 : dragIndex;
  }

  for (let index = 0; index < baseRects.length; index += 1) {
    if (index === dragIndex) continue;

    const rect = baseRects[index];
    if (!rect) continue;

    if (clientY < rect.top + rect.height / 2) return index;
  }

  return baseRects.length - 1;
}

function getItemShift(index, from, over, stride) {
  if (from === null || over === null || from === over) return 0;

  if (from < over) {
    if (index > from && index <= over) return -stride;
  } else if (index >= over && index < from) {
    return stride;
  }

  return 0;
}

export default function SortableList({
  items,
  onReorder,
  listClassName = '',
  itemClassName = '',
  ghostClassName = '',
  handleLabel = 'Přesunout položku',
  getItemKey = (item) => item.id,
  renderItem,
  renderGhostItem,
}) {
  const rowRefs = useRef([]);
  const dragRef = useRef(null);
  const itemsRef = useRef(items);
  const onReorderRef = useRef(onReorder);

  itemsRef.current = items;
  onReorderRef.current = onReorder;

  const [dragState, setDragState] = useState(null);

  const finishDrag = () => {
    const drag = dragRef.current;
    if (!drag) return;

    const { from, over } = drag;
    if (from !== null && over !== null && from !== over) {
      const next = [...itemsRef.current];
      const [moved] = next.splice(from, 1);
      next.splice(over, 0, moved);
      onReorderRef.current(next);
    }

    dragRef.current = null;
    setDragState(null);
    document.body.classList.remove('admin-sortable-dragging');
  };

  useEffect(() => {
    if (!dragState) return undefined;

    const handlePointerMove = (event) => {
      const drag = dragRef.current;
      if (!drag) return;

      const over = getDropIndex(event.clientY, drag.baseRects, drag.from);

      dragRef.current = {
        ...drag,
        over,
        x: event.clientX,
        y: event.clientY,
      };

      setDragState({ ...dragRef.current });
    };

    const handlePointerUp = () => finishDrag();

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [Boolean(dragState)]);

  const handlePointerDown = (event, index) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    const row = rowRefs.current[index];
    if (!row) return;

    event.preventDefault();

    const rect = row.getBoundingClientRect();
    const styles = window.getComputedStyle(row);
    const marginBottom = Number.parseFloat(styles.marginBottom) || 0;
    const nextRow = rowRefs.current[index + 1];
    const stride = nextRow
      ? nextRow.getBoundingClientRect().top - rect.top
      : rect.height + marginBottom;
    const baseRects = rowRefs.current.map((element) => {
      if (!element) return null;
      const elementRect = element.getBoundingClientRect();
      return {
        top: elementRect.top,
        bottom: elementRect.bottom,
        height: elementRect.height,
      };
    });

    const nextDrag = {
      from: index,
      over: index,
      x: event.clientX,
      y: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
      stride,
      baseRects,
    };

    dragRef.current = nextDrag;
    setDragState(nextDrag);
    document.body.classList.add('admin-sortable-dragging');
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  if (!items.length) return null;

  const draggedItem = dragState ? items[dragState.from] : null;

  return (
    <>
      <ul className={`admin-sortable ${listClassName}`.trim()}>
        {items.map((item, index) => {
          const isDragging = dragState?.from === index;
          const shift = dragState
            ? getItemShift(index, dragState.from, dragState.over, dragState.stride)
            : 0;

          return (
            <li
              key={getItemKey(item)}
              ref={(element) => {
                rowRefs.current[index] = element;
              }}
              className={`${itemClassName}${isDragging ? ' admin-sortable__item--dragging' : ''}`.trim()}
              style={{
                transform: `translateY(${shift}px)`,
              }}
            >
              <button
                type="button"
                className="admin-sortable__handle"
                aria-label={`${handleLabel} ${index + 1}`}
                onPointerDown={(event) => handlePointerDown(event, index)}
              >
                <DragHandleIcon />
              </button>
              {renderItem(item, index)}
            </li>
          );
        })}
      </ul>

      {dragState && draggedItem && createPortal(
        <div
          className={`admin-sortable__ghost ${ghostClassName}`.trim()}
          style={{
            width: dragState.width,
            minHeight: dragState.height,
            transform: `translate(${dragState.x - dragState.offsetX}px, ${dragState.y - dragState.offsetY}px)`,
          }}
          aria-hidden="true"
        >
          <span className="admin-sortable__handle admin-sortable__handle--ghost">
            <DragHandleIcon />
          </span>
          {renderGhostItem
            ? renderGhostItem(draggedItem, dragState.from)
            : renderItem(draggedItem, dragState.from)}
        </div>,
        document.body,
      )}
    </>
  );
}
