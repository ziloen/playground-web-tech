import { Link } from 'react-router-dom'
import routes from '~react-pages'

export default function Index() {
  const flattenedRoutes = useMemo(() => {
    return routes
      .map(route => route.path!)
      .filter(route => !['*', '/', ':'].includes(route[0]))
  }, [])

  return (
    <div>
      <div className='flex flex-col'>
        {flattenedRoutes.map(route => (
          <Link to={route} key={route}>{route}</Link>
        ))}
      </div>
    </div>
  )
}
