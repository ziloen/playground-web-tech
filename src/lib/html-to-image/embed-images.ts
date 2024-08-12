import { isDataUrl, resourceToDataURL } from './dataurl'
import { embedResources } from './embed-resources'
import { getMimeType } from './mimes'
import type { Options } from './types'
import { isInstanceOfElement, toArray } from './util'

async function embedProp(propName: string, node: HTMLElement, options: Options) {
  const propValue = node.style?.getPropertyValue(propName)
  if (propValue) {
    const cssString = await embedResources(propValue, null, options)
    node.style.setProperty(propName, cssString, node.style.getPropertyPriority(propName))
    return true
  }
  return false
}

async function embedBackground(clonedNode: HTMLElement, options: Options) {
  if (!(await embedProp('background', clonedNode, options))) {
    await embedProp('background-image', clonedNode, options)
  }
  if (!(await embedProp('mask', clonedNode, options))) {
    await embedProp('mask-image', clonedNode, options)
  }
}

async function embedImageNode(
  clonedNode: HTMLElement | SVGImageElement,
  options: Options
) {
  const isImageElement = isInstanceOfElement(clonedNode, HTMLImageElement)

  // src is empty string or unset
  if (isImageElement && clonedNode.src === location.href) {
    return
  }

  if (
    !(isImageElement && !isDataUrl(clonedNode.src))
    && !(isInstanceOfElement(clonedNode, SVGImageElement) && !isDataUrl(clonedNode.href.baseVal))
  ) {
    return
  }

  const url = isImageElement ? clonedNode.src : clonedNode.href.baseVal

  const dataURL = await resourceToDataURL(url, getMimeType(url), options)
  await new Promise((resolve, reject) => {
    clonedNode.onerror = reject

    if (isImageElement) {
      if (clonedNode.loading === 'lazy') {
        clonedNode.loading = 'eager'
      }

      clonedNode.srcset = ''
      clonedNode.src = dataURL

      // `src` should be set before calling `decode`
      if (clonedNode.decode) {
        clonedNode.decode().then(resolve)
      } else {
        clonedNode.onload = resolve
      }
    } else {
      clonedNode.onload = resolve
      clonedNode.href.baseVal = dataURL
    }
  })
}

async function embedChildren(clonedNode: HTMLElement, options: Options) {
  const children = toArray<HTMLElement>(clonedNode.childNodes)
  const deferreds = children.map((child) => embedImages(child, options))
  await Promise.all(deferreds).then(() => clonedNode)
}

export async function embedImages(clonedNode: HTMLElement, options: Options) {
  if (isInstanceOfElement(clonedNode, Element)) {
    await embedBackground(clonedNode, options)
    await embedImageNode(clonedNode, options)
    await embedChildren(clonedNode, options)
  }
}
