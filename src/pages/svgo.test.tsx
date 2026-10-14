import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import SVGOPage from './svgo'

const svg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><path d="M0 0h10v10z"/></svg>'

function importFile(file: File, method: 'picker' | 'drop') {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]')!
  const dataTransfer = new DataTransfer()
  dataTransfer.items.add(file)

  if (method === 'picker') {
    input.files = dataTransfer.files
    input.dispatchEvent(new Event('change', { bubbles: true }))
  } else {
    document
      .querySelector('[data-panzoom-viewport]')!
      .dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer }))
  }
}

describe('SVG download filename', () => {
  it.each(['picker', 'drop'] as const)(
    'preserves the file name imported through %s',
    async (method) => {
      const screen = await render(<SVGOPage />)
      const name = 'quick-action-reading.svg'
      importFile(new File([svg], name, { type: 'image/svg+xml' }), method)

      const download = screen.getByRole('link', { name: 'Download', exact: true })
      await expect.element(download).toBeVisible()
      expect(download.element()).toHaveAttribute('download', name)
    },
  )

  it('updates the name with the next file and retains it when an import fails', async () => {
    const screen = await render(<SVGOPage />)
    const download = screen.getByRole('link', { name: 'Download', exact: true })
    importFile(new File([svg], 'first.svg'), 'picker')
    await expect.element(download).toHaveAttribute('download', 'first.svg')

    const name = '阅读 图标.v2.SVG'
    importFile(new File([svg], name), 'drop')
    await expect.element(download).toHaveAttribute('download', name)
    const href = download.element().getAttribute('href')

    importFile(new File(['invalid'], 'broken.svg'), 'picker')
    await expect
      .element(screen.getByText('This file does not contain valid SVG markup.'))
      .toBeVisible()
    expect(download.element()).toHaveAttribute('download', name)
    expect(download.element()).toHaveAttribute('href', href)
  })

  it.each([
    { label: 'pasted SVG', source: svg },
    { label: 'pasted data URL', source: `data:image/svg+xml,${encodeURIComponent(svg)}` },
    { label: 'demo', source: 'demo' },
  ])('uses the default name for $label', async ({ source }) => {
    const screen = await render(<SVGOPage />)
    const download = screen.getByRole('link', { name: 'Download', exact: true })

    importFile(new File([svg], 'uploaded.svg'), 'picker')
    await expect.element(download).toHaveAttribute('download', 'uploaded.svg')
    if (source === 'demo') {
      await screen.getByText('Demo', { exact: true }).click()
    } else {
      await screen.getByPlaceholder('Paste markup').fill(source)
    }
    await expect.element(download).toHaveAttribute('download', 'image.svg')
  })
})
