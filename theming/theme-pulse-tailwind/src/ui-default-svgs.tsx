import { Fragment, ReactNode } from 'react'

/*
From https://feathericons.com/
*/

export function chevronDown(className?: string): ReactNode {
  return createSvg(className, <polyline points="6 9 12 15 18 9"></polyline>)
}

export function chevronsLeft(className?: string): ReactNode {
  return createSvg(className, <Fragment><polyline points="11 17 6 12 11 7"></polyline><polyline points="18 17 13 12 18 7"></polyline></Fragment>)
}

export function x(className?: string): ReactNode {
  return createSvg(className, <Fragment><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></Fragment>)
}

function createSvg(className: string | undefined, inner: ReactNode): ReactNode {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{inner}</svg>
  )
}
