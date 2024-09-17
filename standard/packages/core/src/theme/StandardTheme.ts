import { Theme } from './Theme.js'

export class StandardTheme extends Theme {
}

StandardTheme.prototype.classes = {
  root: 'fcnew-theme-standard', // TODO: compute this off of registered theme name
  tableCellShaded: 'fcnew-cell-shaded',
  buttonGroup: 'fcnew-button-group',
  button: 'fcnew-button fcnew-button-primary',
  buttonActive: 'fcnew-button-active',
}

StandardTheme.prototype.baseIconClass = 'fcnew-icon'
StandardTheme.prototype.iconClasses = {
  close: 'fcnew-icon-x',
  prev: 'fcnew-icon-chevron-left',
  next: 'fcnew-icon-chevron-right',
  prevYear: 'fcnew-icon-chevrons-left',
  nextYear: 'fcnew-icon-chevrons-right',
}
StandardTheme.prototype.rtlIconClasses = {
  prev: 'fcnew-icon-chevron-right',
  next: 'fcnew-icon-chevron-left',
  prevYear: 'fcnew-icon-chevrons-right',
  nextYear: 'fcnew-icon-chevrons-left',
}

StandardTheme.prototype.iconOverrideOption = 'buttonIcons' // TODO: make TS-friendly
StandardTheme.prototype.iconOverrideCustomButtonOption = 'icon'
StandardTheme.prototype.iconOverridePrefix = 'fcnew-icon-'
