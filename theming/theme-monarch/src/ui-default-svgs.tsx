import { createElement, ComponentChild } from '@fullcalendar/core/preact'

/*
From https://fonts.google.com/icons (24px)
Originally 24px, but cropped to 20px in center of viewBox
For chevrons, search for "keyboard arrow..."
*/

export function chevronDown(className?: string): ComponentChild {
  // manually shifted all absolute Y coordinates by +40 to better center
  return createSvg(className, <path d="M480-304 240-544l56-56 184 184 184-184 56 56-240 240Z"/>)
}

export function chevronDoubleLeft(className?: string): ComponentChild {
  return createSvg(className, <path d="M440-240 200-480l240-240 56 56-183 184 183 184-56 56Zm264 0L464-480l240-240 56 56-183 184 183 184-56 56Z"/>)
}

// TODO: undo the size bump for this... X is too big
export function x(className?: string): ComponentChild {
  return createSvg(className, <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/>)
}

function createSvg(className: string | undefined, inner: ComponentChild): ComponentChild {
  return <svg xmlns="http://www.w3.org/2000/svg" className={className} width="20" height="20" viewBox="80 -880 800 800" fill="currentColor">{inner}</svg>
}
