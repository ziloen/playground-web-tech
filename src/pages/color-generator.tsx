// 
// https://uicolors.app


import { ColorPicker, Input, Slider } from 'antd'
import Color from 'colorjs.io'

export default function ColorGenerator() {
  const [inputVal, setInputVal] = useState('#fff')

  useEffect(() => {
    console.log(Color.spaces)
  }, [])

  const bgColor = useMemo(() => {
    const color = new Color(inputVal)
    return color.toString()
  }, [inputVal])

  const hoverColor = useMemo(() => {
    const hoverColor = new Color(Color.mix(inputVal, '#000', .1, { space: 'oklab' }))
    return hoverColor.toString()
  }, [inputVal])

  const activeColor = useMemo(() => {
    const inputColor = new Color(inputVal)
    const activeColor = new Color(Color.mix(inputColor, '#000', .2, { space: 'oklab' }))
    return activeColor.toString()
  }, [inputVal])

  return (
    <div className='grid place-items-center h-full size-full w-full place-content-center'>
      <Input value={inputVal} onChange={e => setInputVal(e.currentTarget.value)} />

      <div>
        hover: {}
      </div>

      <button
        className='px-8px py-4px bg-$bg hover:bg-$hover-bg active:bg-$active-bg'
        style={{
          '--bg': bgColor,
          '--hover-bg': hoverColor,
          '--active-bg': activeColor,
        }}
      >Test Button</button>

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

function ColorCompare() {
  const colorSpaces = useMemo(() => ['oklab', 'oklch', 'lch', 'hsl', 'srgb'], [])
  const [steps, setSteps] = useState(30)
  const [[startColor, endColor], setGradient] = useState(['#ffffff', '#000000'])

  const [start, end] = useMemo(() => [new Color(startColor), new Color(endColor)], [startColor, endColor])

  const gradients = useMemo(() => {
    return colorSpaces.map(space => {
      const range = start.range(end, { space, outputSpace: 'srgb' })

      return {
        name: Color.spaces[space].name,
        gradient: Array
          .from({ length: steps + 1 })
          .map((_, i) => {
            const color = range(i / steps)
            return color.toString()
          })
          .join(',')
      }
    })
  }, [start, end, steps])


  return (
    <div>
      <div className='w-200px'>
        <Slider value={steps} min={3} max={100} onChange={setSteps} />
      </div>

      <div className='flex-align gap-6px'>
        {colorPalette.map(([start, end], i) => (
          <div
            key={i}
            className='flex border cursor-pointer'
            onClick={() => setGradient([start, end])}
          >
            <div
              className='w-16px h-16px'
              style={{ background: start }}
            />
            <div
              className='w-16px h-16px'
              style={{ background: end }}
            />
          </div>
        ))}
      </div>

      <div>
        {gradients.map(({ name, gradient }) => (
          <div key={name} className="flex-between items-center w-[300px]">
            <div>{name}</div>
            <div className='w-[200px] h-[16px] rounded-4px' style={{ background: 'linear-gradient(to right, var(--stops))', '--stops': gradient }}></div>
          </div>
        ))}
      </div>
    </div>
  )
}