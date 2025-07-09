import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, RouterProvider } from 'react-router'
import routes from '~react-pages'

const queryClient = new QueryClient()

const router = createBrowserRouter(routes, {
  basename: import.meta.env.BASE_URL,
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
