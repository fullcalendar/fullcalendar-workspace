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
  isDarkDetected: boolean
}

export class CalendarRoot extends BaseComponent<CalendarRootProps, CalendarRootState> {
  darkDetector = window.matchMedia('(prefers-color-scheme: dark)')
  state: CalendarRootState = {
    forPrint: false,
    isDarkDetected: this.darkDetector.matches,
  }

  render() {
    let { props, state } = this
    let { options } = props
    let { forPrint } = state

    let { colorScheme } = options
    let isExplicitlyLight = colorScheme === 'light'
    let isExplicitlyDark = colorScheme === 'dark'
    let isDark = isExplicitlyDark || (colorScheme === 'auto' && state.isDarkDetected)

    let className = joinArrayishClassNames(
      generateClassName(options.className, {
        direction: options.direction,
        mediaType: forPrint ? 'print' : 'screen',
        colorScheme: isDark ? 'dark' : 'light',
      }),
      isExplicitlyLight && classNames.colorSchemeLight,
      isExplicitlyDark && classNames.colorSchemeDark,
      classNames.borderBoxRoot,
      classNames.flexCol,
      options.direction === 'ltr' ? classNames.ltrRoot : classNames.rtlRoot,
      forPrint ? classNames.calendarPrintRoot : classNames.calendarScreenRoot,
      classNames.internalRoot,
    )

    return props.children(className, options.height, forPrint)
  }

  componentDidMount() {
    let { emitter } = this.props

    emitter.on('_beforeprint', this.handleBeforePrint)
    emitter.on('_afterprint', this.handleAfterPrint)

    this.darkDetector.addEventListener('change', this.handleDarkChange)
  }

  componentWillUnmount() {
    let { emitter } = this.props

    emitter.off('_beforeprint', this.handleBeforePrint)
    emitter.off('_afterprint', this.handleAfterPrint)

    this.darkDetector.removeEventListener('change', this.handleDarkChange)
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

  handleDarkChange = () => {
    this.setState({ isDarkDetected: this.darkDetector.matches })
  }
}
