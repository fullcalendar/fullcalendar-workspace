import { ComponentChildren, flushUpdates } from '../preact.js'
import { BaseComponent } from '../vdom-util.js'
import { CalendarOptions, CalendarListeners } from '../options.js'
import { Emitter } from '../common/Emitter.js'
import { CssDimValue } from '../scrollgrid/util.js'
import { updateSizeSync } from '../component-util/resize-observer.js'
import { joinArrayishClassNames } from '../util/html.js'
import { generateClassName } from '../content-inject/ContentContainer.js'
import classNames from '../internal-classnames.js'

export interface CalendarRootProps {
  options: CalendarOptions
  emitter: Emitter<CalendarListeners>
  children: (className: string, height: CssDimValue | undefined, forPrint: boolean) => ComponentChildren
}

interface CalendarRootState {
  forPrint: boolean
}

export class CalendarRoot extends BaseComponent<CalendarRootProps, CalendarRootState> {
  state: CalendarRootState = {
    forPrint: false,
  }

  render() {
    let { props, state } = this
    let { options } = props
    let { forPrint } = state

    // TODO: DRY
    let borderlessX = options.borderlessX ?? options.borderless
    let borderlessTop = options.borderlessTop ?? options.borderless
    let borderlessBottom = options.borderlessBottom ?? options.borderless

    let className = joinArrayishClassNames(
      generateClassName(options.class ?? options.className, {
        // direction: options.direction,
        // mediaType: forPrint ? 'print' : 'screen',
      }),
      borderlessTop && classNames.borderlessTop,
      borderlessBottom && classNames.borderlessBottom,
      borderlessX && classNames.borderlessX,
      classNames.borderBoxRoot,
      classNames.flexCol,
      options.direction === 'ltr' ? classNames.ltrRoot : classNames.rtlRoot,
      forPrint ? classNames.calendarPrintRoot : classNames.calendarScreenRoot,
      (borderlessX || borderlessTop || borderlessBottom) && classNames.noEdgeEffects,
    )

    return props.children(className, options.height, forPrint)
  }

  componentDidMount() {
    let { emitter } = this.props

    emitter.on('_beforeprint', this.handleBeforePrint)
    emitter.on('_afterprint', this.handleAfterPrint)
  }

  componentWillUnmount() {
    let { emitter } = this.props

    emitter.off('_beforeprint', this.handleBeforePrint)
    emitter.off('_afterprint', this.handleAfterPrint)
  }

  handleBeforePrint = () => {
    this.setState({ forPrint: true })
    flushUpdates()
    updateSizeSync()
    flushUpdates()
  }

  handleAfterPrint = () => {
    this.setState({ forPrint: false })
    flushUpdates()
  }
}
