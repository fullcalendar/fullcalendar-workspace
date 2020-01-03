import { htmlToElement, removeElement, computeEdges } from '@fullcalendar/core'


// TODO: assume the el has no borders?
export function getScrollCanvasOrigin(scrollEl: HTMLElement) { // best place for this?
  let rect = scrollEl.getBoundingClientRect()
  let edges = computeEdges(scrollEl) // TODO: pass in isRtl?

  return {
    left: rect.left + edges.borderLeft + edges.scrollbarLeft - getScrollFromLeftEdge(scrollEl),
    top: rect.top + edges.borderTop - scrollEl.scrollTop
  }
}


export function getScrollFromLeftEdge(el: HTMLElement) {
  let val = el.scrollLeft
  let computedStyles = window.getComputedStyle(el) // TODO: pass in isRtl?

  if (computedStyles.direction === 'rtl') {
    switch (getRtlScrollSystem()) {
      case 'negative':
        val = el.scrollWidth - el.clientWidth + val // maxScrollDistance + val
        break
      case 'reverse':
        val = el.scrollWidth - el.clientWidth - val // maxScrollDistance - val
        break
    }
  }

  return val
}


export function getScrollFromLeadingEdge(el: HTMLElement) { // TODO: rename to "starting" edge ... more complient with W3C
  let val = el.scrollLeft
  let computedStyles = window.getComputedStyle(el) // TODO: pass in isRtl?

  if (computedStyles.direction === 'rtl') {
    switch (getRtlScrollSystem()) {
      case 'positive':
        val = el.scrollWidth - el.clientWidth - val // maxScrollDistance - val
        break
      case 'negative':
        val = -val
        break
    }
  }

  return val
}


export function setScrollFromLeadingEdge(el: HTMLElement, val: number) {
  let computedStyles = window.getComputedStyle(el) // TODO: pass in isRtl?

  if (computedStyles.direction === 'rtl') {
    switch (getRtlScrollSystem()) {
      case 'positive':
        val = el.scrollWidth - el.clientWidth - val // maxScrollDistance - val
        break
      case 'negative':
        val = -val
        break
    }
  }

  el.scrollLeft = val
}


// Horizontal Scroll System Detection
// ----------------------------------------------------------------------------------------------

let _rtlScrollSystem

function getRtlScrollSystem() {
  return _rtlScrollSystem || (_rtlScrollSystem = detectRtlScrollSystem())
}

function detectRtlScrollSystem() {
  const el = htmlToElement(`\
<div style=" \
position: absolute; \
top: -1000px; \
width: 1px; \
height: 1px; \
overflow: scroll; \
direction: rtl; \
font-size: 100px; \
">A</div>\
`)
  document.body.appendChild(el)

  let system
  if (el.scrollLeft > 0) {
    system = 'positive' // scroll is a positive number from the left edge
  } else {
    el.scrollLeft = 1
    if (el.scrollLeft > 0) {
      system = 'reverse' // scroll is a positive number from the right edge
    } else {
      system = 'negative' // scroll is a negative number from the right edge
    }
  }

  removeElement(el)
  return system
}

