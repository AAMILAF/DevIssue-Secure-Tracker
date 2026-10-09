import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createIssue, updateIssue } from '../services/issueService'

// IssueForm is used for both "New Issue" and "Edit Issue".
// When `existing` is passed in, it pre-fills the form and calls updateIssue.
// When `existing` is null/undefined, the form is blank and calls createIssue.
export default function IssueForm({ existing }) {
  const navigate = useNavigate()
  const isEditing = Boolean(existing)

  // Form state — initialise from the existing issue when editing
  const [form, setForm] = useState({
    title:       existing?.title       ?? '',
    description: existing?.description ?? '',
    type:        existing?.type        ?? 'bug',
    severity:    existing?.severity    ?? 'medium',
    status:      existing?.status      ?? 'open',
  })

  // Field-level validation errors shown under each input
  const [fieldErrors, setFieldErrors] = useState({})
  // API-level error shown at the top of the form
  const [apiError, setApiError]       = useState('')
  // Prevent double-submits while the request is in-flight
  const [submitting, setSubmitting]   = useState(false)

  // Update a single field in state whenever an input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    // Clear the error for this field as soon as the user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  // Client-side validation — runs before sending anything to the server.
  // Returns an error object; empty object means everything is valid.
  const validate = () => {
    const errs = {}
    if (!form.title.trim())               errs.title = 'Title is required'
    if (form.title.trim().length > 150)   errs.title = 'Title cannot exceed 150 characters'
    if (form.description.length > 2000)   errs.description = 'Description cannot exceed 2000 characters'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')

    // Run local validation first — no network call if it fails
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      return
    }

    setSubmitting(true)
    try {
      if (isEditing) {
        await updateIssue(existing._id, form)
        // After a successful edit, go back to that issue's detail page
        navigate(`/issues/${existing._id}`)
      } else {
        const created = await createIssue(form)
        // After creating, go straight to the new issue's detail page
        navigate(`/issues/${created._id}`)
      }
    } catch (err) {
      // The API returns { errors: [...] } for validation failures
      // or { error: "..." } for other errors
      const data = err.response?.data
      if (data?.errors) {
        setApiError(data.errors.map((e) => e.msg || e).join(' · '))
      } else {
        setApiError(data?.error || 'Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="form-card">
      <h2 className="form-title">
        {isEditing ? 'Edit Issue' : 'Report New Issue'}
      </h2>

      {/* API-level error banner */}
      {apiError && <div className="alert alert-error" role="alert">{apiError}</div>}

      <form onSubmit={handleSubmit} noValidate>
        {/* Title */}
        <div className="form-group">
          <label className="form-label" htmlFor="title">
            Title <span aria-hidden="true" style={{ color: 'var(--accent-red)' }}>*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            className={`form-control${fieldErrors.title ? ' error' : ''}`}
            value={form.title}
            onChange={handleChange}
            placeholder="Short summary of the issue"
            maxLength={150}
            aria-describedby={fieldErrors.title ? 'title-err' : undefined}
            aria-required="true"
          />
          {fieldErrors.title && (
            <p id="title-err" className="form-error" role="alert">{fieldErrors.title}</p>
          )}
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-label" htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            className={`form-control${fieldErrors.description ? ' error' : ''}`}
            value={form.description}
            onChange={handleChange}
            placeholder="Steps to reproduce, expected vs actual behaviour…"
            maxLength={2000}
            aria-describedby={fieldErrors.description ? 'desc-err' : undefined}
          />
          {fieldErrors.description && (
            <p id="desc-err" className="form-error" role="alert">{fieldErrors.description}</p>
          )}
        </div>

        {/* Type / Severity / Status — all in one row */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="type">Type</label>
            <select
              id="type"
              name="type"
              className="form-control"
              value={form.type}
              onChange={handleChange}
            >
              <option value="bug">Bug</option>
              <option value="vulnerability">Vulnerability</option>
              <option value="enhancement">Enhancement</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="severity">Severity</label>
            <select
              id="severity"
              name="severity"
              className="form-control"
              value={form.severity}
              onChange={handleChange}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              className="form-control"
              value={form.status}
              onChange={handleChange}
            >
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting
              ? (isEditing ? 'Saving…' : 'Creating…')
              : (isEditing ? 'Save Changes' : 'Create Issue')}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
