export type ClassNamesInput = string | string[]

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
