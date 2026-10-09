import { NavLink } from 'react-router-dom'

// NavLink is like a regular anchor tag but it automatically adds
// an "active" class when the current page matches its href.
// We use that class in CSS to highlight the current page link.
export default function Navbar() {
  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar-brand" aria-label="DevIssue home">
        {/* A simple shield icon drawn with Unicode */}
        🛡 Dev<span>Issue</span>
      </NavLink>

      <div className="nav-links" role="navigation" aria-label="Main navigation">
        <NavLink
          to="/"
          end                          // "end" means only match exactly "/"
          className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/issues/new"
          className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
        >
          + New Issue
        </NavLink>
      </div>
    </nav>
  )
}
