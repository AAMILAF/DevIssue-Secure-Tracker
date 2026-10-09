import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getIssues, deleteIssue } from '../services/issueService'
import Badge from '../components/Badge'
import ConfirmModal from '../components/ConfirmModal'

// Small helper — formats an ISO date string to a readable date
const fmt = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

export default function Dashboard() {
  const navigate = useNavigate()

  // Filtered issues — what the table shows (changes with search/filter)
  const [issues, setIssues]     = useState([])
  const [count, setCount]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  // All issues — used exclusively for stat cards so they never reflect filters
  // This is fetched once on mount and refreshed only after a create or delete.
  // It deliberately has NO dependency on search/filter state.
  const [allIssues, setAllIssues] = useState([])

  // Search / filter state — each matches a query param the API accepts
  const [search,   setSearch]   = useState('')
  const [type,     setType]     = useState('')
  const [severity, setSeverity] = useState('')
  const [status,   setStatus]   = useState('')

  // Delete confirmation modal state
  const [toDelete, setToDelete]       = useState(null)   // the issue object to delete
  const [deleting, setDeleting]       = useState(false)  // request in-flight

  // fetchAllIssues loads every issue with no filters.
  // Called once on mount and again after any create or delete so the stat
  // cards stay accurate without reflecting whatever filter is currently active.
  const fetchAllIssues = useCallback(async () => {
    try {
      const data = await getIssues()   // no params → returns everything
      setAllIssues(data.issues)
    } catch {
      // Stats silently show stale data if this fails — the main error
      // banner from fetchIssues is already shown to the user.
    }
  }, [])  // empty deps — never recreated, never depends on filter state

  // fetchIssues is memoised with useCallback so we can call it from
  // multiple places (initial load, after a delete) without re-creating it.
  const fetchIssues = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      // Build params — only include non-empty values
      const params = {}
      if (search)   params.search   = search
      if (type)     params.type     = type
      if (severity) params.severity = severity
      if (status)   params.status   = status

      const data = await getIssues(params)
      setIssues(data.issues)
      setCount(data.count)
    } catch (err) {
      setError('Could not load issues. Make sure the backend server is running.')
    } finally {
      setLoading(false)
    }
  }, [search, type, severity, status])

  // Load all issues once on mount for the stat cards
  useEffect(() => {
    fetchAllIssues()
  }, [fetchAllIssues])

  // Run fetchIssues whenever any filter/search value changes
  useEffect(() => {
    // Small debounce for the search input — wait 300ms after the
    // user stops typing before sending a request
    const timer = setTimeout(fetchIssues, 300)
    return () => clearTimeout(timer)
  }, [fetchIssues])

  // Stats are derived from allIssues (the unfiltered set), so they always
  // reflect the true database totals regardless of active search or filters.
  const stats = {
    total:    allIssues.length,
    open:     allIssues.filter((i) => i.status === 'open').length,
    critical: allIssues.filter((i) => i.severity === 'critical').length,
    vulns:    allIssues.filter((i) => i.type === 'vulnerability').length,
  }

  const handleDeleteConfirm = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await deleteIssue(toDelete._id)
      setToDelete(null)
      fetchIssues()       // refresh the filtered table
      fetchAllIssues()    // refresh the stat card totals
    } catch {
      setError('Failed to delete the issue. Please try again.')
      setToDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  const clearFilters = () => {
    setSearch(''); setType(''); setSeverity(''); setStatus('')
  }

  const hasFilters = search || type || severity || status

  return (
    <main className="page-container">
      {/* ── Page header ── */}
      <div className="page-header">
        <h1>Dashboard</h1>
        <Link to="/issues/new" className="btn btn-primary">
          + New Issue
        </Link>
      </div>

      {/* ── Stat cards ── */}
      <div className="stats-grid" role="region" aria-label="Issue statistics">
        <div className="stat-card">
          <span className="stat-label">Total Issues</span>
          <span className="stat-value blue">{loading ? '—' : stats.total}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Open</span>
          <span className="stat-value green">{loading ? '—' : stats.open}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Critical</span>
          <span className="stat-value red">{loading ? '—' : stats.critical}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Vulnerabilities</span>
          <span className="stat-value purple">{loading ? '—' : stats.vulns}</span>
        </div>
      </div>

      {/* ── Search & filters toolbar ── */}
      <div className="toolbar" role="search">
        <input
          className="search-input"
          type="search"
          placeholder="Search issues…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search issues by title or description"
        />

        <select
          className="filter-select"
          value={type}
          onChange={(e) => setType(e.target.value)}
          aria-label="Filter by type"
        >
          <option value="">All Types</option>
          <option value="bug">Bug</option>
          <option value="vulnerability">Vulnerability</option>
          <option value="enhancement">Enhancement</option>
        </select>

        <select
          className="filter-select"
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          aria-label="Filter by severity"
        >
          <option value="">All Severities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>

        <select
          className="filter-select"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        {hasFilters && (
          <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* ── Error banner ── */}
      {error && <div className="alert alert-error" role="alert">{error}</div>}

      {/* ── Issues table ── */}
      <div className="card">
        {loading ? (
          <div className="loading-box" aria-live="polite" aria-busy="true">
            <div className="spinner" aria-hidden="true" />
            Loading issues…
          </div>
        ) : issues.length === 0 ? (
          <div className="empty-box" aria-live="polite">
            {hasFilters
              ? 'No issues match the current filters.'
              : 'No issues yet. Click "+ New Issue" to get started.'}
          </div>
        ) : (
          <>
            <p className="result-count">
              Showing {count} {count === 1 ? 'issue' : 'issues'}
            </p>
            <div className="table-wrapper">
              <table aria-label="Issues list">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.map((issue) => (
                    <tr key={issue._id}>
                      <td className="title-cell">
                        <Link
                          to={`/issues/${issue._id}`}
                          className="title-link"
                          title={issue.title}
                        >
                          {issue.title}
                        </Link>
                      </td>
                      <td><Badge value={issue.type} type="type" /></td>
                      <td><Badge value={issue.severity} type="severity" /></td>
                      <td><Badge value={issue.status} type="status" /></td>
                      <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {fmt(issue.createdAt)}
                      </td>
                      <td>
                        <div className="actions-cell">
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => navigate(`/issues/${issue._id}/edit`)}
                            aria-label={`Edit ${issue.title}`}
                          >
                            ✏️
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setToDelete(issue)}
                            aria-label={`Delete ${issue.title}`}
                            style={{ color: 'var(--accent-red)' }}
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── Delete confirmation modal ── */}
      {toDelete && (
        <ConfirmModal
          message={`Delete "${toDelete.title}"? This cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setToDelete(null)}
          loading={deleting}
        />
      )}
    </main>
  )
}
