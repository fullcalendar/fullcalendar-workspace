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
  text: string
  isSelected: boolean
  isDisabled: boolean
  inGroup: boolean
}

export type ButtonMountArg = MountArg<ButtonContentArg>

export type ButtonDisplay = 'auto' | 'icon' | 'text' | 'icon-text' | 'text-icon'

export interface ButtonIconArg {
  direction: 'ltr' | 'rtl' // TODO: DRY
}

export interface ButtonInput {
  didMount?: DidMountHandler<ButtonMountArg>
  willUnmount?: DidMountHandler<ButtonMountArg>
  click?: (ev: MouseEvent) => void
  hint?: string | ((viewOrCurrentUnitText: string, viewOrCurrentUnit: string) => string)
  classNames?: ClassNamesGenerator<ButtonContentArg>
  display?: ButtonDisplay
  iconClassNames?: ClassNamesGenerator<ButtonIconArg>,
  iconContent?: CustomContentGenerator<ButtonIconArg>,
  text?: string
}

// Info for internal rendering
export interface ToolbarWidget {
  name: string
  isView?: boolean
  customElement?: ToolbarElementInput
  buttonText?: string
  buttonHint?: string | ((currentUnit: string) => string)
  buttonDisplay?: ButtonDisplay
  buttonIconClassNames?: ClassNamesGenerator<ButtonIconArg>
  buttonIconContent?: CustomContentGenerator<ButtonIconArg>
  buttonClick?: (ev: MouseEvent) => void
  buttonClassNames?: ClassNamesGenerator<ButtonContentArg>
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

// Custom Elements
// -------------------------------------------------------------------------------------------------

export type ToolbarElementInput = CustomContentGenerator<{}>
