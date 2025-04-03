export type ClassNamesInput = string | string[]

type Falsy = false | null | undefined

/*
an argument could be a string[]
*/
export function joinComplexClassNames(...args: (string[] | string | number | Falsy)[]): string {
  const simpleArgs: (string | number | Falsy)[] = []

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

export function parseClassNames(raw: ClassNamesInput) {
  if (Array.isArray(raw)) {
    return raw
  }

  if (typeof raw === 'string') {
    return raw.split(/\s+/)
  }

  return []
}

export function fracToCssDim(frac: number): string {
  return frac * 100 + '%'
}
