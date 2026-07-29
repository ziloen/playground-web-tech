import type { RefCallback } from 'react'
import { useGetState } from '~/hooks'

const properties = [
  { key: 'key' as const },
  { key: 'code' as const },
  { key: 'location' as const },
  { key: 'shiftKey' as const },
  { key: 'ctrlKey' as const },
  { key: 'altKey' as const },
  { key: 'metaKey' as const },
  { key: 'keyCode' as const, deprecated: true },
  { key: 'charCode' as const, deprecated: true },
  { key: 'which' as const, deprecated: true },
]

export default function KeyCode() {
  const [event, setEvent] = useState<KeyboardEvent | null>(null)
  const [preventDefault, setPreventDefault, getPreventDefault] = useGetState(false)
  const [stopPropagation, setStopPropagation, getStopPropagation] = useGetState(false)
  const [hideDeprecated, setHideDeprecated] = useState(true)

  const ref = useRef<RefCallback<HTMLDivElement>>((el) => {
    if (!el) return

    const ac = new AbortController()

    el.addEventListener(
      'keydown',
      (e) => {
        console.log(e)

        if (getPreventDefault()) e.preventDefault()
        if (getStopPropagation()) e.stopPropagation()

        setEvent(e)
      },
      { signal: ac.signal },
    )

    return () => ac.abort()
  }).current

  return (
    <div className="flex flex-col gap-2 p-2">
      <div>
        <label>
          Prevent default
          <input
            type="checkbox"
            checked={preventDefault}
            onChange={(e) => setPreventDefault(e.currentTarget.checked)}
          />
        </label>

        <label>
          Stop propagation
          <input
            type="checkbox"
            checked={stopPropagation}
            onChange={(e) => setStopPropagation(e.currentTarget.checked)}
          />
        </label>

        <label>
          Hide deprecated properties
          <input
            type="checkbox"
            checked={hideDeprecated}
            onChange={(e) => setHideDeprecated(e.currentTarget.checked)}
          />
        </label>
      </div>

      <div
        ref={ref}
        tabIndex={0}
        style={{
          '--newtab-primary-action-background': '#00ddff',
          '--newtab-primary-action-background-dimmed':
            'color-mix(in srgb, var(--newtab-primary-action-background) 25%, transparent)',
          '--focus-shadow':
            '0 0 0 3px var(--newtab-primary-action-background-dimmed), 0 0 0 1px var(--newtab-primary-action-background)',
        }}
        className="size-20 rounded-[12px] bg-dark-gray-300 focus:[box-shadow:--focus-shadow]"
      >
        Focus me and press any key
      </div>

      {event && (
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, 200px)' }}>
          {properties.map((item) => {
            if (hideDeprecated && item.deprecated) return null

            return (
              <Item
                key={item.key}
                title={item.key}
                value={event[item.key]}
                deprecated={item.deprecated}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function Item({
  title,
  description,
  value,
  deprecated,
}: {
  title: string
  description?: string
  value?: string | number | boolean
  deprecated?: boolean
}) {
  return (
    <div
      className={clsx('h-[100px] w-[200px] bg-dark-gray-500', deprecated && 'text-light-gray-600')}
    >
      <div
        className={clsx(
          'bg-white/20 py-2 text-center text-lg font-semibold',
          deprecated && 'line-through decoration-[2px]',
        )}
      >
        {title}
      </div>

      <div className="py-2 text-center whitespace-pre">{String(value)}</div>

      <div>{description}</div>
    </div>
  )
}
