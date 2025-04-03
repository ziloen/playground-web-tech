// syndicateMissions: The Holdfasts, Cavia
// globalUpgrades
// duviriCycle
// alerts
// Riven trading
// Ticker
import { useQuery } from '@tanstack/react-query'
import { asNonNullable } from '@wai-ri/core'
import { Temporal } from 'temporal-polyfill'
import type { WorldState } from '~/api/warframe'
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
      <News data={data} />
    </div>
  )
}

function News({ data }: { data: WorldState }) {
  return (
    <div
      className="grid gap-1 w-fit max-w-[500px]"
      style={{
        gridTemplateColumns: 'max-content 1fr',
        gridAutoRows: 'max-content',
      }}
    >
      {data.news.toReversed().map((news, index) => {
        return (
          <a
            href={news.link}
            key={news.id}
            target="_blank"
            rel="noreferrer"
            className="grid relative border border-solid bg-dark-gray-900 border-dark-gray-300 rounded-sm p-2 gap-2 no-underline text-light-gray-200 visited:text-light-gray-900 grid-cols-subgrid col-span-full"
          >
            {index === 0 && (
              <div className="col-span-full flex w-full contain-inline-size">
                <img
                  className="w-full"
                  src={news.imageLink}
                  alt="News image"
                  decoding="async"
                  fetchPriority="low"
                  loading="lazy"
                  crossOrigin="anonymous"
                />
              </div>
            )}

            <div className="grid gap-3 grid-cols-subgrid col-span-2">
              <span>
                {getRelativeString(news.date)}
              </span>

              <span>
                {news.message}
              </span>
            </div>
          </a>
        )
      })}
    </div>
  )
}

function getRelativeString(date: string) {
  const dateTime = Temporal.Instant.from(date).toZonedDateTimeISO('UTC')
  const now = Temporal.Now.zonedDateTimeISO('UTC')
  const diff = dateTime.since(now, {
    largestUnit: 'years',
    smallestUnit: 'minutes',
  })

  const rtf = new Intl.RelativeTimeFormat('en', {
    style: 'narrow',
    numeric: 'always',
  })

  const units = ['years', 'months', 'days', 'hours', 'minutes'] as const

  for (const unit of units) {
    if (diff[unit] !== 0) {
      return rtf.format(diff[unit], unit)
    }
  }

  return 'now'
}
