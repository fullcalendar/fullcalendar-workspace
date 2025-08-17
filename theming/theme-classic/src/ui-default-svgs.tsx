import { createElement, Fragment, ComponentChild } from '@fullcalendar/core/preact'

/*
From https://feathericons.com/
*/

export function chevronLeft(className?: string): ComponentChild {
  return createSvg(className, <polyline points="15 18 9 12 15 6"></polyline>)
}

export function chevronsLeft(className?: string): ComponentChild {
  return createSvg(className, <Fragment><polyline points="11 17 6 12 11 7"></polyline><polyline points="18 17 13 12 18 7"></polyline></Fragment>)
}

export function x(className?: string): ComponentChild {
  return createSvg(className, <Fragment><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></Fragment>)
}

export function plusSquare(className?: string): ComponentChild {
  return createSvg(className, <Fragment><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></Fragment>)
}

export function minusSquare(className?: string): ComponentChild {
  return createSvg(className, <Fragment><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="8" y1="12" x2="16" y2="12"></line></Fragment>)
}

function createSvg(className: string | undefined, inner: ComponentChild): ComponentChild {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{inner}</svg>
  )
}
