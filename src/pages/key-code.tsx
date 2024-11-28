import { useEventListener } from '~/hooks'

const properties: {
  key: keyof KeyboardEvent
  deprecated?: boolean
}[] = [
  { key: 'key' },
  { key: 'code' },
  { key: 'location' },
  { key: 'shiftKey' },
  { key: 'ctrlKey' },
  { key: 'altKey' },
  { key: 'metaKey' },
  { key: 'keyCode', deprecated: true },
  { key: 'charCode', deprecated: true },
  { key: 'which', deprecated: true },
]

export default function KeyCode() {
  const ref = useRef<HTMLDivElement>(null)
  const [event, setEvent] = useState<KeyboardEvent | null>(null)
  const [preventDefault, setPreventDefault] = useState(false)
  const [stopPropagation, setStopPropagation] = useState(false)
  const [hideDeprecated, setHideDeprecated] = useState(true)

  useEventListener('keydown', (e) => {
    if (preventDefault) e.preventDefault()
    if (stopPropagation) e.stopPropagation()

    setEvent(e)
  }, { target: ref })

  return (
    <div className="p-2 flex flex-col gap-2">
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
        className="rounded-[12px] size-20 bg-dark-gray-300 focus:[box-shadow:--focus-shadow]"
      >
        Focus me and press any key
      </div>

      {event && (
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: 'repeat(auto-fit, 200px)' }}
        >
          {properties.map((item) => {
            if (hideDeprecated && item.deprecated) return null

            return (
              <Item
                key={item.key}
                title={item.key}
                value={event[item.key] as string | number | boolean}
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
      className={clsx('w-[200px] bg-dark-gray-500 h-[100px]', deprecated && 'text-light-gray-600')}
    >
      <div
        className={clsx(
          'text-center bg-white/20 py-2 font-semibold text-lg',
          deprecated && 'line-through decoration-[2px]',
        )}
      >
        {title}
      </div>

      <div className="text-center whitespace-pre py-2">
        {String(value)}
      </div>

      <div>
        {description}
      </div>
    </div>
  )
}
