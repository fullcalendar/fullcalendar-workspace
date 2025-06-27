import { CalendarOptions } from './options.js'
import { DelayedRunner } from './util/DelayedRunner.js'
import { CalendarDataManager } from './reducers/CalendarDataManager.js'
import { Action } from './reducers/Action.js'
import { CalendarData } from './reducers/data-types.js'
import { CalendarRoot } from './component/CalendarRoot.js'
import { CalendarContent, CalendarToolbarProps } from './component/CalendarContent.js'
import { createElement, render, flushSync } from './preact.js'
import { CssDimValue } from './scrollgrid/util.js'
import { applyStyleProp } from './util/dom-manip.js'
import { RenderId } from './content-inject/RenderId.js'
import { CalendarImpl } from './api/CalendarImpl.js'
import { memoize } from './util/memoize.js'
import { DateMarker } from './datelib/marker.js'
import { rangeContainsMarker } from './datelib/date-range.js'
import { DateProfile, DateProfileGenerator } from './DateProfileGenerator.js'
import { ViewSpec } from './structs/view-spec.js'
import { getNow } from './reducers/current-date.js'
import { NavButtonState, ButtonStateMap } from './structs/button-state.js'
import { formatWithOrdinals } from './util/misc.js'

/*
Vanilla JS API
*/
export class Calendar extends CalendarImpl {
  el: HTMLElement

  private buildToolbarProps = memoize(buildToolbarProps)
  private toolbarProps?: CalendarToolbarProps
  private currentData: CalendarData
  private renderRunner: DelayedRunner
  private isRendering = false
  private isRendered = false
  private currentClassName = ''
  private customContentRenderId = 0

  constructor(el: HTMLElement, optionOverrides: CalendarOptions = {}) {
    super()

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

              const toolbarProps = this.toolbarProps = this.buildToolbarProps(
                currentData.viewSpec,
                currentData.dateProfile,
                currentData.dateProfileGenerator,
                currentData.currentDate,
                getNow(currentData.options.now, currentData.dateEnv), // TODO: use NowTimer????
                currentData.viewTitle,
              )

              return (
                <RenderId.Provider value={this.customContentRenderId}>
                  <CalendarContent
                    forPrint={forPrint}
                    toolbarProps={toolbarProps}
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

  /*
  TODO: DRY with toolbar-parse.ts and ToolbarSection
  */
  getButtonState(): ButtonStateMap {
    const { currentData, toolbarProps } = this
    const options = currentData.calendarOptions
    const viewSpecs = currentData.viewSpecs

    const buttonState: ButtonStateMap = {
      today: {
        text: options.todayText,
        hint: options.todayHint as string,
        isDisabled: !toolbarProps.isTodayEnabled,
      } as NavButtonState,

      prev: {
        text: options.prevText,
        hint: options.prevHint as string,
        isDisabled: !toolbarProps.isPrevEnabled,
      } as NavButtonState,

      next: {
        text: options.nextText,
        hint: options.nextHint as string,
        isDisabled: !toolbarProps.isNextEnabled,
      } as NavButtonState,

      prevYear: {
        text: options.prevYearText,
        hint: formatWithOrdinals(options.prevHint, [options.yearText, 'year'], options.prevYearText),
        isDisabled: false,
      } as NavButtonState,

      nextYear: {
        text: options.prevYearText,
        hint: formatWithOrdinals(options.nextHint, [options.yearText, 'year'], options.nextYearText),
        isDisabled: false,
      } as NavButtonState,
    }

    for (const viewSpecName in viewSpecs) {
      const viewSpec = viewSpecs[viewSpecName]
      const buttonTextKey = viewSpec.optionDefaults.buttonTextKey as string

      const buttonText =
        (buttonTextKey ? options[buttonTextKey] : '') ||
        (viewSpec.singleUnit ? options[viewSpec.singleUnit + 'Text'] : '') ||
        viewSpecName

      const buttonHint = formatWithOrdinals(
        options.viewHint,
        [buttonText, viewSpecName], // ordinal arguments
        buttonText, // fallback text
      )

      buttonState[viewSpecName] = {
        text: buttonText,
        hint: buttonHint,
      }
    }

    return buttonState
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

function buildToolbarProps(
  viewSpec: ViewSpec,
  dateProfile: DateProfile,
  dateProfileGenerator: DateProfileGenerator,
  currentDate: DateMarker,
  now: DateMarker,
  title: string,
): CalendarToolbarProps {
  // don't force any date-profiles to valid date profiles (the `false`) so that we can tell if it's invalid
  let todayInfo = dateProfileGenerator.build(now, undefined, false) // TODO: need `undefined` or else INFINITE LOOP for some reason
  let prevInfo = dateProfileGenerator.buildPrev(dateProfile, currentDate, false)
  let nextInfo = dateProfileGenerator.buildNext(dateProfile, currentDate, false)

  return {
    title,
    selectedButton: viewSpec.type,
    navUnit: viewSpec.singleUnit,
    isTodayEnabled: todayInfo.isValid && !rangeContainsMarker(dateProfile.currentRange, now),
    isPrevEnabled: prevInfo.isValid,
    isNextEnabled: nextInfo.isValid,
  }
}
