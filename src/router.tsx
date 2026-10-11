import { createBrowserRouter } from 'react-router'
import { Explore } from './routes/Explore'
import { ListPanel } from './routes/ListPanel'
import { Placeholder } from './routes/Placeholder'

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Explore />,
      children: [
        { index: true, element: <ListPanel /> },
        { path: 'zip/:zip', element: <Placeholder title="Zip code detail" /> },
        { path: 'home/:id', element: <Placeholder title="Home detail" /> },
      ],
    },
    { path: '/compare/:a/:b', element: <Placeholder title="Compare" /> },
    { path: '/afford', element: <Placeholder title="Affordability calculator" /> },
    { path: '/about', element: <Placeholder title="About this project" /> },
    { path: '*', element: <Placeholder title="Page not found" /> },
  ],
  { basename: import.meta.env.BASE_URL },
)
