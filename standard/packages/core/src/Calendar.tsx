import { CalendarImpl } from './api/CalendarImpl.js'
import { CalendarInner } from './CalendarInner.js'
import { CalendarMediaRoot, computeRootClassName } from './component/CalendarRoot.js'
import { RenderId } from './content-inject/RenderId.js'
import { CalendarOptions } from './options.js'
import { createElement, createRoot, flushSync, StrictMode } from './preact.js'
import { Action } from './reducers/Action.js'
import { CalendarDataManager } from './reducers/CalendarDataManager.js'
import { CalendarData } from './reducers/data-types.js'
import { CssDimValue } from './scrollgrid/util.js'
import { DelayedRunner } from './util/DelayedRunner.js'
import { applyStyleProp } from './util/dom-manip.js'

/*
Vanilla JS API
*/
export class Calendar extends CalendarImpl {
  el: HTMLElement
  private dataManager: CalendarDataManager
  private currentData: CalendarData
  private renderRunner: DelayedRunner
  private vdomRoot: { render: (vdomNode: any) => any, unmount: () => void } // TODO types
  private isRendering = false
  private isRendered = false
  private customContentRenderId = 0
  private currentClassName = ''

  constructor(el: HTMLElement, optionOverrides: CalendarOptions = {}) {
    super()

    this.el = el
    this.vdomRoot = createRoot(el)
    this.renderRunner = new DelayedRunner(this.handleRenderRequest)

    this.dataManager = new CalendarDataManager({
      optionOverrides,
      calendarApi: this,
      onAction: this.handleAction,
      onData: this.handleData,
    })
  }

  private handleAction = (action: Action) => {
    // actions we know we want to render immediately
    switch (action.type) {
      case 'SET_EVENT_DRAG':
      case 'SET_EVENT_RESIZE':
        this.renderRunner.tryDrain()
    }
  }

  private handleData = (data: CalendarData) => {
    this.currentData = data
    this.renderRunner.request(data.calendarOptions.rerenderDelay)
  }

  private handleRenderRequest = () => {
    if (this.isRendering) {
      let { currentData } = this
      this.isRendered = true

      flushSync(() => {
        this.vdomRoot.render(
          <StrictMode>
            <RenderId.Provider value={this.customContentRenderId}>
              <CalendarMediaRoot emitter={currentData.emitter}>
                {(forPrint: boolean) => {
                  const options = currentData.calendarOptions
                  const isRtl = options.direction === 'rtl'
                  const className = computeRootClassName(options, forPrint) // TODO: memoize

                  this.setIsRtl(isRtl)
                  this.setClassName(className)
                  this.setHeight(options.height)

                  return <CalendarInner {...currentData} forPrint={forPrint} />
                }}
              </CalendarMediaRoot>
            </RenderId.Provider>
          </StrictMode>
        )
      })
    } else if (this.isRendered) {
      this.isRendered = false
      this.vdomRoot.unmount()

      this.setIsRtl(false)
      this.setClassName('')
      this.setHeight('')
    }
  }

  render() {
    let wasRendering = this.isRendering

    if (!wasRendering) {
      this.isRendering = true
    } else {
      this.customContentRenderId += 1
    }

    this.renderRunner.request()

    if (wasRendering) {
      this.updateSize()
    }
  }

  destroy(): void {
    if (this.isRendering) {
      this.isRendering = false
      this.renderRunner.request()
    }

    this.dataManager.destroy()
  }

  batchRendering(func): void {
    this.renderRunner.pause('batchRendering')
    func()
    this.renderRunner.resume('batchRendering')
  }

  pauseRendering() { // available to plugins
    this.renderRunner.pause('pauseRendering')
  }

  resumeRendering() { // available to plugins
    this.renderRunner.resume('pauseRendering', true)
  }

  resetOptions(optionOverrides, changedOptionNames?: string[]) {
    this.currentDataManager.resetOptions(optionOverrides, changedOptionNames)
  }

  private setClassName(className: string) {
    if (className !== this.currentClassName) {
      let { classList } = this.el

      for (let singleClassName of this.currentClassName.split(' ')) {
        if (singleClassName) {
          classList.remove(singleClassName)
        }
      }

      for (let singleClassName of className.split(' ')) {
        if (singleClassName) {
          classList.add(singleClassName)
        }
      }

      this.currentClassName = className
    }
  }

  private setHeight(height: CssDimValue) {
    applyStyleProp(this.el, 'height', height)
  }

  private setIsRtl(isRtl: boolean) {
    if (isRtl) {
      this.el.dir = 'rtl'
    } else {
      this.el.removeAttribute('dir')
    }
  }
}
