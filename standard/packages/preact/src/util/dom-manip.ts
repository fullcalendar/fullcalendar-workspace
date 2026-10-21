import { preventDefault } from './dom-event'
import classNames from '../styles.module.css'
import { Dictionary } from './object'

export function getAppendableRoot(el: HTMLElement): Node {
  const root = el.getRootNode()
  if (root instanceof Document) {
    return root.body || root.documentElement // pick body if available
  }
  return root
}

export function computeElIsRtl(el: HTMLElement): boolean {
  return getComputedStyle(el).direction === 'rtl'
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

// Cursor, selection, context menu (during drags)
// ----------------------------------------------------------------------------------------------------------------

// Make the mouse cursor express that an event is not allowed in the current area
export function disableCursor() {
  document.body.classList.add(classNames.notAllowed)
}

// Returns the mouse cursor to its original look
export function enableCursor() {
  document.body.classList.remove(classNames.notAllowed)
}

/* Selection
----------------------------------------------------------------------------------------------------------------------*/

export function preventSelection(el: HTMLElement) {
  el.style.userSelect = 'none'
  el.style.webkitUserSelect = 'none'
  el.addEventListener('selectstart', preventDefault)
}

export function allowSelection(el: HTMLElement) {
  el.style.userSelect = ''
  el.style.webkitUserSelect = ''
  el.removeEventListener('selectstart', preventDefault)
}

/* Context Menu
----------------------------------------------------------------------------------------------------------------------*/

export function preventContextMenu(el: HTMLElement) {
  el.addEventListener('contextmenu', preventDefault)
}

export function allowContextMenu(el: HTMLElement) {
  el.removeEventListener('contextmenu', preventDefault)
}

/* Object Ordering by Field
----------------------------------------------------------------------------------------------------------------------*/
