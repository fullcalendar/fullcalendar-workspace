import { createElement, ComponentChild } from '@fullcalendar/core/preact'

/*
From https://fonts.google.com/icons
TODO: move to using 24px size somehow?
*/

export function chevronDown(className?: string): ComponentChild {
  return createSvg(className, <path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z"/>)
}

export function chevronDoubleLeft(className?: string): ComponentChild {
  return createSvg(className, <path d="M440-240 200-480l240-240 56 56-183 184 183 184-56 56Zm264 0L464-480l240-240 56 56-183 184 183 184-56 56Z"/>)
}

export function x(className?: string): ComponentChild {
  return createSvg(className, <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/>)
}

function createSvg(className: string | undefined, inner: ComponentChild): ComponentChild {
  return <svg xmlns="http://www.w3.org/2000/svg" className={className} width="24" height="24" viewBox="0 -960 960 960" fill="currentColor">{inner}</svg>
}
