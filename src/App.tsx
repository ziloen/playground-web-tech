import { ConfigProvider, theme } from 'antd'
import { Suspense } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
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
    <HashRouter>
      <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
        <Suspense>
          <Routes>
            {routeElements}
          </Routes>
        </Suspense>
      </ConfigProvider>
    </HashRouter>
  )
}

