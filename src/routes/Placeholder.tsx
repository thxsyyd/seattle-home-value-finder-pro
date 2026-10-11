import { Link } from 'react-router'

export function Placeholder({ title }: { title: string }) {
  return (
    <div style={{ padding: 'var(--s-4)' }}>
      <h1 style={{ fontSize: '1.25rem', margin: 0 }}>{title}</h1>
      <p>
        <Link to="/">Back to map</Link>
      </p>
    </div>
  )
}
