
/*
NOTE: when you EDIT this file,
you need to stop and restart the watcher,
because depending packages do not label this as a depended-upon TS workspace
*/
export interface ThemeOptionParams {
  primaryClass: string // bg & fg
  primaryPressableClass: string
  primaryPressableGroupClass: string

  secondaryClass: string // bg & fg
  secondaryPressableClass: string

  tertiaryClass: string
  tertiaryPressableClass: string
  tertiaryPressableGroupClass: string

  mutedHoverClass: string
  mutedHoverPressableClass: string
  mutedHoverPressableGroupClass: string

  // strong button-like
  // NOTE: assumed "solid". rename?
  strongSolidPressableClass: string

  // muted button-like
  mutedClass: string
  mutedPressableClass: string

  // faint ghost-button-like
  faintHoverClass: string
  faintHoverPressableClass: string

  primaryOutlineColorClass: string
  tertiaryOutlineColorClass: string
  outlineWidthClass: string
  outlineWidthFocusClass: string
  outlineWidthGroupFocusClass: string
  outlineOffsetClass: string
  outlineInsetClass: string

  mutedBgClass: string // required to be FULLY-transparent!?... best for Shadcn?
  mutedSolidBgClass: string
  faintBgClass: string // required to be semitransparent
  highlightClass: string
  todayBgNotPrintClass: string

  borderColorClass: string
  borderStartColorClass: string
  primaryBorderColorClass: string
  strongBorderColorClass: string
  strongBorderBottomColorClass: string
  mutedBorderColorClass: string
  nowBorderColorClass: string
  nowBorderStartColorClass: string
  nowBorderTopColorClass: string

  eventColor: string
  eventContrastColor: string
  bgEventColor: string
  bgEventBgClass: string

  popoverClass: string
  popoverHeaderClass: string

  bgClass: string
  bgRingColorClass: string

  fgClass: string
  strongFgClass: string
  mutedFgClass: string
  faintFgClass: string

  eventFaintBgClass: string
  eventFaintPressableClass: string
  eventMutedBgClass: string
  eventMutedPressableClass: string
  mutedEventFgClass,
}
