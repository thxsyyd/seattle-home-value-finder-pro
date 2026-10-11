import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router'

/** Frame for the stand-alone pages (calculator, compare, about). */
export function PageShell({ title, children }: { title: string; children: ReactNode }) {
  const { search } = useLocation()
  return (
    <div className="page">
      <header className="topbar">
        <Link to={{ pathname: '/', search }} className="brand">Seattle Home Value Finder</Link>
        <Link to={{ pathname: '/', search }}>← Back to the map</Link>
      </header>
      <main className="page-body">
        <h1>{title}</h1>
        {children}
      </main>
    </div>
  )
}
