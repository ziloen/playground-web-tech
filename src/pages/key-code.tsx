import type { KeyboardEventKey } from 'ts-lib-enhance'
import { useEventListener } from '~/hooks'

export default function KeyCode() {
  const ref = useRef<HTMLDivElement>(null)
  const [event, setEvent] = useState<KeyboardEvent | null>(null)

  useEventListener('keydown', e => {
    setEvent(e)
  }, {
    target: ref,
  })

  return (
    <div className='p-2 flex flex-col gap-2'>
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
          <Item title="key" value={event.key} />
          <Item title="keyCode" value={event.keyCode} deprecated />
          <Item title="code" value={event.code} />
          <Item title="charCode" value={event.charCode} deprecated />
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
  value?: string | number
  deprecated?: boolean
}) {
  return (
    <div
      className={clsx('w-[200px] bg-dark-gray-500 h-[250px]', deprecated && 'text-light-gray-600')}
    >
      <div
        className={clsx(
          'text-center bg-white/20 py-2 font-semibold text-lg',
          deprecated && 'line-through decoration-[2px]'
        )}
      >
        {title}
      </div>

      <div className="text-center whitespace-pre">
        {value}
      </div>

      <div>
        {description}
      </div>
    </div>
  )
}
