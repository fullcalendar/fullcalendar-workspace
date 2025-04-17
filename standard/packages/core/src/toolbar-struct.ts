import { ClassNamesGenerator, CustomContentGenerator } from './common/render-hook.js'

export interface ToolbarModel {
  sectionWidgets: {
    start: ToolbarWidget[][]
    center: ToolbarWidget[][]
    end: ToolbarWidget[][]
  }
  viewsWithButtons: string[]
  hasTitle: boolean
}

/*
viewOrUnitName:
- if a view-button, the viewName like "dayGridWeek"
- if an api-method, like prev/next, the current view's unit, like "week"
*/

// Info for internal rendering
export interface ToolbarWidget {
  name: string
  isView?: boolean
  buttonClassNames?: ClassNamesGenerator<ButtonArg>
  buttonText?: string
  buttonHint?: string | ((currentUnit: string) => string)
  buttonIcon?: string | false
  buttonClick?: (ev: MouseEvent) => void
}

export interface ToolbarInput {
  left?: string
  center?: string
  right?: string
  start?: string
  end?: string
}

export interface ButtonInput {
  classNames?: ClassNamesGenerator<ButtonArg>
  text?: string
  hint?: string | ((viewOrCurrentUnitText: string, viewOrCurrentUnit: string) => string)
  icon?: string | false
  click?: (ev: MouseEvent) => void
}

export interface ButtonArg {
  isSelected: boolean
}

export type IconInput = CustomContentGenerator<IconArg> | {
  classNames?: ClassNamesGenerator<IconArg>
}

export interface IconArg {
  direction: 'ltr' | 'rtl' // TODO: DRY
}
