export type ClassNamesInput = string | string[]

type Falsy = false | null | undefined

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
