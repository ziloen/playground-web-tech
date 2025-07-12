import '@ant-design/v5-patch-for-react-19'

import './styles/main.css'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router'

const queryClient = new QueryClient()

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <html>
        <head>
          <meta charSet="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />

          <title>Playground - Web Tech</title>

          {/* Disable Chromium auto translate */}
          <meta name="google" content="notranslate" />

          {/* Dark color scheme */}
          <meta name="color-scheme" content="dark light" />

          <Meta />
          <Links />

          {/* https://github.com/rafgraph/spa-github-pages/blob/gh-pages/index.html */}
          <script
            type="text/javascript"
            dangerouslySetInnerHTML={{
              __html: `(((l) => {
      if (l.search[1] === '/') {
        var decoded = l.search.slice(1).split('&').map((s) => s.replace(/~and~/g, '&')).join('?')
        window.history.replaceState(null, null,
          l.pathname.slice(0, -1) + decoded + l.hash
        )
      }
    })(window.location))`,
            }}
          />
        </head>

        <body>
          {children}
          <ScrollRestoration />
          <Scripts />
        </body>
      </html>
    </QueryClientProvider>
  )
}

export default function App() {
  return <Outlet />
}

export function HydrateFallback() {
  return <p>Loading...</p>
}
