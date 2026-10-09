// Badge renders a small coloured pill for severity, status, or type.
// The CSS class is built from the value itself, e.g. "badge badge-critical".
// "in-progress" → CSS doesn't allow hyphens in identifiers the same way,
// so we replace the hyphen to get "badge-in-progress" which CSS handles fine.
export default function Badge({ value, type = 'severity' }) {
  if (!value) return null

  // Normalise the value to lower-case for CSS class lookup
  const cls = value.toLowerCase().replace(/\s+/g, '-')

  return (
    <span className={`badge badge-${cls}`} aria-label={`${type}: ${value}`}>
      {value}
    </span>
  )
}
