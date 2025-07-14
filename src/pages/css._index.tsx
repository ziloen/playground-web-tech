const testString =
  `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce vel rhoncus nisl. Nunc accumsan ornare augue, et efficitur orci. Ut. `

export default function CSSPage() {
  return (
    <div className="grid gap-4 max-h-full overflow-y-auto scrollbar-gutter-stable grid-cols-1">
      <div className="w-[800px] max-w-full text-sm resizable-x">
        <EllipsisMiddle text={testString} />
      </div>
      <div className="w-[750px] max-w-full text-sm resizable-x">
        <ShowMore text={testString} />
      </div>

      <div>
        <Subgrid />
      </div>

      <div>
        <HolyGrail />
      </div>

      <AspectRatio />

      <SameWidthFlexWrap />

      <SameWidthFlexWrap2 />

      <AutoShrinkButton />

      <AutoShrinkButton2 />

      <AutoShrinkButton3 />

      <FlexAlignFirstLine />

      <GridRepeat />

      <DynamicMultiLineClamp />

      <div className="h-100"></div>
    </div>
  )
}

/**
 * Text ellipsis at the center of the element
 *
 * ref: https://codepen.io/xboxyan/pen/VwpPNbm
 */
function EllipsisMiddle({ text }: {
  text: string
}) {
  return (
    <div className="relative h-[2em] overflow-clip bg-dark-gray-700 leading-[2em]">
      {/* When not overflow */}
      <div className="max-h-[4em] w-fit">{text}</div>

      {/* When overflow, this will cover above text */}
      <div className="relative -top-[4em] flex bg-inherit" title={text}>
        {/* Left part */}
        <div className="w-1/2 overflow-hidden text-ellipsis whitespace-nowrap">{text}</div>

        {/* Right part */}
        <div
          className="w-1/2 overflow-hidden whitespace-nowrap"
          dir="rtl"
          style={{ textOverflow: `""` }}
        >
          {text}
        </div>
      </div>
    </div>
  )
}

function Subgrid() {
  return (
    <div
      className="grid w-max min-w-[400px] gap-x-2 gap-y-2"
      style={{
        // main-start[1fr] icon[20px] text[max-content] main-end[1fr]
        gridTemplateColumns:
          '[main-start] 1fr [icon-start] 20px [icon-end text-start] max-content [text-end] 1fr [main-end]',
      }}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="col-[main] grid grid-cols-subgrid border border-solid border-green-600"
        >
          <div className="col-[icon] size-[20px] rounded-full bg-blue-500"></div>

          <div className="col-[text]">{'A'.repeat(i + 1)}</div>
        </div>
      ))}
    </div>
  )
}

function HolyGrail() {
  return (
    <div
      className="grid max-w-[600px] bg-dark-gray-600"
      style={{ gridTemplateColumns: '1fr auto 1fr' }}
    >
      <div className="bg-green-600/15 me-auto">Looooooooooooong text</div>

      <div className="mx-auto bg-violet-300/30">Center Title</div>

      <div className="flex ms-auto bg-red-700/15">Short text</div>
    </div>
  )
}

/**
 * 一行两个按钮等宽且撑满容器宽度，任意一个按钮需要折行时，变为两行
 */
function SameWidthFlexWrap() {
  return (
    <div className="flex w-[300px] flex-wrap gap-[12px] bg-dark-gray-700 resizable-x">
      <div
        // FIXME: white-space: nowrap 导致一行时无法继续进行文字换行
        className="shrink-0 grow whitespace-nowrap bg-blue-400/20 text-center"
        style={{
          flexBasis: 'calc(50% - 6px)',
          width: 'fit-content',
        }}
      >
        Lorem ipsum
      </div>

      <div
        className="shrink-0 grow whitespace-nowrap bg-green-400/20 text-center"
        style={{
          flexBasis: 'calc(50% - 6px)',
          width: 'fit-content',
        }}
      >
        dolor
      </div>
    </div>
  )
}

// 另一种实现方式：把两个按钮里的文字在另一个里也放一份并隐藏
function SameWidthFlexWrap2() {
  return (
    <div className="flex flex-wrap w-[300px] gap-[12px] bg-dark-gray-700 resizable-x">
      <div className="grid shrink-0 grow bg-blue-400/20 text-center max-w-full">
        <span className="[grid-area:1/1] text-wrap">
          Lorem ipsum
        </span>

        <span aria-hidden className="[grid-area:1/1] invisible text-wrap h-0">
          dolor
        </span>
      </div>

      <div className="grid shrink-0 grow bg-green-400/20 text-center max-w-full">
        <span className="[grid-area:1/1] text-wrap">
          dolor
        </span>

        <span aria-hidden className="[grid-area:1/1] invisible text-wrap h-0">
          Lorem ipsum
        </span>
      </div>
    </div>
  )
}

