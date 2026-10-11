import { Link, Outlet } from 'react-router'

// Layout route: the map will live here so it stays mounted while the side panel changes.
export function Explore() {
  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100%' }}>
      <a className="skip-link" href="#panel">
        Skip to results
      </a>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--s-3) var(--s-4)',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <Link to="/" style={{ fontWeight: 700, color: 'var(--text)', textDecoration: 'none' }}>
          Seattle Home Value Finder
        </Link>
        <Link to="/about">About</Link>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) 1fr', minHeight: 0 }}>
        <main id="panel" style={{ overflow: 'auto', padding: 'var(--s-4)', background: 'var(--surface)' }}>
          <Outlet />
        </main>
        <div aria-hidden="true" style={{ background: 'var(--bg)' }} />
      </div>
    </div>
  )
}
