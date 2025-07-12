import { isNotNil } from 'es-toolkit'
import { useContext } from 'react'
import type { RouteObject } from 'react-router'
import { Link, UNSAFE_FrameworkContext } from 'react-router'

export default function Index() {
  const framework = useContext(UNSAFE_FrameworkContext)

  const flattenedRoutes = useMemo(() => {
    if (!framework) return []

    console.log('routes:', framework.manifest.routes)

    const routes = Object.values(framework.manifest.routes).filter(isNotNil)

    return flatRoutes(routes)
      .filter((route) => !['*', '/', ':'].includes(route[0]))
      // eslint-disable-next-line @typescript-eslint/unbound-method
      .toSorted((new Intl.Collator('en')).compare)
  }, [framework])

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
