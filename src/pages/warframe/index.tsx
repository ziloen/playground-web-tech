// syndicateMissions: The Holdfasts, Cavia
// globalUpgrades
// duviriCycle
// alerts
// Riven trading
// Ticker
import { useQuery } from '@tanstack/react-query'
import { asNonNullable } from '@wai-ri/core'
import { Temporal } from 'temporal-polyfill'
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
    <div
      className="grid gap-1 w-fit max-w-[500px]"
      style={{
        gridTemplateColumns: 'max-content 1fr',
      }}
    >
      {data.news.toReversed().map((news, index) => {
        console.log(Temporal)
        const date = Temporal.Instant.from(news.date).toZonedDateTimeISO('UTC')
        const now = Temporal.Now.zonedDateTimeISO('UTC')

        const diff = date.until(now, {
          largestUnit: 'years',
          smallestUnit: 'days',
        })

        const rtf = new Intl.RelativeTimeFormat('en', {
          style: 'narrow',
          numeric: 'always',
        })

        return (
          <a
            href={news.link}
            key={news.id}
            target="_blank"
            rel="noreferrer"
            className="grid relative border border-solid bg-dark-gray-900 border-dark-gray-300 rounded-sm p-2 gap-2 no-underline text-light-gray-200 visited:text-light-gray-900 grid-cols-subgrid col-span-full"
          >
            {index === 0 && (
              <img
                className="aspect-video col-span-full w-full"
                style={{
                  contain: 'size',
                  containIntrinsicSize: '0 auto',
                }}
                src={news.imageLink}
                alt="News image"
                decoding="async"
                fetchPriority="low"
                loading="lazy"
                crossOrigin="anonymous"
              />
            )}

            <div className="grid gap-3 grid-cols-subgrid col-span-2">
              <span>
                {diff.years > 0
                  ? rtf.format(diff.years, 'year')
                  : diff.months > 0
                  ? rtf.format(diff.months, 'month')
                  : rtf.format(diff.days, 'day')}
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
