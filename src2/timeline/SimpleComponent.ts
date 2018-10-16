import { View, DateEnv, Theme } from 'fullcalendar'

export default class SimpleComponent {

  view: View
  isRtl: boolean

  constructor(view: View) {
    this.view = view
    this.isRtl = this.opt('dir') === 'rtl'
    this.init()
  }

  init() {
  }

  opt(name) {
    return this.view.opt(name)
  }

  getDateEnv(): DateEnv {
    return this.view.getDateEnv()
  }

  getTheme(): Theme {
    return this.view.getTheme()
  }

  getDayClasses(dateMarker, noThemeHighlight?) { // gahh
    return this.view.getDayClasses(dateMarker, noThemeHighlight)
  }

}
