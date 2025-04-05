import { ComponentChildren, flushUpdates } from '../preact.js'
import { BaseComponent } from '../vdom-util.js'
import { CalendarOptions, CalendarListeners } from '../options.js'
import { Theme } from '../theme/Theme.js'
import { Emitter } from '../common/Emitter.js'
import { CssDimValue } from '../scrollgrid/util.js'
import { updateSizeSync } from '../component-util/resize-observer.js'
import { joinArrayishClassNames } from '../util/html.js'
import { generateClassName } from '../content-inject/ContentContainer.js'

export interface CalendarRootProps {
  options: CalendarOptions
  theme: Theme
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

    let className = joinArrayishClassNames(
      options.classNames,
      generateClassName(options.directionClassNames, options.direction),
      generateClassName(options.mediaTypeClassNames, forPrint ? 'print' : 'screen'),
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
