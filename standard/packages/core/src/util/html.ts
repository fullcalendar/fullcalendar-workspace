import { Falsy } from './misc.js'

export type SingleClassNameInput = string | number | Falsy
export type ClassNameInput = SingleClassNameInput[] | SingleClassNameInput // possibly an array

export function joinArrayishClassNames(...args: ClassNameInput[]): string {
  const simpleArgs: SingleClassNameInput[] = []

  for (const arg of args) {
    if (Array.isArray(arg)) {
      simpleArgs.push(...arg)
    } else {
      simpleArgs.push(arg)
    }
  }

  return joinClassNames(...simpleArgs)
}

export function joinClassNames(...args: (string | number | Falsy)[]): string {
  return args.filter(Boolean).join(' ')
}

export function fracToCssDim(frac: number): string {
  return frac * 100 + '%'
}
