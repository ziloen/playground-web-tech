import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { isNotNil } from 'es-toolkit'
import type { LoaderFunction, RouteObject } from 'react-router'
import { createBrowserRouter, RouterProvider } from 'react-router'

const queryClient = new QueryClient()

const modules = import.meta.glob('./pages/**/*.tsx', { eager: false })

export const routes = Object.entries(modules).map<RouteObject | null>(([path, request]) => {
  const fileName = path.match(/^\.\/pages\/(.*)\.tsx$/)?.[1]

  if (!fileName) {
    return null
  }

  const index = fileName.endsWith('_index')

  const normalizedFileName = fileName.replaceAll('_index', '').replaceAll('$', ':').replaceAll(
    '.',
    '/',
  )

  return {
    index: index,
    path: index
      ? '/' + normalizedFileName
      : fileName === '$'
      ? '*'
      : '/' + normalizedFileName,
    lazy: async () => {
      const value = (await request()) as {
        default: React.ComponentType
        HydrateFallback?: React.ComponentType
        loader?: LoaderFunction
      }
      return {
        Component: value.default,
        HydrateFallback: value.HydrateFallback ?? null,
        loader: value.loader,
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
