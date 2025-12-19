
export type CssDimValue = string | number

export function fracToCssDim(frac: number): string {
  return frac * 100 + '%'
}
