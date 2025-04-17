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
  isView?: boolean
  buttonName: string
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
  text?: string
  hint?: string | ((viewOrCurrentUnitText: string, viewOrCurrentUnit: string) => string)
  icon?: string | false
  click?: (ev: MouseEvent) => void
}

export type IconInput = CustomContentGenerator<IconArg> | {
  className?: ClassNamesGenerator<IconArg>
}

export interface IconArg {
  direction: 'ltr' | 'rtl' // TODO: DRY
}
