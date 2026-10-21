import { useContext } from 'react'
import { ViewContext, ViewContextType } from './ViewContext'

/*
The whole view context: the facade over the narrow contexts (useGranularContexts.ts). Prefer a
narrow hook when a component reads only some of it. See planning/hook-toolkit-spec.md §3.2
*/
export function useViewContext(): ViewContext {
  return useContext(ViewContextType)
}
