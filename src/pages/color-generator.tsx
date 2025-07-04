//
// https://uicolors.app
// https://www.radix-ui.com/colors/custom
// https://github.com/proteanstudio/contrast-tools

import { Input } from '@base-ui-components/react'
import { ColorPicker } from 'antd'
import Color from 'colorjs.io'

export default function ColorGenerator() {
  const [inputVal, setInputVal] = useState('#8519F1')

  useEffect(() => {
    console.log(Color.spaces)
  }, [])

  const { bgColor, activeColor, hoverColor, textColor } = useMemo(() => {
    const color = new Color(inputVal)

    const hoverColor = color.clone()
    hoverColor.oklch.l += 0.04

    const activeColor = color.clone()
    activeColor.oklch.l += 0.08

    const whiteContrast = Math.abs(Color.contrast(color, 'white', 'APCA'))
    const blackContrast = Math.abs(Color.contrast(color, 'black', 'APCA'))
    const textColor = whiteContrast > blackContrast ? 'white' : 'black'

    return {
      bgColor: color.toString(),
      hoverColor: hoverColor.toString(),
      activeColor: activeColor.toString(),
      textColor: textColor,
    }
  }, [inputVal])

  return (
    <div
      className="grid size-full place-content-center"
      style={{
        '--input-color': bgColor,
        '--start': 'oklch(from var(--input-color) 0.18 0.24 h)',
        '--end': 'oklch(from var(--input-color) 0.01 0.14 h)',
        backgroundImage: 'linear-gradient(in oklch, var(--start) 0%, var(--end) 80%)',
      }}
    >
      <div className="flex gap-2">
        <Input
          className="px-3 py-2 rounded-md border border-solid border-dark-gray-200 bg-dark-gray-800 outline-none focus-visible:outline-solid outline-2 outline-offset-2 outline-blue-500"
          value={inputVal}
          spellCheck="false"
          onChange={(e) => setInputVal(e.currentTarget.value)}
        />
        <ColorPicker
          value={inputVal}
          onChange={(e) => {
            setInputVal(e.toRgbString())
          }}
          destroyOnHidden
          placement="rightTop"
        />
      </div>

      <button
        className="px-[8px] py-[4px] bg-(--bg) hover:bg-(--hover-bg) active:bg-(--active-bg) text-(--text) appearance-none border-none"
        style={{
          '--bg': bgColor,
          '--hover-bg': hoverColor,
          '--active-bg': activeColor,
          '--text': textColor,
        }}
      >
        Click
      </button>

      <div
        className="flex gap-1"
        style={{
          '--bg': bgColor,
        }}
      >
        {Array.from({ length: 10 }, (_, index) => {
          return (
            <div
              key={index}
              className="size-[20px]"
              style={{
                backgroundColor: `oklch(from var(--bg) ${index * 0.1 + 0.1} c h)`,
              }}
            />
          )
        })}
      </div>

      <ColorCompare />
    </div>
  )
}

const colorPalette = [
  ['#00F260', '#0575E6'],
  ['#c0c0aa', '#1cefff'],
  ['#00c3ff', '#ffff1c'],
  ['#f7ff00', '#db36a4'],
  ['#fc00ff', '#00dbde'],
  ['#03001e', '#fdeff9'],
  ['#FC5C7D', '#6A82FB'],
]

const colorSpaces = [
  'srgb',
  'oklch',
  'oklab',
  'lch',
  'hsl',
]

function ColorCompare() {
  const [[startColor, endColor], setGradient] = useState(['#ffffff', '#000000'])

  const gradients = useMemo(() => {
    return colorSpaces.map((space) => ({
      name: Color.spaces[space].name,
    }))
  }, [])

  function generateRandomColor() {
    const r1 = Math.floor(Math.random() * 256)
    const g1 = Math.floor(Math.random() * 256)
    const b1 = Math.floor(Math.random() * 256)

    const r2 = Math.floor(Math.random() * 256)
    const g2 = Math.floor(Math.random() * 256)
    const b2 = Math.floor(Math.random() * 256)

    setGradient([
      `rgb(${r1}, ${g1}, ${b1})`,
      `rgb(${r2}, ${g2}, ${b2})`,
    ])
  }

  return (
    <div>
      <div className="flex items-center gap-[6px]">
        <button onClick={generateRandomColor}>
          <span>Random</span>
          <div className="flex">
            <div className="size-[16px]" style={{ background: startColor }} />
            <div className="size-[16px]" style={{ background: endColor }} />
          </div>
        </button>

        {colorPalette.map(([start, end], i) => (
          <div
            key={i}
            className="flex border cursor-pointer"
            onClick={() => setGradient([start, end])}
          >
            <div
              className="size-[16px]"
              style={{ background: start }}
            />
            <div
              className="size-[16px]"
              style={{ background: end }}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {gradients.map(({ name }) => (
          <div key={name} className="flex justify-between items-center w-[300px]">
            <div>{name}</div>
            <div
              className="w-[250px] h-[32px] rounded-4px"
              style={{
                '--start': startColor,
                '--end': endColor,
                background:
                  `linear-gradient(90deg in ${name.toLowerCase()}, var(--start), var(--end)`,
              }}
            >
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
