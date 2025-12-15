import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ComponentType } from 'react'
import type { LoaderFunction, RouteObject } from 'react-router'
import { createBrowserRouter, RouterProvider } from 'react-router'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

function HydrateFallback() {
  return null
}

export const routes = Object.entries(
  import.meta.glob<{
    default: ComponentType
    loader?: LoaderFunction
    handle?: unknown
    HydrateFallback?: ComponentType
    ErrorBoundary?: ComponentType
  }>('./**/*.tsx', { base: './pages' }),
).map<RouteObject>(([path, request]) => {
  // `./concerts.$id.tsx` -> `concerts.$id`
  const filePath = path.slice(2, -4)

  const index = filePath.endsWith('_index')

  // https://reactrouter.com/how-to/file-route-conventions#file-route-conventions
  const normalizedPath = filePath
    // Index Route: `_index.tsx` -> `/`
    .replaceAll('_index', '')
    // Catch-all Route: `$.tsx` -> `*`
    .replaceAll(/\$$/g, '*')
    // Optional Segments: `($lang).$id.tsx` -> `:lang?/:id`, `item.(edit).tsx` -> `item/edit?`
    .replaceAll(/\(([^).]+)\)/g, '$1?')
    // Dynamic Segments: `item.$id.tsx` -> `item/:id`
    .replaceAll('$', ':')
    // Nested Route: `concerts.trending.tsx` -> `concerts/trending`
    .replaceAll('.', '/')

  return {
    index: index,
    path: normalizedPath,
    HydrateFallback,
    lazy: async () => {
      const route = await request()

      return {
        loader: route.loader,
        handle: route.handle,
        Component: route.default,
        // FIXME: HydrateFallback is not working in lazy routes
        HydrateFallback: route.HydrateFallback ?? null,
        ErrorBoundary: route.ErrorBoundary ?? null,
      }
    },
  }
})

export const router = createBrowserRouter(routes, {
  basename: import.meta.env.BASE_URL,
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
