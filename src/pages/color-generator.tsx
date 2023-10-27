import { Input } from 'antd'
import Color from 'colorjs.io'

export default function ColorGenerator() {
  const [inputVal, setInputVal] = useState('#fff')

  const bgColor = useMemo(() => {
    const color = new Color(inputVal)
    return color.toString()
  }, [inputVal])

  const hoverColor = useMemo(() => {
    const hoverColor = new Color(Color.mix(inputVal, '#000', .1, { space: 'oklab' }))
    return hoverColor.toString()
  }, [inputVal])

  const activeColor = useMemo(() => {
    const activeColor = new Color(Color.mix(inputVal, '#000', .2, { space: 'oklab' }))
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
    </div>
  )
}