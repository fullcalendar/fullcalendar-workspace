import { View, Theme, DateEnv, isArraysEqual } from 'fullcalendar'

export default class SimpleComponent<PropsType> {

  props: PropsType | null // non-null signals that a render happened
  renderArgs: { [renderMethodName: string]: any[] } // also indicates if rendered
  unrenderMethodNames: Map<string, string> = new Map()
  queuedSizeMethodNames: Map<string, string> = new Map()

  // context vars
  view: View
  dateEnv: DateEnv
  theme: Theme
  isRtl: boolean

  constructor(view: View) {
    this.view = view
    this.dateEnv = view.getDateEnv()
    this.theme = view.getTheme()
    this.isRtl = this.opt('dir') === 'rtl'
  }

  opt(name) {
    return this.view.opt(name)
  }

  receiveProps(props: PropsType) {
    if (!this.props || !isKeysEqual(this.props, props)) {

      if (this.props) {
        this.unrender()
      }

      this.props = props
      this.render(props)
    }
  }

  protected render(props: PropsType) {
  }

  unrender() {
  }

  subrender(renderMethodName, args, unrenderMethodName?, afterRenderMethodName?) {
    let { renderArgs } = this
    let prevArgs = renderArgs[renderMethodName]

    if (!prevArgs || !isArraysEqual(prevArgs, args)) {

      if (prevArgs && unrenderMethodName) {
        this[unrenderMethodName]()
      }

      this[renderMethodName].apply(this, args)
      renderArgs[renderMethodName] = args

      // for destroy
      if (unrenderMethodName) {
        this.unrenderMethodNames.set(renderMethodName, unrenderMethodName)
      }

      if (afterRenderMethodName) {
        this.queuedSizeMethodNames.set(renderMethodName, afterRenderMethodName)
      }
    }
  }

  updateSize() {
    this.queuedSizeMethodNames.forEach((sizeMethodName) => {
      this[sizeMethodName]()
    })
    this.queuedSizeMethodNames = new Map()
  }

  destroy() {
    if (this.props) {
      this.unrender()
    }

    let methodNames = [] // in reverse
    this.unrenderMethodNames.forEach(function(methodName) {
      methodNames.unshift(methodName)
    })

    for (let methodName in methodNames) {
      this[methodName]()
    }
  }

  // stupid

  getDayClasses(dateMarker, noThemeHighlight?) {
    return this.view.getDayClasses(dateMarker, noThemeHighlight)
  }

}

// TODO: move to utils

function isKeysEqual(obj0, obj1): boolean {
  for (let key in obj0) {
    if (obj0[key] !== obj1[key]) {
      return false
    }
  }

  for (let key in obj1) {
    if (!(key in obj0)) {
      return false
    }
  }

  return true
}
