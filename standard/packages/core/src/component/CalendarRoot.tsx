import { ComponentChildren, flushSync } from '../preact.js'
import { BaseComponent } from '../vdom-util.js'
import { CalendarOptions, CalendarListeners } from '../options.js'
import { Theme } from '../theme/Theme.js'
import { Emitter } from '../common/Emitter.js'
import { CssDimValue } from '../scrollgrid/util.js'

export interface CalendarRootProps {
  options: CalendarOptions
  theme: Theme
  emitter: Emitter<CalendarListeners>
  children: (classNames: string[], height: CssDimValue | undefined, forPrint: boolean) => ComponentChildren
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

    let classNames: string[] = [
      'fc',
      forPrint ? 'fc-media-print' : 'fc-media-screen',
      `fc-direction-${options.direction}`,
      props.theme.getClassName('root'),
    ]

    return props.children(classNames, options.height, forPrint)
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
    flushSync(() => {
      this.setState({ forPrint: true })
    })
  }

  handleAfterPrint = () => {
    flushSync(() => {
      this.setState({ forPrint: false })
    })
  }
}
