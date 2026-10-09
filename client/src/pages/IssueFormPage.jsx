import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getIssueById } from '../services/issueService'
import IssueForm from '../components/IssueForm'

// NewIssuePage and EditIssuePage share this same file.
// NewIssuePage renders a blank form.
// EditIssuePage loads the existing issue first, then renders the pre-filled form.

export function NewIssuePage() {
  return (
    <main className="page-container">
      <Link to="/" className="back-link">← Back to Dashboard</Link>
      <IssueForm />
    </main>
  )
}

export function EditIssuePage() {
  const { id } = useParams()
  const [issue,   setIssue]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getIssueById(id)
        setIssue(data)
      } catch (err) {
        if (err.response?.status === 404) {
          setError('Issue not found.')
        } else {
          setError('Could not load issue.')
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

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
      <Link to={`/issues/${id}`} className="back-link">← Back to Issue</Link>
      <IssueForm existing={issue} />
    </main>
  )
}
