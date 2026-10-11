import { createBrowserRouter } from 'react-router'
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
    { path: '/compare/:a/:b', element: <Placeholder title="Compare" /> },
    { path: '/afford', element: <Placeholder title="Affordability calculator" /> },
    { path: '/about', element: <Placeholder title="About this project" /> },
    { path: '*', element: <Placeholder title="Page not found" /> },
  ],
  { basename: import.meta.env.BASE_URL },
)
