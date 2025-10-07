
export interface ThemeOptionParams {
  primaryClass: string // bg & fg
  primaryPressableClass: string

  secondaryClass: string // bg & fg
  secondaryPressableClass: string

  tertiaryClass: string
  tertiaryPressableClass: string
  tertiaryPressableGroupClass: string

  ghostHoverClass: string
  ghostPressableClass: string
  ghostPressableGroupClass: string

  // strong button-like
  strongClass: string
  strongPressableClass: string

  // muted button-like
  mutedClass: string
  mutedPressableClass: string

  // faint ghost-button-like
  faintHoverClass: string
  faintPressableClass: string

  // outline utilities. not already used in (secondary/tertiary/ghost)Pressable
  focusOutlineClass: string
  focusOutlineGroupClass: string
  selectedOutlineClass: string

  strongBgClass: string
  mutedBgClass: string // required to be FULLY-transparent!?... best for Shadcn?
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
  bgEventColorClass: string

  popoverClass: string

  bgClass: string
  bgOutlineColorClass: string

  fgClass: string
  strongFgClass: string
  mutedFgClass: string
  faintFgClass: string
}
