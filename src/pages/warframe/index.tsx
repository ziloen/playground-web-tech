// syndicateMissions: The Holdfasts, Cavia
// globalUpgrades
// duviriCycle
// alerts
// Riven trading
// Ticker
import { useQuery } from '@tanstack/react-query'
import { asNonNullable } from '@wai-ri/core'
import { getWorldStateApi } from '~/api/warframe'

export default function Warframe() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['warframe-world-state'],
    queryFn: getWorldStateApi,
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (isError) {
    return <div>Error</div>
  }

  asNonNullable(data)

  console.log(data)

  return (
    <div>
      <div>
        {data.news.map((news) => {
          return (
            <div key={news.id}>
              <div>
                {news.message}
              </div>

              <img
                className="w-[36px] aspect-video"
                src={news.imageLink}
                alt="News image"
                decoding="async"
                fetchPriority="low"
                loading="lazy"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
