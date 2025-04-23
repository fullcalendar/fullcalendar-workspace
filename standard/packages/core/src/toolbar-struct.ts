import { ClassNamesGenerator, CustomContentGenerator, DidMountHandler, MountArg, WillUnmountHandler } from './common/render-hook.js'

export interface ToolbarModel {
  sectionWidgets: {
    start: ToolbarWidget[][]
    center: ToolbarWidget[][]
    end: ToolbarWidget[][]
  }
  viewsWithButtons: string[]
  hasTitle: boolean
}

export interface ToolbarArg {
  name: string
  // TODO: sticky
}

export interface ToolbarSectionArg {
  name: string
}

// Button / Toolbar
// -------------------------------------------------------------------------------------------------

export interface ButtonContentArg {
  name: string
  icon: string | false
  text: string
  isSelected: boolean
  isDisabled: boolean
}

export type ButtonMountArg = MountArg<ButtonContentArg>

export interface ButtonInput {
  text?: string
  hint?: string | ((viewOrCurrentUnitText: string, viewOrCurrentUnit: string) => string)
  icon?: string | false
  click?: (ev: MouseEvent) => void
  classNames?: ClassNamesGenerator<ButtonContentArg>
  content?: CustomContentGenerator<ButtonContentArg>
  didMount?: DidMountHandler<ButtonMountArg>
  willUnmount?: DidMountHandler<ButtonMountArg>
}

// Info for internal rendering
export interface ToolbarWidget {
  name: string
  isView?: boolean
  customElement?: ToolbarElementInput
  buttonText?: string
  buttonHint?: string | ((currentUnit: string) => string)
  buttonIcon?: string | false
  buttonClick?: (ev: MouseEvent) => void
  buttonClassNames?: ClassNamesGenerator<ButtonContentArg>
  buttonContent?: CustomContentGenerator<ButtonContentArg>
  buttonDidMount?: DidMountHandler<ButtonMountArg>
  buttonWillUnmount?: WillUnmountHandler<ButtonMountArg>
}

export interface ToolbarInput {
  left?: string
  center?: string
  right?: string
  start?: string
  end?: string
}

// Icon
// -------------------------------------------------------------------------------------------------

export interface IconArg {
  direction: 'ltr' | 'rtl' // TODO: DRY
}

export type IconInput = CustomContentGenerator<IconArg> | {
  classNames?: ClassNamesGenerator<IconArg>
}

// Custom Elements
// -------------------------------------------------------------------------------------------------

export type ToolbarElementInput = CustomContentGenerator<{}>
