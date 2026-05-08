/* eslint max-classes-per-file: off */

import type { ReactNode } from 'react'

export type MountData<DisplayData> = DisplayData & { el: HTMLElement }
export type DidMountHandler<DisplayData> = (mountData: MountData<DisplayData>) => void
export type WillUnmountHandler<DisplayData> = (mountData: MountData<DisplayData>) => void

export interface ObjCustomContent {
  html?: string
  domNodes?: any[]
}

export type CustomContent = ReactNode | ObjCustomContent
export type ContentGenerator<RenderProps> = CustomContent | ((renderProps: RenderProps) => (CustomContent | true | void | undefined))
export type ClassNameInput = string | undefined | null | false | 0
export type ClassNameGenerator<RenderProps> = ClassNameInput | ((renderProps: RenderProps) => ClassNameInput)

const warnedClassNameOptions: { [optionName: string]: true } = {}

export function refineClassName(input: unknown, optionName: string): ClassNameInput {
  if (!input || typeof input === 'string') {
    return input as ClassNameInput
  }

  warnInvalidClassName(optionName)
  return ''
}

export function refineClassNameGenerator<RenderProps>(
  input: ClassNameGenerator<RenderProps>,
  optionName: string,
): ClassNameGenerator<RenderProps> {
  if (typeof input === 'function') {
    return (renderProps: RenderProps) => refineClassName(input(renderProps), optionName)
  }

  return refineClassName(input, optionName)
}

function warnInvalidClassName(optionName: string): void {
  if (!warnedClassNameOptions[optionName]) {
    console.warn(`Invalid className value for option '${optionName}'. Expected a string or a falsy value.`)
    warnedClassNameOptions[optionName] = true
  }
}
