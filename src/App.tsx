import { ConfigProvider, theme } from 'antd'
import { Suspense } from 'react'
import { HashRouter } from 'react-router-dom'
import routes from '~react-pages'

function Routes() {
  return useRoutes(routes)
}

export default function App() {
  return (
    <HashRouter>
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            motion: false,
          },
        }}
      >
        <Suspense>
          <Routes />
        </Suspense>
      </ConfigProvider>
    </HashRouter>
  )
}
