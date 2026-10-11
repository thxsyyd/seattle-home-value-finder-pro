import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import './styles/tokens.css'
import './styles/global.css'
import './styles/layout.css'
import { router } from './router'

if (import.meta.env.DEV && location.search.includes('a11y=1')) void import('./dev/axe')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
