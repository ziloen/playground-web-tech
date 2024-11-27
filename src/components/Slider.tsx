import styles from './slider.module.css'

type Props = Omit<ComponentProps<'input'>, 'type' | 'value' | 'min' | 'max'> & {
  value: number
  min: number
  max: number
}

export default function Slider(props: Props) {
  return (
    <input
      className={styles['windows-slider']}
      type="range"
      step={0.01}
      {...props}
      style={{
        '--value': (props.value - props.min) / (props.max - props.min),
        ...props.style,
      }}
    />
  )
}
