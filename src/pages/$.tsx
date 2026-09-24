import '@fontsource/rajdhani/latin-500.css'
import '@fontsource/roboto-condensed/latin-700.css'

import styles from './not-found.module.css'

import { Link } from 'react-router'
import SignalRain from '~/components/NotFound/SignalRain'

export default function NotFound() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} to="/" aria-label="Home">
          <span />
        </Link>
        <div className={styles.navigation}>
          <span className={styles.about}>About</span>
          <span className={styles.signIn}>Sign in</span>
          <span className={styles.registration}>Registration</span>
        </div>
      </header>

      <main className={styles.main} aria-labelledby="not-found-title">
        <SignalRain className={styles.rain} />
        <div className={styles.content}>
          <h1 className={styles.title} id="not-found-title" aria-label="Something went wrong">
            <span className={styles.firstLine}>Something</span>
            <span className={styles.secondLine}>
              went{' '}
              <span className={styles.wrong}>
                <span className={styles.word}>wrong</span>
                <span className={styles.slices} aria-hidden="true">
                  <span>wrong</span>
                  <span>wrong</span>
                  <span>wrong</span>
                  <span>wrong</span>
                  <span>wrong</span>
                </span>
              </span>
            </span>
          </h1>
          <Link className={styles.home} to="/">
            Go home
          </Link>
        </div>
      </main>
    </div>
  )
}