function AspectRatio() {
  return (
    <div className="flex">
      {/* Works on Firefox */}
      <div className="flex size-[100px] min-h-[40px] min-w-[40px] bg-light-gray-900 resizable">
        <div className="m-auto aspect-video max-h-full max-w-full bg-green-900 w-stretch">
          Only works on Firefox
        </div>
      </div>

      {/* Works on All */}
      <div className="flex size-[100px] min-h-[40px] min-w-[40px] bg-dark-gray-600 resizable">
        {/* viewBox or el.getBBox() */}
        <svg viewBox="0 0 300 200" className="max-w-full max-h-full m-auto">
          <image href="https://dummyimage.com/300x200/554d3e/ffffff.png&text=300x200 SVG" />
        </svg>
      </div>

      <div className="flex size-[100px] min-h-[40px] min-w-[40px] bg-light-gray-900 resizable">
        <div className="relative m-auto aspect-video max-h-full min-h-0 min-w-0 max-w-full overflow-clip bg-green-900">
          <div className="size-[99999px]">
            Hack
          </div>
        </div>
      </div>
    </div>
  )
}

function ShowMore({ text }: {
  text: string
}) {
  const [isShowMore, setIsShowMore] = useState(false)

  if (isShowMore) {
    return (
      <div className="relative overflow-hidden bg-dark-gray-700 leading-[2em]">
        <span>{text}</span>

        <span className="pointer-events-none float-end ml-2 inline-block text-transparent">
          Show less
        </span>

        <div
          className="absolute bottom-0 cursor-pointer text-purple-400 right-2"
          onClick={() => setIsShowMore(false)}
          style={{
            top: `max(1lh, calc(100% - 1lh))`,
          }}
        >
          Show less
        </div>
      </div>
    )
  }

  return (
    <div className="relative leading-[2em] h-[1lh] bg-dark-gray-700">
      {/* When not overflow */}
      <div className="max-h-[4em] w-fit overflow-visible">{text}</div>

      {/* When overflow, this will cover above text */}
      <div className="relative -top-[4em] bg-inherit flex" title={text}>
        {/* Left part */}
        <div
          className="overflow-hidden whitespace-nowrap text-ellipsis"
          style={{
            maskImage: 'linear-gradient(to left, transparent, black 10em)',
          }}
        >
          {text}
        </div>

        {/* Right part */}
        <div
          className="w-max cursor-pointer ml-2 text-purple-400 shrink-0"
          onClick={() => setIsShowMore((prev) => !prev)}
        >
          Show more
        </div>
      </div>
    </div>
  )
}

function ScrollAutoAnchor() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <div className="flex flex-col-reverse overflow-y-auto">
        <div className="mt-auto"></div>

        <div>
          <div></div>

          {Array.from({ length: count }).map((_, index) => {
            return <div key={null}>Item</div>
          })}
        </div>
      </div>
    </div>
  )
}

function AutoShrinkButton() {
  return (
    <div className="text-sm resizable-x w-[300px] max-w-full flex gap-2 bg-dark-gray-700">
      <div className="flex-1 h-[1lh]">
        <div className="bg-blue-400/20 gap-x-2 px-2 flex flex-wrap max-h-[2lh] max-w-max">
          <div className="h-[1lh]">
            🏐
          </div>

          <div className="break-all">
            Button 1
          </div>
        </div>

        <div className="relative -top-[2lh] flex bg-dark-gray-700">
          <div className="bg-blue-400/20 px-2">
            🏀
          </div>
        </div>
      </div>

      <div className="shrink-0 bg-green-400/20 px-2">Button 2</div>

      <div className="bg-red-400/20 shrink-0 px-2">Button 3</div>
    </div>
  )
}

function AutoShrinkButton2() {
  return (
    <div className="flex w-[450px] max-w-full gap-2 bg-dark-gray-700 text-sm resizable-x">
      <div className="mr-auto h-[1lh]">
        <div className="flex gap-2 overflow-hidden">
          <div className="flex max-h-[2lh] max-w-max flex-wrap gap-x-2 bg-blue-400/20 px-2">
            <div className="h-[1lh]">
              🏐
            </div>

            <div className="break-all">
              Button 1
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            <div className="shrink-0 whitespace-nowrap bg-green-400/20 px-2">Button 2</div>

            <div className="shrink-0 whitespace-nowrap bg-red-400/20 px-2">Button 3</div>
          </div>
        </div>

        <div className="relative -top-[2lh] flex gap-2 bg-dark-gray-700">
          <div className="bg-blue-400/20 px-2">
            🏀
          </div>

          <div className="shrink-0 bg-green-400/20 px-2">Button 2</div>

          <div className="shrink-0 bg-red-400/20 px-2">Button 3</div>
        </div>
      </div>

      <div className="shrink-0 bg-violet-400/20 px-2">Button 4</div>

      <div className="shrink-0 bg-orange-400/20 px-2">Button 5</div>
    </div>
  )
}

