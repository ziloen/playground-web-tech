import styles from './slider.module.css'

export default function Slider() {
  const [value, setValue] = useState(0)

  return (
    <div className="p-2">
      <div className="flex flex-col items-start">
        <input
          className={styles['windows-slider']}
          type="range"
          step={0.01}
          min={0}
          max={1}
          dir="ltr"
          style={{
            '--value': value,
          }}
          value={value}
          onChange={e => setValue(Number(e.currentTarget.value))}
        />

        <input
          className={styles['windows-slider']}
          type="range"
          step={0.01}
          min={0}
          max={1}
          dir="rtl"
          style={{
            '--value': value,
          }}
          value={value}
          onChange={e => setValue(Number(e.currentTarget.value))}
        />
      </div>

      <input
        className={clsx(styles['windows-slider'], 'writing-vertical-rl')}
        type="range"
        step={0.01}
        min={0}
        max={1}
        dir="ltr"
        style={{
          '--value': value,
        }}
        value={value}
        onChange={e => setValue(Number(e.currentTarget.value))}
      />

      <input
        className={clsx(styles['windows-slider'], 'writing-vertical-rl')}
        type="range"
        step={0.01}
        min={0}
        max={1}
        dir="rtl"
        style={{
          '--value': value,
        }}
        value={value}
        onChange={e => setValue(Number(e.currentTarget.value))}
      />

      <br />

      <input
        className={styles['mac-slider']}
        type="range"
        step={0.01}
        min={0}
        max={1}
        dir="ltr"
        style={{
          '--value': value,
        }}
        value={value}
        onChange={e => setValue(Number(e.currentTarget.value))}
      />
    </div>
  )
}
