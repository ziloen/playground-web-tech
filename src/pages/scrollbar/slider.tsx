import styles from './slider.module.css'

export default function Slider() {
  const [value, setValue] = useState(0)

  return (
    <div
      className="py-2 px-10"
      style={{
        '--value': value,
      }}
    >
      <div className="flex flex-col items-start">
        <input
          className={styles['windows10']}
          type="range"
          step={0.01}
          min={0}
          max={1}
          dir="ltr"
          value={value}
          onChange={(e) => setValue(Number(e.currentTarget.value))}
        />

        <input
          className={styles['windows10']}
          type="range"
          step={0.01}
          min={0}
          max={1}
          dir="rtl"
          style={{
            '--value': value,
          }}
          value={value}
          onChange={(e) => setValue(Number(e.currentTarget.value))}
        />
      </div>

      <input
        className={clsx(styles['windows10'], 'writing-vertical-rl')}
        type="range"
        step={0.01}
        min={0}
        max={1}
        dir="ltr"
        value={value}
        onChange={(e) => setValue(Number(e.currentTarget.value))}
      />

      <input
        className={clsx(styles['windows10'], 'writing-vertical-rl')}
        type="range"
        step={0.01}
        min={0}
        max={1}
        dir="rtl"
        value={value}
        onChange={(e) => setValue(Number(e.currentTarget.value))}
      />

      <br />

      <input
        className={styles['mac']}
        type="range"
        step={0.01}
        min={0}
        max={1}
        dir="ltr"
        value={value}
        onChange={(e) => setValue(Number(e.currentTarget.value))}
      />

      <br />

      <input
        className={styles['windows11']}
        type="range"
        step={0.01}
        min={0}
        max={1}
        dir="ltr"
        value={value}
        onChange={(e) => setValue(Number(e.currentTarget.value))}
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
