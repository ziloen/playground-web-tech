import { ConfigProvider, theme } from 'antd'
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
        }}
      >
        <Suspense>
          <Routes />
        </Suspense>
      </ConfigProvider>
    </BrowserRouter>
  )
}
