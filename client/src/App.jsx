import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import IssueDetail from './pages/IssueDetail'
import { NewIssuePage, EditIssuePage } from './pages/IssueFormPage'

// App is the root component. It renders the Navbar on every page,
// and uses <Routes> to render the right page based on the URL.
//
// Route breakdown:
//   /                    → Dashboard (list + stats)
//   /issues/new          → New issue form
//   /issues/:id          → Detail view for one issue
//   /issues/:id/edit     → Edit form pre-filled with that issue
//   *                    → Redirect unknown URLs back to the dashboard
export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <Routes>
        <Route path="/"                  element={<Dashboard />} />
        <Route path="/issues/new"        element={<NewIssuePage />} />
        <Route path="/issues/:id"        element={<IssueDetail />} />
        <Route path="/issues/:id/edit"   element={<EditIssuePage />} />
        <Route path="*"                  element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
