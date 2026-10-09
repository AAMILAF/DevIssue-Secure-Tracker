import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getIssueById, deleteIssue } from '../services/issueService'
import Badge from '../components/Badge'
import ConfirmModal from '../components/ConfirmModal'

const fmt = (iso) =>
  new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

export default function IssueDetail() {
  // useParams reads the :id segment from the URL, e.g. /issues/64abc…
  const { id } = useParams()
  const navigate = useNavigate()

  const [issue,    setIssue]    = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [showModal, setShowModal] = useState(false)
  const [deleting,  setDeleting]  = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getIssueById(id)
        setIssue(data)
      } catch (err) {
        if (err.response?.status === 404) {
          setError('Issue not found.')
        } else if (err.response?.status === 400) {
          setError('Invalid issue ID.')
        } else {
          setError('Could not load issue. Make sure the backend server is running.')
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteIssue(id)
      navigate('/')   // Go back to dashboard after successful deletion
    } catch {
      setError('Failed to delete the issue. Please try again.')
      setShowModal(false)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <main className="page-container">
        <div className="loading-box" aria-live="polite" aria-busy="true">
          <div className="spinner" aria-hidden="true" />
          Loading issue…
        </div>
      </main>
    )
  }

  if (error || !issue) {
    return (
      <main className="page-container">
        <Link to="/" className="back-link">← Back to Dashboard</Link>
        <div className="error-box" role="alert">{error || 'Issue not found.'}</div>
      </main>
    )
  }

  return (
    <main className="page-container">
      <Link to="/" className="back-link">← Back to Dashboard</Link>

      <div className="card">
        {/* ── Header: title + badges ── */}
        <div className="detail-header">
          <h1 className="detail-title">{issue.title}</h1>
          <div className="detail-badges">
            <Badge value={issue.type}     type="type" />
            <Badge value={issue.severity} type="severity" />
            <Badge value={issue.status}   type="status" />
          </div>
        </div>

        {/* ── Metadata rows ── */}
        <div className="detail-meta">
          <div className="meta-row">
            <span className="meta-key">Created</span>
            <span className="meta-val">{fmt(issue.createdAt)}</span>
          </div>
          <div className="meta-row">
            <span className="meta-key">Updated</span>
            <span className="meta-val">{fmt(issue.updatedAt)}</span>
          </div>
          <div className="meta-row">
            <span className="meta-key">ID</span>
            <span className="meta-val" style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-muted)' }}>
              {issue._id}
            </span>
          </div>
        </div>

        {/* ── Description ── */}
        {issue.description ? (
          <div className="description-box">
            <h3>Description</h3>
            <p>{issue.description}</p>
          </div>
        ) : (
          <div className="description-box">
            <h3>Description</h3>
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
              No description provided.
            </p>
          </div>
        )}

        {/* ── Actions ── */}
        <div className="detail-actions">
          <Link to={`/issues/${issue._id}/edit`} className="btn btn-secondary">
            ✏️ Edit Issue
          </Link>
          <button
            className="btn btn-danger"
            onClick={() => setShowModal(true)}
          >
            🗑 Delete Issue
          </button>
        </div>
      </div>

      {/* ── Delete confirmation modal ── */}
      {showModal && (
        <ConfirmModal
          message={`Delete "${issue.title}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setShowModal(false)}
          loading={deleting}
        />
      )}
    </main>
  )
}
