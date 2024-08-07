import { App as AntApp, ConfigProvider, theme } from 'antd'
import { Suspense } from 'react'
import { BrowserRouter } from 'react-router-dom'
import routes from '~react-pages'

function Routes() {
  return useRoutes(routes)
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            motion: false,
          },
          cssVar: true,
        }}
      >
        <AntApp component={false}>
          <Suspense>
            <Routes />
          </Suspense>
        </AntApp>
      </ConfigProvider>
    </BrowserRouter>
  )
}
