import { useContext } from 'react'
import { ViewContext, ViewContextType } from '../ViewContext'

/*
The same object class components get as `this.context`. Phase 11 splits the context behind this.
See planning/hook-toolkit-spec.md §3.2
*/
export function useViewContext(): ViewContext {
  return useContext(ViewContextType)
}
