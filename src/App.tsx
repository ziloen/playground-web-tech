import { Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import routes from '~react-pages'


const routeElements = routes.map(route => (
  <Route
    key={route.path}
    path={route.path}
    element={route.element}
  />
))

export default function App() {

  return (
    <Suspense>
      <Routes>
        {routeElements}
      </Routes>
    </Suspense>
  )
}

