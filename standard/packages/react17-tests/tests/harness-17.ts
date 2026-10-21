import type { ReactElement } from 'react'
import * as ReactDOM from 'react-dom'
import { act } from 'react-dom/test-utils'

// React 17: a legacy root
export function createHarness(container: HTMLElement) {
  return {
    render(el: ReactElement) {
      act(() => {
        ReactDOM.render(el, container)
      })
    },
    hydrate(el: ReactElement) {
      act(() => {
        ReactDOM.hydrate(el, container)
      })
    },
    unmount() {
      act(() => {
        ReactDOM.unmountComponentAtNode(container)
      })
    },
  }
}

export { act }
