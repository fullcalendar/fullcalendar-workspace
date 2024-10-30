import { Dictionary } from '../options.js'

export function removeElement(el: HTMLElement) { // removes nodes in addition to elements. bad name
  if (el.parentNode) {
    el.parentNode.removeChild(el)
  }
}

// Querying
// ----------------------------------------------------------------------------------------------------------------

// accepts multiple subject els
// returns a real array. good for methods like forEach
// TODO: accept the document
export function findElements(container: HTMLElement[] | HTMLElement | NodeListOf<HTMLElement>, selector: string): HTMLElement[] {
  let containers = container instanceof HTMLElement ? [container] : container
  let allMatches: HTMLElement[] = []

  for (let i = 0; i < containers.length; i += 1) {
    let matches = containers[i].querySelectorAll(selector)

    for (let j = 0; j < matches.length; j += 1) {
      allMatches.push(matches[j] as HTMLElement)
    }
  }

  return allMatches
}

// accepts multiple subject els
// only queries direct child elements // TODO: rename to findDirectChildren!
export function findDirectChildren(parent: HTMLElement[] | HTMLElement, selector?: string): HTMLElement[] {
  let parents = parent instanceof HTMLElement ? [parent] : parent
  let allMatches = []

  for (let i = 0; i < parents.length; i += 1) {
    let childNodes = parents[i].children // only ever elements

    for (let j = 0; j < childNodes.length; j += 1) {
      let childNode = childNodes[j]

      if (!selector || (childNode as HTMLElement).matches(selector)) {
        allMatches.push(childNode)
      }
    }
  }

  return allMatches
}

// Style
// ----------------------------------------------------------------------------------------------------------------

const PIXEL_PROP_RE = /(top|left|right|bottom|width|height)$/i

export function applyStyle(el: HTMLElement, props: Dictionary) {
  for (let propName in props) {
    applyStyleProp(el, propName, props[propName])
  }
}

export function applyStyleProp(el: HTMLElement, name: string, val) {
  if (val == null) {
    el.style[name] = ''
  } else if (typeof val === 'number' && PIXEL_PROP_RE.test(name)) {
    el.style[name] = `${val}px`
  } else {
    el.style[name] = val
  }
}

// Event Handling
// ----------------------------------------------------------------------------------------------------------------

// if intercepting bubbled events at the document/window/body level,
// and want to see originating element (the 'target'), use this util instead
// of `ev.target` because it goes within web-component boundaries.
export function getEventTargetViaRoot(ev: Event) {
  return ev.composedPath?.()[0] ?? ev.target
}

// Unique ID for DOM attribute

let guid = 0

export function getUniqueDomId() {
  guid += 1
  return 'fc-dom-' + guid
}