function AutoShrinkButton3() {
  return (
    <div className="text-sm w-[100px] resizable-x max-w-full flex gap-2">
      <div className="h-[1lh]">
        <div className="relative flex flex-row flex-wrap-reverse">
          <div className="h-[1lh] shrink-0">Button</div>
          <div className="w-px h-[1lh]"></div>

          <div className="absolute bottom-[1lh] shrink-0 whitespace-nowrap">
            AAAA djaiowjdoi
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * https://stackoverflow.com/questions/32118013/align-icon-vertically-to-the-center-of-the-first-line-of-text
 */
function FlexAlignFirstLine() {
  return (
    <div className="flex">
      WIP
    </div>
  )
}

function GridRepeat() {
  return (
    <div className="resizable-x @container">
      {/* item min width: 200px, at least 2 columns */}
      <div
        className={clsx(
          'grid gap-2',
          // items
          '[&>div]:bg-red-300',
          // titles
          '[&>span]:bg-blue-300 [&>span]:justify-self-start',
        )}
        style={{
          '--item-size': 'minmax(min(200px, 50% - 4px), 1fr)',
          // at least 2 items
          gridTemplateColumns: 'var(--item-size) repeat(auto-fit, var(--item-size))',
        }}
      >
        <span className="col-span-full">Title1</span>
        <div>111</div>
        <span className="col-span-full">Title2</span>
        <div>111</div>
        <div>222</div>
        <span className="col-span-full">Title3</span>
        <div>111</div>
        <div>222</div>
        <div>333</div>
        <span className="col-span-full">Title4</span>
        <div>111</div>
        <div>222</div>
        <div>333</div>
        <div>444</div>
      </div>

      {/* item max width: 200px, at least 2 columns */}
      <div
        className={clsx(
          'grid gap-2 mt-4',
          // items
          '[&>div]:bg-red-300',
          // titles
          '[&>span]:bg-blue-300 [&>span]:justify-self-start',
        )}
        style={{
          // columns = round(up, (width + gap) / (item-max-width + gap))
          '--dividend': 'calc(100cqi + 8px)',
          '--divisor': 'calc(200px + 8px)',
          '--columns': 'round(up, tan(atan2(var(--dividend), var(--divisor))), 1)',
          // Chrome 139+: round(up, calc((100cqi + 8px) / (200px + 8px)), 1)
          gridTemplateColumns: 'repeat(max(var(--columns), 2), minmax(0, 1fr))',
        }}
      >
        <span className="col-span-full">Title1</span>
        <div>111</div>
        <span className="col-span-full">Title2</span>
        <div>111</div>
        <div>222</div>
        <span className="col-span-full">Title3</span>
        <div>111</div>
        <div>222</div>
        <div>333</div>
        <span className="col-span-full">Title4</span>
        <div>111</div>
        <div>222</div>
        <div>333</div>
        <div>444</div>
      </div>
    </div>
  )
}

function DynamicMultiLineClamp() {
  return (
    <div
      // TODO: fit initial height to content instead of fixed height
      className="resizable-y w-[200px] h-[120px] bg-dark-gray-600"
      style={{ containerType: 'size' }}
    >
      <div
        className={clsx(
          'line-clamp-(--line-clamp) max-h-full',
          // debug text
          'relative before:content-[counter(v)] before:[counter-reset:v_var(--line-clamp)] before:absolute before:top-0 before:left-0 before:text-red before:bg-white before:font-extrabold before:text-lg',
        )}
        style={{
          // line-clamp = round(height / line-height)
          '--dividend': '100cqb',
          '--divisor': '1lh',
          '--line-clamp': 'round(down, tan(atan2(var(--dividend), var(--divisor))), 1)',
          // Chrome 139+: round(down, calc(100cqb / 1lh), 1)
        }}
      >
        {testString}
      </div>
    </div>
  )
}

// TODO: multi dynamic sticky elments stack with dynamic height (or fixed height)
// 可以点击按钮设置列表项是否 sticky，可以多个 sticky
// sticky 时，滚动出范围时，会自动堆叠到下一个 sticky 元素的下面
