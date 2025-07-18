import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { isNotNil } from 'es-toolkit'
import type { LoaderFunction, RouteObject } from 'react-router'
import { createBrowserRouter, RouterProvider } from 'react-router'

const queryClient = new QueryClient()

const modules = import.meta.glob('./pages/**/*.tsx', { eager: false })

export const routes = Object.entries(modules).map<RouteObject | null>(([path, request]) => {
  const filePath = path.slice(8, -4)

  if (!filePath) {
    return null
  }

  const index = filePath.endsWith('_index')

  const normalizedPath = filePath
    .replaceAll('_index', '')
    .replaceAll(/\$$/g, '*')
    .replaceAll('$', ':')
    .replaceAll('.', '/')

  return {
    index: index,
    path: normalizedPath,
    lazy: async () => {
      const value = (await request()) as {
        default: React.ComponentType
        loader?: LoaderFunction
        HydrateFallback?: React.ComponentType
        ErrorBoundary?: React.ComponentType
      }
      return {
        Component: value.default,
        loader: value.loader,
        HydrateFallback: value.HydrateFallback ?? null,
        ErrorBoundary: value.ErrorBoundary ?? null,
      }
    },
  }
}).filter(isNotNil)

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
