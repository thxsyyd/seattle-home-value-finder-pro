import { createBrowserRouter } from 'react-router'
import { Explore } from './routes/Explore'
import { ListPanel } from './routes/ListPanel'
import { Placeholder } from './routes/Placeholder'

// Everything except the map page is loaded on demand, so the first screen ships only what it needs.
export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Explore />,
      children: [
        { index: true, element: <ListPanel /> },
        { path: 'zip/:zip', lazy: async () => ({ Component: (await import('./routes/ZipDetail')).ZipDetail }) },
        { path: 'home/:id', lazy: async () => ({ Component: (await import('./routes/HomeDetail')).HomeDetail }) },
      ],
    },
    { path: '/compare/:a/:b', lazy: async () => ({ Component: (await import('./routes/Compare')).Compare }) },
    { path: '/afford', lazy: async () => ({ Component: (await import('./routes/Afford')).Afford }) },
    { path: '/about', lazy: async () => ({ Component: (await import('./routes/About')).About }) },
    { path: '*', element: <Placeholder titleKey="notFound" /> },
  ],
  { basename: import.meta.env.BASE_URL },
)
