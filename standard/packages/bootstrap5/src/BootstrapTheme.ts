import { Theme } from '@fullcalendar/core/internal'

export class BootstrapTheme extends Theme {
}

BootstrapTheme.prototype.classes = {
}

BootstrapTheme.prototype.baseIconClass = 'bi' // TODO: kill
BootstrapTheme.prototype.iconClasses = {
  close: 'bi-x-lg',
  prev: 'bi-chevron-left',
  next: 'bi-chevron-right',
  prevYear: 'bi-chevron-double-left',
  nextYear: 'bi-chevron-double-right',
}
BootstrapTheme.prototype.rtlIconClasses = {
  prev: 'bi-chevron-right',
  next: 'bi-chevron-left',
  prevYear: 'bi-chevron-double-right',
  nextYear: 'bi-chevron-double-left',
}

/*
Allows: {
  buttonIcons: {
    next: 'chevron-left' // -> 'bi-chevron-left
  },
  customButtons: {
    somethingCool: {
      icon: 'chevron-right' // -> 'bi-chevron-right
    }
  }
}
*/
BootstrapTheme.prototype.iconOverrideOption = 'buttonIcons' // TODO: make TS-friendly
BootstrapTheme.prototype.iconOverrideCustomButtonOption = 'icon'
BootstrapTheme.prototype.iconOverridePrefix = 'bi-'

export { Theme }
