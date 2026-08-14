import './css.css'

import styles from './scrollbar/index.module.css'

import { range } from 'es-toolkit'
import type { RefCallback } from 'react'
import CarbonChevronDown from '~icons/carbon/chevron-down'

const testString = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce vel rhoncus nisl. Nunc accumsan ornare augue, et efficitur orci. Ut.`

export default function CSSPage() {
  return (
    <div className="grid max-h-full scrollbar-gutter-stable grid-cols-1 gap-4 overflow-y-auto">
      <div className="w-[800px] max-w-full resizable-x text-sm">
        <EllipsisMiddle text={testString} />
      </div>

      <div className="w-[750px] max-w-full resizable-x text-sm">
        <ShowMore text={testString} />
      </div>

      <div className="w-[750px] max-w-full resizable-x p-2 text-sm">
        <MultiLineShowMore text={testString.slice(-120).concat('\n').repeat(3)} />
      </div>

      <Subgrid />

      <CenterItem />

      <AspectRatio />

      <SameWidthFlexWrap />

      <SameWidthFlexWrap2 />

      <AutoShrinkButton />

      <AutoShrinkButton2 />

      <AutoShrinkButton3 />

      <FlexAlignFirstLine />

      <GridRepeat />

      <DynamicMultiLineClamp />

      <ImageNewLine />

      <BleedLayout />

      <GridItemFlexGrow />

      <ScrollClipMargin />

      <ScrollDefaultCenter />

      <TextFitToWidth />

      <AnchorPositionInScroll />

      <GridMinMaxColumns />

      <GridLastItemFlexGrow />

      <StickyNav />

      <div className="h-100"></div>
    </div>
  )
}

/**
 * Text ellipsis at the center of the element
 *
 * ref: https://codepen.io/xboxyan/pen/VwpPNbm
 */
function EllipsisMiddle({ text }: { text: string }) {
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
        gridTemplateColumns:
          '[main-start] 1fr [icon-start] 20px [icon-end text-start] max-content [text-end] 1fr [main-end]',
      }}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="col-[main] grid grid-cols-subgrid border border-solid border-green-600"
        >
          <div className="col-[icon] size-[20px] bg-blue-500"></div>

          <div className="col-[text]">{'A'.repeat(i + 1)}</div>
        </div>
      ))}
    </div>
  )
}

function CenterItem() {
  return (
    <div
      className="grid w-[600px] resizable-x bg-dark-gray-600"
      style={{ gridTemplateColumns: '1fr auto 1fr' }}
    >
      <div className="me-3 justify-self-start bg-green-600/15">Looooooooooooong text</div>

      <div className="bg-violet-300/30">Center Title</div>

      <div className="justify-self-end bg-red-700/15">Short text</div>
    </div>
  )
}

/**
 * 一行两个按钮等宽且撑满容器宽度，任意一个按钮需要折行时，变为两行
 */
function SameWidthFlexWrap() {
  return (
    <div className="flex w-[300px] resizable-x flex-wrap gap-[12px] bg-dark-gray-700">
      <div
        // FIXME: white-space: nowrap 导致一行时无法继续进行文字换行
        className="shrink-0 grow bg-blue-400/20 text-center whitespace-nowrap"
        style={{
          flexBasis: 'calc(50% - 6px)',
          width: 'fit-content',
        }}
      >
        Lorem ipsum
      </div>

      <div
        className="shrink-0 grow bg-green-400/20 text-center whitespace-nowrap"
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
    <div className="flex w-[300px] resizable-x flex-wrap gap-[12px] bg-dark-gray-700">
      <div className="grid max-w-full shrink-0 grow bg-blue-400/20 text-center">
        <span className="area-[1/1]">Lorem ipsum</span>

        <span inert aria-hidden className="invisible h-0 area-[1/1]">
          dolor
        </span>
      </div>

      <div className="grid max-w-full shrink-0 grow bg-green-400/20 text-center">
        <span className="area-[1/1]">dolor</span>

        <span inert aria-hidden className="invisible h-0 area-[1/1]">
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
      <div className="flex size-[100px] min-h-[40px] min-w-[40px] resizable bg-light-gray-900">
        <div className="m-auto aspect-video max-h-full w-stretch max-w-full bg-green-900">
          Only works on Firefox
        </div>
      </div>

      {/* Works on All */}
      <div className="flex size-[100px] min-h-[40px] min-w-[40px] resizable bg-dark-gray-600">
        {/* viewBox or el.getBBox() */}
        <svg viewBox="0 0 300 200" className="m-auto max-h-full max-w-full">
          <rect x="0" y="0" width="300" height="200" fill="#554d3e" stroke="none" />
          <text
            x="50%"
            y="50%"
            dominantBaseline="middle"
            textAnchor="middle"
            fill="#fff"
            fontSize={42}
          >
            300x200 SVG
          </text>
        </svg>
      </div>

      <div className="flex size-[100px] min-h-[40px] min-w-[40px] resizable bg-light-gray-900">
        <div className="relative m-auto aspect-video max-h-full min-h-0 max-w-full min-w-0 overflow-clip bg-green-900">
          <div className="size-[99999px]">Hack</div>
        </div>
      </div>

      {/* container query + known aspect ratio */}
      <div className="@container-size grid size-[100px] resizable place-items-center bg-dark-gray-600">
        <img
          src="https://dummyjson.com/image/320x180/0f766e"
          style={{
            '--aspect-ratio': '320 / 180',
            width: 'min(100cqw, calc(100cqh * var(--aspect-ratio)))',
            height: 'auto',
            aspectRatio: 'var(--aspect-ratio) auto',
          }}
        />
      </div>

      {/* 使用两张相同图片分别定义不同维度以实现任意未知比例 */}
      {/* 未来可能可以使用 CSS Box Sizing Level 4 的 contain sizing keyword 来简化实现 */}
      <div className="@container-size grid size-[100px] resizable place-content-center bg-dark-gray-600">
        {/* 只提供宽度 */}
        <img
          aria-hidden="true"
          className="pointer-events-none -mb-[100cqb] h-[100cqb] w-max max-w-[100cqi] opacity-10 area-[1/1]"
          src="https://dummyjson.com/image/320x180/0f766e"
        />

        {/* 提供高度，同时作为最终可见图片 */}
        <img
          className="-me-[100cqi] h-max max-h-[100cqb] w-[100cqi] max-w-full object-contain area-[1/1]"
          src="https://dummyjson.com/image/320x180/0f766e"
        />
      </div>
    </div>
  )
}

function ShowMore({ text }: { text: string }) {
  const [isShowMore, setIsShowMore] = useState(false)

  if (isShowMore) {
    return (
      <div className="relative overflow-hidden bg-dark-gray-700 leading-[2em]">
        <span>{text}</span>

        <span className="pointer-events-none float-end ml-2 inline-block text-transparent">
          Show less
        </span>

        <div
          className="absolute right-2 bottom-0 cursor-pointer text-purple-400"
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
    <div className="relative h-[1lh] bg-dark-gray-700 leading-[2em]">
      {/* When not overflow */}
      <div className="max-h-[4em] w-fit overflow-visible">{text}</div>

      {/* When overflow, this will cover above text */}
      <div className="relative -top-[4em] flex bg-inherit" title={text}>
        {/* Left part */}
        <div
          className="overflow-hidden text-ellipsis whitespace-nowrap"
          style={{
            maskImage: 'linear-gradient(to left, transparent, black 10em)',
          }}
        >
          {text}
        </div>

        {/* Right part */}
        <div
          className="ml-2 w-max shrink-0 cursor-pointer text-purple-400"
          onClick={() => setIsShowMore((prev) => !prev)}
        >
          Show more
        </div>
      </div>
    </div>
  )
}

function MultiLineShowMore({ text }: { text: string }) {
  const [isShowMore, setIsShowMore] = useState(false)

  const MAX_CONTENT_HEIGHT = '100px'

  const btn = (
    <button
      type="button"
      className="pointer-events-auto flex-center cursor-pointer gap-1.5 justify-self-start border-none bg-transparent p-0 text-light-gray-700"
      onClick={() => {
        setIsShowMore((prev) => !prev)
      }}
    >
      {isShowMore ? 'Show less' : 'Show more'}{' '}
      <CarbonChevronDown className={clsx('inline-block', isShowMore ? '-rotate-180' : '')} />
    </button>
  )

  return (
    <div className="grid gap-y-2 rounded-2xl bg-dark-gray-500 p-4">
      <p
        className={clsx('m-0 overflow-clip whitespace-pre-wrap area-[1/1]')}
        style={{
          maxHeight: isShowMore ? undefined : MAX_CONTENT_HEIGHT,
        }}
      >
        {text}
      </p>

      {isShowMore ? (
        // TODO: hide "Show less" when text back to 3 lines
        btn
      ) : (
        <div
          className="pointer-events-none flex flex-col flex-wrap overflow-clip contain-strict area-[1/1]"
          style={{
            '--mask-height': '40px',
          }}
        >
          <div
            className="w-full"
            style={{
              height: `calc(${MAX_CONTENT_HEIGHT} - var(--mask-height))`,
            }}
          ></div>

          <div className="via-darkgry-500 flex h-(--mask-height) items-end bg-linear-to-t from-dark-gray-500 via-dark-gray-500 via-[18px] to-transparent">
            {btn}
          </div>
        </div>
      )}
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
    <div className="flex w-[300px] max-w-full resizable-x gap-2 bg-dark-gray-700 text-sm">
      <div className="h-[1lh] flex-1">
        <div className="flex max-h-[2lh] max-w-max flex-wrap gap-x-2 bg-blue-400/20 px-2">
          <div className="h-[1lh]">🏐</div>

          <div className="break-all">Button 1</div>
        </div>

        <div className="relative -top-[2lh] flex bg-dark-gray-700">
          <div className="bg-blue-400/20 px-2">🏀</div>
        </div>
      </div>

      <div className="shrink-0 bg-green-400/20 px-2">Button 2</div>

      <div className="shrink-0 bg-red-400/20 px-2">Button 3</div>
    </div>
  )
}

function AutoShrinkButton2() {
  return (
    <div className="flex w-[450px] max-w-full resizable-x gap-2 bg-dark-gray-700 text-sm">
      <div className="mr-auto h-[1lh]">
        <div className="flex gap-2 overflow-hidden">
          <div className="flex max-h-[2lh] max-w-max flex-wrap gap-x-2 bg-blue-400/20 px-2">
            <div className="h-[1lh]">🏐</div>

            <div className="break-all">Button 1</div>
          </div>

          <div className="flex shrink-0 gap-2">
            <div className="shrink-0 bg-green-400/20 px-2 whitespace-nowrap">Button 2</div>

            <div className="shrink-0 bg-red-400/20 px-2 whitespace-nowrap">Button 3</div>
          </div>
        </div>

        <div className="relative -top-[2lh] flex gap-2 bg-dark-gray-700">
          <div className="bg-blue-400/20 px-2">🏀</div>

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
    <div className="flex w-[100px] max-w-full resizable-x gap-2 text-sm">
      <div className="h-[1lh]">
        <div className="relative flex flex-row flex-wrap-reverse">
          <div className="h-[1lh] shrink-0">Button</div>
          <div className="h-[1lh] w-px"></div>

          <div className="absolute bottom-[1lh] shrink-0 whitespace-nowrap">AAAA djaiowjdoi</div>
        </div>
      </div>
    </div>
  )
}

/**
 * https://stackoverflow.com/questions/32118013/align-icon-vertically-to-the-center-of-the-first-line-of-text
 */
function FlexAlignFirstLine() {
  return <div className="flex">WIP</div>
}

function GridRepeat() {
  return (
    <div className="@container resizable-x">
      {/* item min width: 200px, at least 2 columns */}
      <div
        className={clsx(
          'grid gap-2',
          // items
          '[&>div]:bg-red-300',
          // titles
          '[&>span]:justify-self-start [&>span]:bg-blue-300',
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
          'mt-4 grid gap-2',
          // items
          '[&>div]:bg-red-300',
          // titles
          '[&>span]:justify-self-start [&>span]:bg-blue-300',
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

/**
 * 动态多行文本省略
 */
function DynamicMultiLineClamp() {
  return (
    <div
      // TODO: fit initial height to content instead of fixed height
      className="@container-size h-[120px] w-[200px] resizable-y bg-dark-gray-600"
    >
      <div
        className={clsx(
          'line-clamp-(--line-clamp) max-h-full',
          // debug text
          'relative before:absolute before:top-0 before:left-0 before:bg-white before:px-2 before:py-0.5 before:text-lg before:font-extrabold before:text-black before:content-[counter(v)] before:[counter-reset:v_var(--line-clamp)]',
        )}
        style={{
          // line-clamp = round(down, height / line-height)
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

/**
 * TODO:图片和文字(包括 text node)之间换行（包括前后），连续的图片之间不换行
 * - 如果图片在最前面，则图片前面不需要换行（多余的换行）
 * - 如果图片在最后面，则图片后面不需要换行（多余的换行）
 * - 如果图片在中间，则图片前后都需要换行
 * - 连续的图片之间不需要换行
 * 已知问题：text node 无法选中 https://github.com/w3c/csswg-drafts/issues/2208
 */
function ImageNewLine() {
  const [isTextNode, setIsTextNode] = useState(false)

  return (
    <div>
      <button onClick={() => setIsTextNode(!isTextNode)}>toggle text node</button>

      <div>
        {isTextNode ? '#text 1' : <span>#text 1</span>}

        <ImageItem />

        {isTextNode ? '#text 2' : <span>#text 2</span>}

        {[0, 1, 2].map((v) => (
          <ImageItem key={v} />
        ))}

        {isTextNode ? '#text 3' : <span>#text 3</span>}

        <ImageItem />

        {isTextNode ? '#text 4' : <span>#text 4</span>}
      </div>
    </div>
  )
}

function ImageItem() {
  return (
    <div
      className={clsx(
        'inline align-top',
        // 仅第一个连续的图片且前面有元素，前 换行
        '[--s-br:inline] first:[--s-br:none] [&_+_div]:[--s-br:none]',
        // 仅最后一个连续的图片且后面有元素 后 换行
        '[--e-br:inline] last:[--e-br:none] has-[+_div]:[--e-br:none]',
      )}
    >
      <br className="[display:var(--s-br)]" />

      <div className="inline-block size-20 bg-linear-to-r/oklch from-blue-300 via-green-500 via-35% to-yellow-400"></div>

      <br className="[display:var(--e-br)]" />
    </div>
  )
}

function BleedLayout() {
  const [state, setState] = useState(false)

  return (
    <div
      className="grid resizable-x gap-y-2 text-center [:where(&>*)]:col-start-2"
      style={{
        gridTemplateColumns: state
          ? '24px 1fr 24px' // 左右固定宽度，中间自适应
          : '1fr min(600px, 100%) 1fr', // 左右自适应，中间固定最大宽度
      }}
    >
      <div className="bg-green-800">Normal element</div>
      <button onClick={() => setState((v) => !v)}>
        Toggle Layout (current: {state ? 'fixed sides' : 'fixed center'})
      </button>

      <div className="col-span-full bg-blue-700">Full width element</div>

      <div className="bg-green-800">Normal element</div>
      <div className="bg-green-800">Normal element</div>
    </div>
  )
}

/**
 * Grid 布局，不确定行数，某一项撑满剩余空间，类似 flex-grow: 1
 */
function GridItemFlexGrow() {
  const [state, setState] = useState(false)

  return (
    <div className="relative grid h-70 max-w-36 grid-flow-row auto-rows-[minmax(0,min-content)] gap-2 bg-purple-400/15 pe-6">
      {/* 这几项应当为 min-content 高度，且数量不确定 */}
      <button onClick={() => setState((v) => !v)}>Toggle</button>
      <div className="bg-green-800">1</div>
      <div className="bg-green-800">2</div>

      {/* 这一项应当始终撑满容器但不溢出 */}
      <div
        className="overflow-auto bg-blue-700"
        style={{
          containerType: 'size',
          // 非常大的内在高度，确保撑满容器
          containIntrinsicBlockSize: '99999px',
        }}
      >
        <div>Flex item</div>

        {state && <div className="h-[300px]">999</div>}
      </div>

      <div className="bg-green-800">3</div>
    </div>
  )
}

// TODO: 显示区域大于实际可滚动区域
//
// +- - - - - - - -+- - - - - - - - - - - - - - - -
// |               |                      ↑
// |---------------|---                   |
// |               | ↑                    |
// |               |容器和滚动条区域    实际显示内容范围
// |               | ↓                    |
// |---------------|---                   |
// |               |                      ↓
// +- - - - - - - -+- - - - - - - - - - - - - - - -
//
// 以下为使用 scrollbar margin block 模拟的行为
function ScrollClipMargin() {
  const editorRef = useRef<HTMLDivElement>(null)

  return (
    <div className="relative my-20 ms-10 h-[300px] w-[300px] overflow-visible">
      <div className="pointer-events-none absolute -inset-x-2 inset-y-0 z-1 border bg-white/10" />

      <div
        className={clsx(
          styles.scrollbar,
          'relative -top-[50px] h-[400px] scroll-py-[50px] overflow-y-auto overscroll-contain',
        )}
        style={{
          '--scrollbar-margin-block': '50px',
        }}
      >
        <div className="flex flex-col bg-green/20 py-[50px]">
          {/* <div className="h-[50px] bg-green-700"></div> */}
          <div
            ref={editorRef}
            contentEditable
            className="min-h-[200px] grow basis-max bg-dark-gray-500 outline-none"
            // FIXME: 使用 scroll-padding 来添加输入内边距时，手动添加的内容无效
            // 例如手动添加换行时
            onKeyDown={(e) => {
              if (!(e.key === 'Enter')) {
                return
              }

              e.preventDefault()
              e.stopPropagation()

              const sel = window.getSelection()
              if (!sel || !sel.rangeCount) return
              const range = sel.getRangeAt(0)

              const p = document.createElement('p')
              const br = document.createElement('br')
              p.append(br)
              editorRef.current?.append(p)
              range.setStartAfter(br)
              range.setEndAfter(br)
              sel.removeAllRanges()

              sel.addRange(range)

              p.scrollIntoView({
                block: 'nearest',
                inline: 'nearest',
                behavior: 'instant',
              })
            }}
          ></div>
          {/* <textarea className="grow basis-max min-h-[300px] field-sizing-content"></textarea> */}
          {/* <div className="h-[50px] bg-green-700 mt-auto"></div> */}
        </div>
      </div>
    </div>
  )
}

/**
 * 将滚动容器默认滚动到中间位置
 */
function ScrollDefaultCenter() {
  const hideOnLoad = useRef<RefCallback<HTMLElement>>((el) => {
    if (!el) return

    requestAnimationFrame(() => {
      el.style.display = 'none'
    })
  }).current

  return (
    <div className="h-10 w-100 snap-x snap-mandatory overflow-x-auto">
      <div className="relative h-full w-200 bg-linear-to-r/oklch from-blue-400 to-green-400">
        <div
          aria-hidden
          className="pointer-events-none invisible absolute inset-0 m-auto size-0 snap-center"
          ref={hideOnLoad}
        />
      </div>
    </div>
  )
}

/**
 * 将字体大小设置为占满容器宽度
 *
 * https://kizu.dev/fit-to-width/
 */
function TextFitToWidth() {
  const text = 'Resize me'

  return (
    <div className="@container flex w-[400px] resizable-x bg-dark-gray-200">
      <div
        className="@container flex-1 outline"
        style={{
          '--captured-length': '100cqi',
          '--available-space': 'var(--captured-length)',
        }}
      >
        <div
          // https://github.com/w3c/csswg-drafts/issues/2528
          // Chrome 150+ 可以使用 text-fit
          // 在 Firefox 上 ratio 计算可能不精确导致 1em * ratio 后略大于 available-space，从而导致换行，手动不换行
          className="@[>0px]:whitespace-nowrap"
          style={{
            inlineSize: 'var(--available-space)',
            '--captured-length': '100cqi',
            '--ratio':
              'tan(atan2(var(--available-space), var(--available-space) - var(--captured-length)))',
            '--dynamic-font-size': 'calc(1em * (var(--ratio)))',
            fontSize: 'clamp(1em, var(--dynamic-font-size), 120px)',
          }}
        >
          {text}
        </div>
      </div>

      <div className="whitespace-nowrap outline">{text}</div>
    </div>
  )
}

function AnchorPositionInScroll() {
  return (
    <div
      className="relative flex h-100 w-auto gap-12"
      style={{
        anchorScope: '--anchor-a, --anchor-b, --proxy-a, --proxy-b',
      }}
    >
      <div className="h-full overflow-y-auto">
        <p
          style={{
            anchorName: '--anchor-a',
          }}
        >
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Esse voluptatibus ad doloribus
          est expedita nesciunt exercitationem sunt quaerat quos deserunt aliquid dolorum
          dignissimos repudiandae, et aspernatur porro nihil, veniam reiciendis.
        </p>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Esse voluptatibus ad doloribus
          est expedita nesciunt exercitationem sunt quaerat quos deserunt aliquid dolorum
          dignissimos repudiandae, et aspernatur porro nihil, veniam reiciendis.
        </p>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Esse voluptatibus ad doloribus
          est expedita nesciunt exercitationem sunt quaerat quos deserunt aliquid dolorum
          dignissimos repudiandae, et aspernatur porro nihil, veniam reiciendis.
        </p>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Esse voluptatibus ad doloribus
          est expedita nesciunt exercitationem sunt quaerat quos deserunt aliquid dolorum
          dignissimos repudiandae, et aspernatur porro nihil, veniam reiciendis.
        </p>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Esse voluptatibus ad doloribus
          est expedita nesciunt exercitationem sunt quaerat quos deserunt aliquid dolorum
          dignissimos repudiandae, et aspernatur porro nihil, veniam reiciendis.
        </p>

        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Esse voluptatibus ad doloribus
          est expedita nesciunt exercitationem sunt quaerat quos deserunt aliquid dolorum
          dignissimos repudiandae, et aspernatur porro nihil, veniam reiciendis.
        </p>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Esse voluptatibus ad doloribus
          est expedita nesciunt exercitationem sunt quaerat quos deserunt aliquid dolorum
          dignissimos repudiandae, et aspernatur porro nihil, veniam reiciendis.
        </p>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Esse voluptatibus ad doloribus
          est expedita nesciunt exercitationem sunt quaerat quos deserunt aliquid dolorum
          dignissimos repudiandae, et aspernatur porro nihil, veniam reiciendis.
        </p>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Esse voluptatibus ad doloribus
          est expedita nesciunt exercitationem sunt quaerat quos deserunt aliquid dolorum
          dignissimos repudiandae, et aspernatur porro nihil, veniam reiciendis.
        </p>
      </div>

      <div className="h-full overflow-y-auto">
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Esse voluptatibus ad doloribus
          est expedita nesciunt exercitationem sunt quaerat quos deserunt aliquid dolorum
          dignissimos repudiandae, et aspernatur porro nihil, veniam reiciendis.
        </p>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Esse voluptatibus ad doloribus
          est expedita nesciunt exercitationem sunt quaerat quos deserunt aliquid dolorum
          dignissimos repudiandae, et aspernatur porro nihil, veniam reiciendis.
        </p>
        <p
          style={{
            anchorName: '--anchor-b',
          }}
        >
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Esse voluptatibus ad doloribus
          est expedita nesciunt exercitationem sunt quaerat quos deserunt aliquid dolorum
          dignissimos repudiandae, et aspernatur porro nihil, veniam reiciendis.
        </p>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Esse voluptatibus ad doloribus
          est expedita nesciunt exercitationem sunt quaerat quos deserunt aliquid dolorum
          dignissimos repudiandae, et aspernatur porro nihil, veniam reiciendis.
        </p>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Esse voluptatibus ad doloribus
          est expedita nesciunt exercitationem sunt quaerat quos deserunt aliquid dolorum
          dignissimos repudiandae, et aspernatur porro nihil, veniam reiciendis.
        </p>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Esse voluptatibus ad doloribus
          est expedita nesciunt exercitationem sunt quaerat quos deserunt aliquid dolorum
          dignissimos repudiandae, et aspernatur porro nihil, veniam reiciendis.
        </p>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Esse voluptatibus ad doloribus
          est expedita nesciunt exercitationem sunt quaerat quos deserunt aliquid dolorum
          dignissimos repudiandae, et aspernatur porro nihil, veniam reiciendis.
        </p>

        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Esse voluptatibus ad doloribus
          est expedita nesciunt exercitationem sunt quaerat quos deserunt aliquid dolorum
          dignissimos repudiandae, et aspernatur porro nihil, veniam reiciendis.
        </p>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Esse voluptatibus ad doloribus
          est expedita nesciunt exercitationem sunt quaerat quos deserunt aliquid dolorum
          dignissimos repudiandae, et aspernatur porro nihil, veniam reiciendis.
        </p>
      </div>

      <div
        className="pointer-events-none absolute size-stretch bg-blue/40"
        style={{
          positionAnchor: '--anchor-a',
          top: 'anchor(top)',
          right: 'anchor(right)',
          bottom: 'anchor(bottom)',
          left: 'anchor(left)',
          positionVisibility: 'always',
          anchorName: '--proxy-a',
        }}
      ></div>

      <div
        className="pointer-events-none absolute size-stretch bg-green/40"
        style={{
          positionAnchor: '--anchor-b',
          top: 'anchor(top)',
          right: 'anchor(right)',
          bottom: 'anchor(bottom)',
          left: 'anchor(left)',
          positionVisibility: 'always',
          anchorName: '--proxy-b',
        }}
      ></div>

      {/* FIXME: 两个 anchor 都在滚动容器内时，Chrome 不会更新 position-anchor 之外的另一个 anchor */}
      {/* FIXME: Firefox 在滚动容器 transform 时（例如上下浮动），并没有跟随 transform 之后的值 */}
      {/* FIXME: Firefox 没有及时更新第二个 anchor 的位置，但是如果有正在跑的 transform 动画则会及时更新 */}
      <div
        className="pointer-events-none absolute size-stretch bg-red/40"
        style={{
          positionAnchor: '--proxy-a',
          top: 'min(anchor(--proxy-a top), anchor(--proxy-b top))',
          right: 'anchor(--proxy-b left)',
          bottom: 'min(anchor(--proxy-a bottom), anchor(--proxy-b bottom))',
          left: 'anchor(--proxy-a right)',
          positionVisibility: 'always',
        }}
      ></div>
    </div>
  )
}

/**
 * Grid 布局，自动列数，但是有2-4列的限制
 */
function GridMinMaxColumns() {
  return (
    <div
      className="grid w-[min(100%,400px)] resizable-x"
      style={{
        '--col-gap': '8px',
        '--col-size': '100px',
        '--min-cols': 2,
        '--max-cols': 4,

        '--min-col-size': '(100% + var(--col-gap)) / var(--max-cols) - var(--col-gap)',
        '--max-col-size': '(100% + var(--col-gap)) / var(--min-cols) - var(--col-gap)',
        '--col-size-calc': 'min(max(var(--col-size), var(--min-col-size)), var(--max-col-size))',

        gap: 'var(--col-gap)',
        gridTemplateColumns: `repeat(auto-fit, minmax(var(--col-size-calc), 1fr))`,
      }}
    >
      {range(10).map((i) => (
        <div key={i} className="flex h-10 items-center justify-center bg-red-300">
          {i + 1}
        </div>
      ))}
    </div>
  )
}

// TODO: grid 布局，不确定列数，不确定数量，最后一项撑满剩余空间，只指定每列的最小宽度（但不能超过容器宽度），可能带有确定宽度的 gap。
// 更激进的：任意一项撑满当前行剩余列宽而不只是最后一项
// 可能的实现1：grid-auto-columns: repeat(auto-fit, 100px) minmax(0, 1fr));❌
// 可能的实现2：使用 anchor 元素，将最后一项和一个 absolute 的 column -1 的元素之间链接起来，视觉上达到效果。❌
// 可能的实现3：选择器选择 last-row，设置 colmn-start，last-child 设置 colmn-end: -1。❌，不存在此种选择器
// 可能的实现4：使用 @container 手动计算然后根据 sibling-count() 给 last-child 设置 column-start/column-end。✅
// 可能的实现5：使用 subgrid 包装最后一个元素，父元素占据一列，子元素从父元素开始，span 到列尾。❌，subgrid 只会继承父元素这一列。
// +---+---+---+    +---+---+---+---+    +---+---+---+---+---+
// | 1 | 2 | 3 |    | 1 | 2 | 3 | 4 |    | 1 | 2 | 3 | 4 | 5 |
// +---+---+---+    +---+---+---+---+    +---+---+---+---+---+
// | 4 |   5   |    |       5       |
// +---+-------+    +---------------+
//
// +---+---+---+    +---+---+---+---+    +---+---+---+---+---+
// | 1 | 2 | 3 |    | 1 | 2 | 3 | 4 |    | 1 | 2 | 3 | 4 | 5 |
// +---+---+---+    +---+---+---+---+    +---+---+---+---+---+
// | 4 | 5 | 6 |    | 5 |     6     |    |         6         |
// +---+---+---+    +---+-----------+    +-------------------+
//
// +---+---+---+    +---+---+---+---+    +---+---+---+---+---+
// | 1 | 2 | 3 |    | 1 | 2 | 3 | 4 |    | 1 | 2 | 3 | 4 | 5 |
// +---+---+---+    +---+---+---+---+    +---+---+---+---+---+
// | 4 | 5 | 6 |    | 5 | 6 |   7   |    | 6 |       7       |
// +---+---+---+    +---+---+-------+    +---+---------------+
// |     7     |
// +-----------+
//
// +---+---+---+    +---+---+---+---+    +---+---+---+---+---+
// | 1 | 2 | 3 |    | 1 | 2 | 3 | 4 |    | 1 | 2 | 3 | 4 | 5 |
// +---+---+---+    +---+---+---+---+    +---+---+---+---+---+
// | 4 | 5 | 6 |    | 5 | 6 | 7 | 8 |    | 6 | 7 |     8     |
// +---+---+---+    +---+---+---+---+    +---+---+-----------+
// | 7 |   8   |
// +---+-------+
function GridLastItemFlexGrow() {
  const [itemCount, setItemCount] = useState(5)

  return (
    <div className="w-[min(100%,400px)] resizable-x">
      <div>
        <button onClick={() => setItemCount((v) => Math.max(0, v - 1))}>-1</button>

        {itemCount}

        <button onClick={() => setItemCount((v) => v + 1)}>+1</button>
      </div>

      <div
        className="@container"
        style={{
          '--column-min': '100px',
          '--gap': '10px',
        }}
      >
        <div
          className="grid"
          style={{
            '--column-step': 'calc(var(--column-min) + var(--gap))',
            '--fitted-length': 'round(down, 100cqi + var(--gap) + .001px, var(--column-step))',
            '--column-count': 'max(1, var(--fitted-length) / var(--column-step))',
            gridTemplateColumns:
              'repeat(var(--column-count), minmax(min(100%, var(--column-min)), 1fr))',
            gap: 'var(--gap)',
          }}
        >
          <div className="contents">
            {range(itemCount).map((i) => (
              <div
                key={i}
                className="flex-center h-10 bg-red-300 last:col-end-(--end)"
                style={{
                  '--end':
                    'span calc(var(--column-count) - mod(calc(sibling-count() - 1), var(--column-count)))',
                }}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// TODO: multi dynamic sticky elments stack with dynamic height (or fixed height)
// 可以点击按钮设置列表项是否 sticky，可以多个 sticky
// sticky 时，滚动出范围时，会自动堆叠到下一个 sticky 元素的下面
function StickyStack() {}

function StickyNav() {
  return (
    <div className="@container-size relative flex h-96 max-w-3/4 flex-col overflow-y-auto overscroll-y-contain bg-dark-gray-600">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-white/10 px-4 py-3 text-sm">
        <div className="flex items-center gap-2 font-semibold">
          <div className="size-5 rounded bg-blue-500/60"></div>
          My App
        </div>
        <nav className="flex gap-3 text-light-gray-700">
          <span className="cursor-pointer hover:text-white">Home</span>
          <span className="cursor-pointer hover:text-white">About</span>
          <span className="cursor-pointer hover:text-white">Docs</span>
          <span className="cursor-pointer hover:text-white">Blog</span>
        </nav>
        <div className="ms-auto text-xs text-light-gray-700">v2.4.1</div>
      </header>

      <section className="flex flex-1">
        {/* 将 sticky top 和 sticky bottom 分离，如果内容很多会出现问题 */}
        <nav className="flex w-28 shrink-0 flex-col border-r border-white/10 p-3 text-xs text-light-gray-700">
          <div className="sticky top-3">
            <div className="rounded bg-white/10 px-2 py-1.5 font-medium text-white">Dashboard</div>
            <div className="rounded px-2 py-1.5 hover:bg-white/5">Analytics</div>
            <div className="rounded px-2 py-1.5 hover:bg-white/5">Projects</div>
            <div className="rounded px-2 py-1.5 hover:bg-white/5">Team</div>
            <div className="rounded px-2 py-1.5 hover:bg-white/5">Settings</div>
            <div className="rounded px-2 py-1.5 hover:bg-white/5">Settings</div>
            <div className="rounded px-2 py-1.5 hover:bg-white/5">Settings</div>
          </div>

          <div className="sticky bottom-2 mt-auto">
            <div className="mt-3 border-t border-white/10 pt-2 text-[10px] tracking-wider text-light-gray-700/60 uppercase">
              Resources
            </div>
            <div className="rounded px-2 py-1.5 hover:bg-white/5">Help</div>
            <div className="rounded px-2 py-1.5 hover:bg-white/5">API</div>
          </div>
        </nav>

        {/* 这种基于两个 anchor 的方法现在只在 Firefox + animate 有效 */}
        {/* Chrome 按照规范只会追踪一个 default anchor */}
        <nav className="flex w-28 shrink-0 flex-col border-r border-white/10 p-3 text-xs text-light-gray-700">
          <div
            className="sticky top-3 h-2 bg-red/30"
            style={{
              anchorName: '--sticky-top',
            }}
          ></div>

          <div
            className="sticky bottom-2 mt-auto h-2 bg-blue/30"
            style={{
              anchorName: '--sticky-bottom',
            }}
          ></div>

          <div
            className="absolute flex h-stretch animate-noop scrollbar-thin flex-col overflow-y-auto"
            style={{
              positionAnchor: '--sticky-top',
              top: 'calc(anchor(--sticky-top top))',
              bottom: 'calc(anchor(--sticky-bottom bottom))',
              left: 'anchor(--sticky-top left)',
              right: 'anchor(--sticky-top right)',
            }}
          >
            <div className="">
              <div className="rounded bg-white/10 px-2 py-1.5 font-medium text-white">
                Dashboard
              </div>
              <div className="rounded px-2 py-1.5 hover:bg-white/5">Analytics</div>
              <div className="rounded px-2 py-1.5 hover:bg-white/5">Projects</div>
              <div className="rounded px-2 py-1.5 hover:bg-white/5">Team</div>
              <div className="rounded px-2 py-1.5 hover:bg-white/5">Settings</div>
              <div className="rounded px-2 py-1.5 hover:bg-white/5">Settings</div>
              <div className="rounded px-2 py-1.5 hover:bg-white/5">Settings</div>
            </div>

            <div className="mt-auto">
              <div className="mt-3 border-t border-white/10 pt-2 text-[10px] tracking-wider text-light-gray-700/60 uppercase">
                Resources
              </div>
              <div className="rounded px-2 py-1.5 hover:bg-white/5">Help</div>
              <div className="rounded px-2 py-1.5 hover:bg-white/5">API</div>
            </div>
          </div>

          <div className="fixed"></div>
        </nav>

        <article className="flex-1 p-4 text-sm leading-relaxed text-light-gray-800">
          <div className="max-w-[65ch]">
            <h3 className="mt-0 mb-2 text-base font-semibold text-white">Getting Started</h3>
            <p className="mt-0">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
              exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
            <p>
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui
              officia deserunt mollit anim id est laborum.
            </p>

            <h4 className="mt-4 mb-1 font-semibold text-white">Installation</h4>
            <p className="mt-0">
              At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium
              voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint
              occaecati cupiditate non provident.
            </p>
            <pre className="overflow-x-auto rounded border border-white/10 bg-white/5 p-3 text-xs leading-relaxed">
              <code>{`npm install my-app
