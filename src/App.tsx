import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Suspense } from 'react'
import { BrowserRouter } from 'react-router'
import routes from '~react-pages'

function Routes() {
  return useRoutes(routes)
}

// Create a client
const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Suspense>
          <Routes />
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
