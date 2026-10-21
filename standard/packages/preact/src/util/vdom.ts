import { memo, type FunctionComponent, type Ref } from 'react'
import { isPropsEqualWithMap } from './object'

export type EqualityFunc<T> = (a: T, b: T) => boolean
export type EqualityFuncs<P> = {
  [K in keyof P]?: EqualityFunc<P[K]>
}

// use other one
export function setRef<RefType>(ref: Ref<RefType> | void, current: RefType) {
  if (typeof ref === 'function') {
    ref(current)
  } else if (ref) {
    // see https://github.com/facebook/react/issues/13029
    (ref as any).current = current
  }
}

/*
memo() with per-prop equality functions. Other props compare by identity. See planning/hook-toolkit-spec.md §3.1
*/
export function memoWithEquality<Props>(
  component: FunctionComponent<Props>,
  propEquality: EqualityFuncs<Props>,
) {
  return memo(component, (prevProps, nextProps) => isPropsEqualWithMap(prevProps, nextProps, propEquality as any))
}