# or
yarn add my-app
# or
pnpm add my-app`}</code>
            </pre>
            <p>
              Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus
              id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor
              repellendus.
            </p>

            <h4 className="mt-4 mb-1 font-semibold text-white">Configuration</h4>
            <p className="mt-0">
              Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque
              laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi
              architecto beatae vitae dicta sunt explicabo.
            </p>
            <ul className="my-2 list-inside list-disc space-y-1">
              <li>Enable feature flags in the dashboard</li>
              <li>Set up API keys with proper scopes</li>
              <li>Configure webhook endpoints for real-time events</li>
              <li>Adjust rate limits based on your plan tier</li>
              <li>Review security settings and enable 2FA</li>
            </ul>

            <h4 className="mt-4 mb-1 font-semibold text-white">API Reference</h4>
            <p className="mt-0">
              Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia
              consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
            </p>
            <div className="my-3 overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-2 py-1.5 font-semibold text-light-gray-600">Method</th>
                    <th className="px-2 py-1.5 font-semibold text-light-gray-600">Endpoint</th>
                    <th className="px-2 py-1.5 font-semibold text-light-gray-600">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/5">
                    <td className="px-2 py-1.5 font-mono text-green-400">GET</td>
                    <td className="px-2 py-1.5 font-mono">/api/v1/users</td>
                    <td className="px-2 py-1.5">List all users</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="px-2 py-1.5 font-mono text-blue-400">POST</td>
                    <td className="px-2 py-1.5 font-mono">/api/v1/users</td>
                    <td className="px-2 py-1.5">Create a new user</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="px-2 py-1.5 font-mono text-yellow-400">PUT</td>
                    <td className="px-2 py-1.5 font-mono">/api/v1/users/:id</td>
                    <td className="px-2 py-1.5">Update user details</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1.5 font-mono text-red-400">DELETE</td>
                    <td className="px-2 py-1.5 font-mono">/api/v1/users/:id</td>
                    <td className="px-2 py-1.5">Remove a user</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 className="mt-4 mb-1 font-semibold text-white">Deployment</h4>
            <p className="mt-0">
              Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe
              eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum
              rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias
              consequatur aut perferendis doloribus asperiores repellat.
            </p>
            <p>
              Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum
              soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat
              facere possimus, omnis voluptas assumenda est.
            </p>

            <h4 className="mt-4 mb-1 font-semibold text-white">Troubleshooting</h4>
            <p className="mt-0">
              Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci
              velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam
              aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem
              ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur.
            </p>
            <p className="mb-0">
              Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil
              molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur.
            </p>
          </div>
        </article>
      </section>

      <footer className="border-t border-white/10 px-4 py-4 text-xs text-light-gray-700">
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <div>
            <div className="mb-1 font-semibold text-light-gray-600">Product</div>
            <div>Features</div>
            <div>Pricing</div>
            <div>Changelog</div>
          </div>
          <div>
            <div className="mb-1 font-semibold text-light-gray-600">Company</div>
            <div>About</div>
            <div>Careers</div>
            <div>Contact</div>
          </div>
          <div>
            <div className="mb-1 font-semibold text-light-gray-600">Legal</div>
            <div>Privacy</div>
            <div>Terms</div>
          </div>
        </div>
        <div className="mt-3 border-t border-white/5 pt-2 text-center">
          &copy; 2026 My App. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
