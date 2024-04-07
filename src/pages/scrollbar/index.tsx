import styles from './index.module.css'

export default function Scrollbar() {
  return (
    <div className={clsx(styles.scrollbar, 'w-200px h-400px bg-[#24292e] of-auto rounded-24px')}>
      <div className="h-100px"></div>
      <div className="h-800px"></div>
    </div>
  )
}
