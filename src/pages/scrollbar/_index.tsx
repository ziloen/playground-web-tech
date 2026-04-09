import styles from './index.module.css'

export default function Scrollbar() {
  return (
    <div
      className={clsx(styles.scrollbar, 'size-[400px] overflow-auto rounded-[24px] bg-[#24292e]')}
      style={{
        '--scrollbar-margin-block': '24px',
        '--scrollbar-margin-inline': '24px',
      }}
    >
      <div className="size-[100px] bg-green-800"></div>
      <div className="size-[800px]"></div>
    </div>
  )
}
