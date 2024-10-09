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

      <div>
        <ul className="ps-[1em]">
          {/* TODO: customize list style */}
          {/* ::marker */}
          {/* @counter-style custom */}
          <li>Item1</li>
          <li>Item2</li>
          <li>Item3</li>
          <li>Item4</li>
        </ul>
      </div>
    </div>
  )
}
