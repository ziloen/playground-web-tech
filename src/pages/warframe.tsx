import { useQuery } from '@tanstack/react-query'
import { asNonNullable } from '@wai-ri/core'
import type { WorldState } from '~/api/warframe'
import { getWorldStateApi } from '~/api/warframe'
import { formatRelativeTime } from '~/utils/intl'

// syndicateMissions: The Holdfasts, Cavia
// globalUpgrades
// duviriCycle
// alerts
// Riven trading
// Ticker

// TODO:
// 深度科研 deepArchimedea
// 时光科研 temporalArchimedea
// 猎杀执刑官 archonHunt
// 1999日历 calendar
// 钢铁之路商品 steelPath.currentReward steelPath.rotation
// 无尽回廊轮换 EndlessXpChoices
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
      className="grid w-fit max-w-[500px] gap-1 border border-solid border-white/60 px-2 py-2 backdrop-blur-sm"
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
            className="relative col-span-full grid grid-cols-subgrid gap-0.5 py-0.5 text-light-gray-200 no-underline visited:text-light-gray-900"
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
                />
              </div>
            )}

            <div className="col-span-2 grid grid-cols-subgrid gap-1">
              <span>
                {'[' +
                  formatRelativeTime(news.date, {
                    style: 'narrow',
                    numeric: 'always',
                    language: 'en',
                  }) +
                  ']'}
              </span>

              <span>{news.message}</span>
            </div>
          </a>
        )
      })}
    </div>
  )
}
