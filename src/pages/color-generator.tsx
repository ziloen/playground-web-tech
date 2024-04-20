//
// https://uicolors.app
// https://www.radix-ui.com/colors/custom
// https://github.com/proteanstudio/contrast-tools

import { ColorPicker, Input, Slider } from 'antd'
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
        <Input value={inputVal} onChange={e => setInputVal(e.currentTarget.value)} />
        <ColorPicker
          value={inputVal}
          onChange={e => {
            setInputVal(e.toRgbString())
          }}
          destroyTooltipOnHide
          placement="topRight"
        />
      </div>

      <button
        className="px-[8px] py-[4px] bg-[--bg] hover:bg-[--hover-bg] active:bg-[--active-bg] text-[--text]"
        style={{
          '--bg': bgColor,
          '--hover-bg': hoverColor,
          '--active-bg': activeColor,
          '--text': textColor,
        }}
      >
        Test Button
      </button>

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
  'oklch',
  'oklab',
  'lch',
  'hsl',
  'srgb',
]

function ColorCompare() {
  const [steps, setSteps] = useState(10)
  const [[startColor, endColor], setGradient] = useState(['#ffffff', '#000000'])

  const gradients = useMemo(() => {
    return colorSpaces.map(space => ({
      name: Color.spaces[space].name,
    }))
  }, [])

  return (
    <div>
      <div className="flex-align gap-[6px]">
        {colorPalette.map(([start, end], i) => (
          <div
            key={i}
            className="flex border cursor-pointer"
            onClick={() => setGradient([start, end])}
          >
            <div
              className="w-[16px] h-[16px]"
              style={{ background: start }}
            />
            <div
              className="w-[16px] h-[16px]"
              style={{ background: end }}
            />
          </div>
        ))}
      </div>

      <div>
        {gradients.map(({ name }) => (
          <div key={name} className="flex-between items-center w-[300px]">
            <div>{name}</div>
            <div
              className="w-[200px] h-[16px] rounded-4px"
              style={{
                '--start': startColor,
                '--end': endColor,
                background:
                  `linear-gradient(in ${name.toLowerCase()} to right, var(--start), var(--end)`,
              }}
            >
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
