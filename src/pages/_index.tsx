import type { RouteObject } from 'react-router'
import { Link } from 'react-router'
import { routes } from '../App'

export default function Index() {
  const flattenedRoutes = useMemo(() => {
    console.log(routes)

    return flatRoutes(routes)
      .filter((route) => !['*', '/', ':'].includes(route))
      // eslint-disable-next-line @typescript-eslint/unbound-method
      .toSorted((new Intl.Collator('en')).compare)
  }, [])

  return (
    <div>
      <div className="flex flex-col items-start">
        {flattenedRoutes.map((route) => <Link to={route} key={route}>{route}</Link>)}
      </div>
    </div>
  )
}

/*#__NO_SIDE_EFFECTS__*/
function flatRoutes(
  routes: RouteObject[],
  parentPath: string = '',
): string[] {
  return routes
    .flatMap((route) => {
      if (typeof route.path !== 'string') return []
      const path = parentPath ? `${parentPath}/${route.path}` : route.path

      return route.children
        ? flatRoutes(route.children, path)
        : path
    })
}
