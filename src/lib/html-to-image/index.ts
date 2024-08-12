import { applyStyle } from './apply-style'
import { cloneNode } from './clone-node'
import { embedImages } from './embed-images'
import { embedWebFonts, getWebFontCSS } from './embed-webfonts'
import type { Options } from './types'
import {
  canvasToBlob,
  checkCanvasDimensions,
  createImage,
  getImageSize,
  getPixelRatio,
  nodeToDataURL,
  nodeToSvgElement,
} from './util'

export async function toSvg(
  node: HTMLElement,
  options: Options = {}
): Promise<string> {
  const { width, height } = getImageSize(node, options)
  const clonedNode = (await cloneNode(node, options, true)) as HTMLElement
  if (options.class) {
    node.classList.remove(...options.class)
  }
  await embedWebFonts(node, clonedNode, options)
  await embedImages(clonedNode, options)
  applyStyle(clonedNode, options)
  const datauri = await nodeToDataURL(clonedNode, width, height)
  return datauri
}

export async function toSvgElement(
  node: HTMLElement,
  options: Options = {}
) {
  const { width, height } = getImageSize(node, options)
  const clonedNode = (await cloneNode(node, options, true)) as HTMLElement
  if (options.class) {
    node.classList.remove(...options.class)
  }
  await embedWebFonts(node, clonedNode, options)
  await embedImages(clonedNode, options)
  applyStyle(clonedNode, options)
  const svg = nodeToSvgElement(clonedNode, width, height)
  return svg
}

export async function toCanvas(
  node: HTMLElement,
  options: Options = {}
): Promise<HTMLCanvasElement> {
  if (options.class) {
    node.classList.add(...options.class)
  }
  const { width, height } = getImageSize(node, options)
  const svg = await toSvg(node, { ...options, width, height })
  const img = await createImage(svg)

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')!
  const ratio = options.pixelRatio || getPixelRatio()
  const canvasWidth = options.canvasWidth || width
  const canvasHeight = options.canvasHeight || height

  canvas.width = canvasWidth * ratio
  canvas.height = canvasHeight * ratio

  if (!options.skipAutoScale) {
    checkCanvasDimensions(canvas)
  }
  canvas.style.width = `${canvasWidth}`
  canvas.style.height = `${canvasHeight}`

  if (options.backgroundColor) {
    context.fillStyle = options.backgroundColor
    context.fillRect(0, 0, canvas.width, canvas.height)
  }

  context.drawImage(img, 0, 0, canvas.width, canvas.height)

  return canvas
}

export async function toPixelData(
  node: HTMLElement,
  options: Options = {}
): Promise<Uint8ClampedArray> {
  const { width, height } = getImageSize(node, options)
  const canvas = await toCanvas(node, options)
  const ctx = canvas.getContext('2d')!
  return ctx.getImageData(0, 0, width, height).data
}

export async function toPng(
  node: HTMLElement,
  options: Options = {}
): Promise<string> {
  const canvas = await toCanvas(node, options)
  return canvas.toDataURL()
}

export async function toJpeg(
  node: HTMLElement,
  options: Options = {}
): Promise<string> {
  const canvas = await toCanvas(node, options)
  return canvas.toDataURL('image/jpeg', options.quality || 1)
}

export async function toBlob(
  node: HTMLElement,
  options: Options = {}
): Promise<Blob | null> {
  const canvas = await toCanvas(node, options)
  const blob = await canvasToBlob(canvas)
  return blob
}

export function getFontEmbedCSS(
  node: HTMLElement,
  options: Options = {}
): Promise<string> {
  return getWebFontCSS(node, options)
}
