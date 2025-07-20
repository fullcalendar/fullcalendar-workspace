import { createElement, Fragment } from '@fullcalendar/core/preact'

/*
From https://feathericons.com/
*/

export function chevronLeft(className?: string) {
  return svgIcon(className, <polyline points="15 18 9 12 15 6"></polyline>)
}

// TODO: just use rotate?
export function chevronRight(className?: string) {
  return svgIcon(className, <polyline points="9 18 15 12 9 6"></polyline>)
}

export function chevronsLeft(className?: string) {
  return svgIcon(className, <Fragment><polyline points="11 17 6 12 11 7"></polyline><polyline points="18 17 13 12 18 7"></polyline></Fragment>)
}

// TODO: just use rotate?
export function chevronsRight(className?: string) {
  return svgIcon(className, <Fragment><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></Fragment>)
}

export function x(className?: string) {
  return svgIcon(className, <Fragment><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></Fragment>)
}

export function plusSquare(className?: string) {
  return svgIcon(className, <Fragment><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></Fragment>)
}

export function minusSquare(className?: string) {
  return svgIcon(className, <Fragment><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="8" y1="12" x2="16" y2="12"></line></Fragment>)
}

function svgIcon(className = '', inner: any) {
  return (
    // removed useless class=""
    <svg xmlns="http://www.w3.org/2000/svg" className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{inner}</svg>
  )
}
