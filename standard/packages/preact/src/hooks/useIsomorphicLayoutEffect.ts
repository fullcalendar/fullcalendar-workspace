import { useEffect, useLayoutEffect } from 'react'

// useLayoutEffect, without React 17/18's warning about layout effects when server-side rendering
export const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect
