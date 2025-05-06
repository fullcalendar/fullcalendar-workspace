import { CalendarOptions } from './options.js'
import { DelayedRunner } from './util/DelayedRunner.js'
import { CalendarDataManager } from './reducers/CalendarDataManager.js'
import { Action } from './reducers/Action.js'
import { CalendarData } from './reducers/data-types.js'
import { CalendarRoot } from './component/CalendarRoot.js'
import { CalendarContent } from './component/CalendarContent.js'
import { createElement, render, flushSync } from './preact.js'
import { CssDimValue } from './scrollgrid/util.js'
import { applyStyleProp } from './util/dom-manip.js'
import { RenderId } from './content-inject/RenderId.js'
import { CalendarImpl } from './api/CalendarImpl.js'

/*
Vanilla JS API
*/
export class Calendar extends CalendarImpl {
  el: HTMLElement

  private currentData: CalendarData
  private renderRunner: DelayedRunner
  private isRendering = false
  private isRendered = false
  private currentClassName = ''
  private customContentRenderId = 0

  constructor(el: HTMLElement, optionOverrides: CalendarOptions = {}) {
    super()
    // ensureElHasStyles(el)

    this.el = el
    this.renderRunner = new DelayedRunner(this.handleRenderRequest)

    new CalendarDataManager({ // eslint-disable-line no-new
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
      this.isRendered = true
      let { currentData } = this

      flushSync(() => {
        render(
          <CalendarRoot options={currentData.calendarOptions} emitter={currentData.emitter}>
            {(className: string, height: number, forPrint: boolean) => {
              this.setClassName(className)
              this.setHeight(height)

              return (
                <RenderId.Provider value={this.customContentRenderId}>
                  <CalendarContent
                    forPrint={forPrint}
                    {...currentData}
                  />
                </RenderId.Provider>
              )
            }}
          </CalendarRoot>,
          this.el,
        )
      })
    } else if (this.isRendered) {
      this.isRendered = false
      render(null, this.el)

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
}
