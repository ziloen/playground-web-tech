import type { RouteConfig } from '@react-router/dev/routes'
import { flatRoutes } from '@react-router/fs-routes'

export default flatRoutes({
  rootDirectory: 'pages',
  ignoredRouteFiles: import.meta.env.PROD ? ['**/dev.*.tsx'] : [],
}) satisfies RouteConfig
