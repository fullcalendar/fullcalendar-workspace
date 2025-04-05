import { Theme } from '@fullcalendar/core/internal'

class BootstrapTheme extends Theme {
}

BootstrapTheme.prototype.classes = {
  buttonGroup: 'btn-group',
  button: 'btn btn-primary',
  buttonActive: 'active',
  popover: 'popover',
  popoverHeader: 'popover-header',
  popoverContent: 'popover-body',
}

BootstrapTheme.prototype.baseIconClass = 'fa'
BootstrapTheme.prototype.iconClasses = {
  close: 'fa-times',
  prev: 'fa-chevron-left',
  next: 'fa-chevron-right',
  prevYear: 'fa-angle-double-left',
  nextYear: 'fa-angle-double-right',
}
BootstrapTheme.prototype.rtlIconClasses = {
  prev: 'fa-chevron-right',
  next: 'fa-chevron-left',
  prevYear: 'fa-angle-double-right',
  nextYear: 'fa-angle-double-left',
}

BootstrapTheme.prototype.iconOverrideOption = 'bootstrapFontAwesome' // TODO: make TS-friendly. move the option-processing into this plugin
BootstrapTheme.prototype.iconOverrideCustomButtonOption = 'bootstrapFontAwesome'
BootstrapTheme.prototype.iconOverridePrefix = 'fa-'

export { BootstrapTheme }
