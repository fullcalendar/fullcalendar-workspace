
export function flushUpdates(): void {
  // not possible
}

export const preactOptions: any = {}

export {
  type ReactElement as VNode,
  type ComponentType,
  type ReactNode as ComponentChild,
  type ReactNode as ComponentChildren,
  type Context,
  type Ref,
  type RefObject,
  type CSSProperties,
  Component,
  createElement,
  createContext,
  createRef,
  Fragment,
  isValidElement,
  FC as FunctionalComponent,
  // StrictMode,
} from 'react'

export {
  createPortal,
  flushSync,
} from 'react-dom'

export {
  createRoot,
} from 'react-dom/client'

// TODO: ensure this doesn't make it to build-time
// Fixes JSX in other packages, which relies on global JSX namespace
import type { JSX as ReactJSX } from 'react'
declare global {
  namespace JSX {
    interface IntrinsicElements extends ReactJSX.IntrinsicElements {}
    interface IntrinsicAttributes extends ReactJSX.IntrinsicAttributes {}
    interface IntrinsicClassAttributes<T> extends ReactJSX.IntrinsicClassAttributes<T> {}
  }
}

export const strictModeFactor = 2
