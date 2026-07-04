/**
 * DeleteConfirmModal
 * A premium, animated confirmation modal for delete actions.
 *
 * Props:
 *  - isOpen        {boolean}   Whether the modal is visible
 *  - title         {string}    Main heading (default: "تأكيد الحذف")
 *  - itemName      {string}    The name of the item being deleted, shown in quotes
 *  - itemType      {string}    Arabic label for the item type (e.g. "الاختبار", "السؤال")
 *  - warning       {string}    Optional extra warning text shown in a yellow box
 *  - onConfirm     {function}  Called when the user clicks "نعم، احذف"
 *  - onCancel      {function}  Called when the user clicks "إلغاء" or the backdrop
 *  - isLoading     {boolean}   Shows a spinner on the confirm button while deleting
 */
export default function DeleteConfirmModal({
  isOpen,
  title = 'تأكيد الحذف',
  itemName,
  itemType,
  warning,
  onConfirm,
  onCancel,
  isLoading = false,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="position-fixed d-flex align-items-center justify-content-center p-3"
      style={{
        inset: 0,
        zIndex: 2000,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
      }}
      onClick={onCancel}
    >
      <div
        className="rounded-4 p-4 p-md-5 text-center position-relative"
        style={{
          maxWidth: '440px',
          width: '100%',
          background: 'linear-gradient(145deg, rgba(17,20,23,0.98), rgba(11,14,17,0.98))',
          border: '1px solid rgba(255,82,82,0.22)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.55), 0 0 40px rgba(255,82,82,0.08)',
          animation: 'fadeInScale 0.25s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div
          className="d-flex align-items-center justify-content-center mx-auto mb-4"
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(255,82,82,0.1)',
            border: '1px solid rgba(255,82,82,0.22)',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '32px', color: '#ff5252', fontVariationSettings: "'FILL' 1" }}
          >
            delete_forever
          </span>
        </div>

        {/* Heading */}
        <h3
          className="text-white fw-bold mb-2"
          style={{ fontSize: '20px', fontFamily: 'var(--font-sans)' }}
        >
          {title}
        </h3>

        {/* Body text */}
        {(itemType || itemName) && (
          <p className="text-muted mb-1" style={{ fontSize: '14px', fontFamily: 'var(--font-sans)' }}>
            {itemType ? `هل أنت متأكد أنك تريد حذف ${itemType}` : 'هل أنت متأكد من الحذف'}
            {itemName ? ':' : '؟'}
          </p>
        )}
        {itemName && (
          <p
            className="fw-bold mb-4"
            style={{ color: '#ff8a80', fontSize: '16px', fontFamily: 'var(--font-sans)' }}
          >
            &ldquo;{itemName}&rdquo;
          </p>
        )}

        {/* Optional warning box */}
        {warning && (
          <div
            className="rounded-3 px-3 py-2 mb-4 mx-auto d-flex align-items-center gap-2"
            style={{
              background: 'rgba(255,213,79,0.08)',
              border: '1px solid rgba(255,213,79,0.22)',
              maxWidth: '360px',
              fontSize: '12px',
              color: '#ffd54f',
              textAlign: 'right',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px', flexShrink: 0 }}>
              warning
            </span>
            <span>{warning}</span>
          </div>
        )}

        {/* Actions */}
        <div className="d-flex gap-3 justify-content-center">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="btn px-4 py-2 fw-bold d-flex align-items-center gap-2"
            style={{
              background: 'rgba(255,82,82,0.15)',
              color: '#ff5252',
              border: '1px solid rgba(255,82,82,0.3)',
              borderRadius: '12px',
              fontSize: '14px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,82,82,0.28)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,82,82,0.15)'; }}
          >
            {isLoading ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
            ) : (
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
            )}
            نعم، احذف
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="btn px-4 py-2 fw-bold"
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: '#bacbb9',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize: '14px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
