
/*
NOTE: when you EDIT this file,
you need to stop and restart the watcher,
because depending packages do not label this as a depended-upon TS workspace
*/
export interface ThemeOptionParams {
  // outline
  outlineWidthClass: string
  outlineWidthFocusClass: string
  outlineWidthGroupFocusClass: string
  outlineOffsetClass: string
  outlineInsetClass: string
  primaryOutlineColorClass: string
  tertiaryOutlineColorClass: string

  // neutral backgrounds
  bgClass: string
  bgRingColorClass: string
  mutedBgClass: string
  mutedSolidBgClass: string
  faintBgClass: string

  // neutral foregrounds
  fgClass: string
  strongFgClass: string
  mutedFgClass: string
  mutedFgHoverClass: string
  mutedFgBorderColorClass: string
  faintFgClass: string

  // neutral borders
  borderColorClass: string
  borderStartColorClass: string
  strongBorderColorClass: string
  strongBorderBottomColorClass: string
  mutedBorderColorClass: string

  // strong *button*
  strongSolidPressableClass: string

  // muted *button*
  mutedClass: string // bg & fg
  mutedPressableClass: string

  // muted-on-hover
  mutedHoverClass: string
  mutedHoverPressableClass: string
  mutedHoverPressableGroupClass: string

  // faint-on-hover
  faintHoverClass: string
  faintHoverPressableClass: string

  // popover
  popoverClass: string
  popoverHeaderClass: string

  // primary
  primaryClass: string // bg & fg
  primaryBorderColorClass: string
  primaryPressableClass: string
  primaryPressableGroupClass: string

  // secondary
  secondaryClass: string // bg & fg
  secondaryPressableClass: string

  // tertiary
  tertiaryClass: string // bg & fg
  tertiaryPressableClass: string
  tertiaryPressableGroupClass: string

  // event content
  eventColor: string
  eventContrastColor: string
  eventMutedBgClass: string
  eventMutedPressableClass: string
  eventMutedFgClass: string
  eventFaintBgClass: string
  eventFaintPressableClass: string
  bgEventColor: string
  bgEventBgClass: string

  // misc calendar content
  highlightClass: string
  todayBgNotPrintClass: string
  nowBorderColorClass: string
  nowBorderStartColorClass: string
  nowBorderTopColorClass: string
}
