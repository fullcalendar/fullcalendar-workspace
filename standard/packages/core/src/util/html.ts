import { Falsy } from './misc.js'

export type ClassNameInput = string | number | Falsy
export type ClassNamesInput = ClassNameInput[] | ClassNameInput // possibly an array

export function joinArrayishClassNames(...args: ClassNamesInput[]): string {
  const simpleArgs: ClassNameInput[] = []

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
