import { isString } from 'lodash-es'
import { Link } from 'react-router-dom'
import routes from '~react-pages'

export default function Index() {
  const flattenedRoutes = useMemo(() => {
    return routes
      .map(route => route.path)
      .filter(isString)
      .filter(route => !['*', '/', ':'].includes(route[0]))
      // eslint-disable-next-line @typescript-eslint/unbound-method
      .toSorted((new Intl.Collator()).compare)
  }, [])

  return (
    <div>
      <div className="flex flex-col items-start">
        {flattenedRoutes.map(route => <Link to={route} key={route}>{route}</Link>)}
      </div>
    </div>
  )
}
