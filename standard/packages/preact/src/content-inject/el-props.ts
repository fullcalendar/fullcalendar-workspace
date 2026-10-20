import type { CSSProperties, Ref } from 'react'

export type ElRef = Ref<HTMLElement>

// TODO: would want more specificity, but React and Preact can't agree on HTMLAttributes
export type ElAttrs = { ref?: ElRef } & Record<string, any>

export interface ElAttrsProps {
  attrs?: ElAttrs
  className?: string
  style?: CSSProperties & Record<string, any> // React's types don't allow custom props?
  elRef?: ElRef
}

export interface ElProps extends ElAttrsProps {
  tag: string
}
