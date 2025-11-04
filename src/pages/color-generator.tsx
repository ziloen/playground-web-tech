//
// https://uicolors.app
// https://www.radix-ui.com/colors/custom
// https://github.com/proteanstudio/contrast-tools

import { Input } from '@base-ui-components/react'
import Color from 'colorjs.io'
import { randomInt } from 'es-toolkit'
import { generateColorRamp } from 'rampensau'

export default function ColorGenerator() {
  const [inputVal, setInputVal] = useState('#8519F1')

  const { bgColor, activeColor, hoverColor, textColor } = useMemo(() => {
    let color: Color
    try {
      color = new Color(inputVal)
    } catch {
      color = new Color('#000')
    }

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
        <input
          type="color"
          value={inputVal}
          onChange={(e) => {
            setInputVal(e.currentTarget.value)
          }}
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
].map((space) => Color.spaces[space])

function ColorCompare() {
  const [gradients, setGradients] = useState(['#fff', '#000'])

  function generateRandomColor() {
    const hslColorValues = generateColorRamp({
      // hue generation options
      total: randomInt(3, 6), // number of colors in the ramp
      hStart: Math.random() * 360, // hue at the start of the ramp
      hCycles: 1, // number of full hue cycles
      // (.5 = 180°, 1 = 360°, 2 = 720°, etc.)
      hStartCenter: 0.5, // where in the ramp the hue should be centered
      hEasing: (x, fr) => x, // hue easing function x is a value between 0 and 1
      // fr is the size of each fraction of the ramp: (1 / total)

      // if you want to use a specific list of hues, you can pass an array of hues to the hueList option
      // all other hue options will be ignored

      // hueList: [...],                      // list of hues to use

      // saturation
      sRange: [Math.random() * 0.5, 1], // saturation range
      // sEasing: (x, fr) => x ** 2, // saturation easing function

      // lightness
      lRange: [Math.random() * 0.4, 0.95], // lightness range
      // lEasing: (x, fr) => x ** 1.5, // lightness easing function

      transformFn: (color, i) => color,
    })

    setGradients(
      hslColorValues.map(([h, s, l]) =>
        `hsl(${h.toFixed(2)}deg ${(s * 100).toFixed(2)}% ${(l * 100).toFixed(2)}%)`
      ),
    )
  }

  return (
    <div>
      <div className="flex items-center gap-[6px]">
        <button onClick={generateRandomColor}>
          <span>Random</span>
          <div className="flex">
            {gradients.map((color, i) => (
              <div key={color} className="size-[16px]" style={{ background: color }} />
            ))}
          </div>
        </button>

        {colorPalette.map(([start, end], i) => (
          <div
            key={i}
            className="flex border cursor-pointer"
            onClick={() => setGradients([start, end])}
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

      <div
        className="flex flex-col gap-2"
        style={{
          '--gradients': gradients.join(', '),
        }}
      >
        {colorSpaces.map(({ name }) => (
          <div key={name} className="flex justify-between items-center w-[300px]">
            <div>{name}</div>
            <div
              className="w-[250px] h-[32px] rounded-4px"
              style={{
                background: `linear-gradient(90deg in ${name.toLowerCase()}, var(--gradients))`,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
