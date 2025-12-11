
type ClassValue = string | undefined | null | false | number /* number ~ 0 */

export function joinArrayishClassNames(
  ...args: (ClassValue | ClassValue[])[]
): string {
  const simpleArgs: ClassValue[] = []

  for (const arg of args) {
    if (Array.isArray(arg)) {
      simpleArgs.push(...arg)
    } else {
      simpleArgs.push(arg)
    }
  }

  return joinClassNames(...simpleArgs)
}

export function joinClassNames(...args: ClassValue[]): string {
  return args.filter(Boolean).join(' ')
}

export function fracToCssDim(frac: number): string {
  return frac * 100 + '%'
}
