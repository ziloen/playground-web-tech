import styles from './slider.module.css'

export default function Slider() {
  const [value, setValue] = useState(0)

  return (
    <div className="p-2">
      <input
        className={styles['slider']}
        type="range"
        step={0.01}
        min={0}
        max={1}
        style={{
          '--value': value,
        }}
        value={value}
        onChange={e => setValue(Number(e.currentTarget.value))}
      />
    </div>
  )
}
