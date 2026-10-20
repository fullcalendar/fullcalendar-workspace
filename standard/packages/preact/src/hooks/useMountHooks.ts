import { type RefObject, useLayoutEffect } from 'react'
import { DidMountHandler, WillUnmountHandler } from '../common/render-hook'
import { useLatest } from './useLatest'

/*
Calls a render hook's *DidMount/*WillUnmount for an element. Runs in a layout effect, after the
component's children have run theirs, so content a child <CustomContent> appends is already inside
the element. Call it after any hook whose layout effect it depends on. Remounts from Strict Mode and
<Activity> call willUnmount then didMount again. See planning/hook-toolkit-spec.md §6.2
*/
export function useMountHooks<RenderProps>(
  elRef: RefObject<HTMLElement | null>,
  didMount: DidMountHandler<RenderProps> | undefined,
  willUnmount: WillUnmountHandler<RenderProps> | undefined,
  renderProps: RenderProps,
): void {
  const latestRef = useLatest({ didMount, willUnmount, renderProps })

  useLayoutEffect(() => {
    // captured, because React might have detached the ref by cleanup time
    const el = elRef.current

    if (el) {
      const { didMount, renderProps } = latestRef.current
      didMount?.({ ...renderProps, el })
    }

    return () => {
      const { willUnmount, renderProps } = latestRef.current
      willUnmount?.({ ...renderProps, el })
    }
  }, [])
}
