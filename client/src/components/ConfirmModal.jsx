// ConfirmModal renders a dark overlay with a card asking the user
// to confirm a destructive action before it executes.
//
// Props:
//   message    – the question to show, e.g. "Delete this issue?"
//   onConfirm  – called when the user clicks Confirm
//   onCancel   – called when the user clicks Cancel or presses Escape
//   loading    – disables buttons while the delete request is in-flight
export default function ConfirmModal({ message, onConfirm, onCancel, loading }) {
  // Close the modal when clicking the backdrop itself (not the card)
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onCancel()
  }

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-box">
        <h3 id="modal-title">Confirm Delete</h3>
        <p>{message}</p>
        <div className="modal-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={onConfirm}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
