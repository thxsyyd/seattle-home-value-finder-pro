import { createBrowserRouter } from 'react-router'
import { About } from './routes/About'
import { Afford } from './routes/Afford'
import { Compare } from './routes/Compare'
import { Explore } from './routes/Explore'
import { HomeDetail } from './routes/HomeDetail'
import { ZipDetail } from './routes/ZipDetail'
import { ListPanel } from './routes/ListPanel'
import { Placeholder } from './routes/Placeholder'

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Explore />,
      children: [
        { index: true, element: <ListPanel /> },
        { path: 'zip/:zip', element: <ZipDetail /> },
        { path: 'home/:id', element: <HomeDetail /> },
      ],
    },
    { path: '/compare/:a/:b', element: <Compare /> },
    { path: '/afford', element: <Afford /> },
    { path: '/about', element: <About /> },
    { path: '*', element: <Placeholder title="Page not found" /> },
  ],
  { basename: import.meta.env.BASE_URL },
)
