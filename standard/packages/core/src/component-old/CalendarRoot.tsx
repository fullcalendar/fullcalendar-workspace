import { ComponentChildren, flushSync } from '../preact.js'
import { BaseComponent } from '../vdom-util.js'
import { CssDimValue, getIsHeightAuto } from '../scrollgrid/util.js'
import { CalendarOptions, CalendarListeners } from '../options.js'
import { Theme } from '../theme/Theme.js'
import { getCanVGrowWithinCell } from '../util/table-styling.js'
import { Emitter } from '../common/Emitter.js'

export interface CalendarRootProps {
  options: CalendarOptions
  theme: Theme
  emitter: Emitter<CalendarListeners>
  children: (classNames: string[], height: CssDimValue, forPrint: boolean) => ComponentChildren
}

interface CalendarRootState {
  forPrint: boolean
}

export class CalendarRoot extends BaseComponent<CalendarRootProps, CalendarRootState> {
  state = {
    forPrint: false,
  }

  render() {
    let { props } = this
    let { options } = props
    let { forPrint } = this.state

    options.height
    options.viewHeight

    let isHeightAuto = forPrint || getIsHeightAuto(options)
    let height = (!isHeightAuto && options.height != null) ? options.height : ''
    // ^TODO: kill height, makes no sense when using flex parents

    let classNames: string[] = [
      'fc',
      forPrint ? 'fc-media-print' : 'fc-media-screen',
      `fc-direction-${options.direction}`,
      props.theme.getClass('root'),
    ]

    if (!getCanVGrowWithinCell()) {
      classNames.push('fc-liquid-hack')
    }

    return props.children(classNames, height, forPrint)
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
