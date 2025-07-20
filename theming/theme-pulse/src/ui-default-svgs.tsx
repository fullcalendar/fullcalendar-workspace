import { createElement } from '@fullcalendar/core/preact'

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

function svgIcon(className = '', inner: any) {
  return (
    // removed useless class=""
    <svg xmlns="http://www.w3.org/2000/svg" className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{inner}</svg>
  )
}
