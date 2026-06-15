import './$.css'

import type { CSSProperties } from 'react'
import { Link } from 'react-router'

const glyphs = ['0', '1', 'S', 'g', 'd', 'j', '$', 'Y', '4']

const digitalGlyphs = Array.from({ length: 118 }, (_, index) => {
  const denseRight = index % 3 === 0
  const left = denseRight ? 58 + ((index * 11) % 39) : (index * 17) % 101

  return {
    value: glyphs[(index * 7 + 2) % glyphs.length],
    className: index % 7 === 0 ? 'is-red' : index % 5 === 0 ? 'is-bright' : '',
    style: {
      '--x': `${left}%`,
      '--y': `${((index * 29) % 120) - 18}%`,
      '--drift': `${(index % 5) * 4 - 8}px`,
      '--duration': `${8.8 + (index % 6) * 1.25}s`,
      '--delay': `${(-((index * 0.41) % 9.5)).toFixed(2)}s`,
      '--scale': `${0.72 + (index % 4) * 0.13}`,
    } as CSSProperties,
  }
})

const pixels = Array.from({ length: 78 }, (_, index) => {
  const denseRight = index % 4 === 0 || index % 4 === 1
  const left = denseRight ? 58 + ((index * 13) % 38) : (index * 23) % 101
  const size = index % 9 === 0 ? 7 : index % 5 === 0 ? 5 : 3

  return {
    className: index % 11 === 0 ? 'is-hot' : index % 6 === 0 ? 'is-bright' : '',
    style: {
      '--x': `${left}%`,
      '--y': `${((index * 31) % 116) - 14}%`,
      '--size': `${size}px`,
      '--drift': `${(index % 7) * 3 - 9}px`,
      '--duration': `${7.4 + (index % 7) * 0.9}s`,
      '--delay': `${(-((index * 0.53) % 8.5)).toFixed(2)}s`,
    } as CSSProperties,
  }
})

export default function NotFound() {
  return (
    <main className="not-found-page" aria-labelledby="not-found-title">
      <section className="not-found-shell" aria-label="Page not found">
        <header className="not-found-nav">
          <div className="not-found-mark" aria-hidden="true" />
          <nav className="not-found-links" aria-label="Secondary">
            <a href="#">ABOUT</a>
            <a href="#">SIGN IN</a>
            <a href="#" aria-current="page">
              REGISTRATION
            </a>
          </nav>
        </header>

        <div className="not-found-scene" aria-hidden="true">
          <div className="not-found-depth" />
          <div className="not-found-columns" />
          <div className="not-found-vignette" />

          <div className="not-found-glyph-layer">
            {digitalGlyphs.map((glyph, index) => (
              <span className={glyph.className} key={index} style={glyph.style}>
                {glyph.value}
              </span>
            ))}
          </div>

          <div className="not-found-pixel-layer">
            {pixels.map((pixel, index) => (
              <i className={pixel.className} key={index} style={pixel.style} />
            ))}
          </div>
        </div>

        <div className="not-found-copy">
          <h1 id="not-found-title">
            Something
            <br />
            went{' '}
            <span className="not-found-glitch" data-text="wrong">
              wrong
            </span>
          </h1>
          <Link className="not-found-home" to="/">
            GO HOME
          </Link>
        </div>
      </section>
    </main>
  )
}
