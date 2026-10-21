let guidNumber = 0

export function guid() {
  guidNumber += 1
  return String(guidNumber)
}

export function formatWithOrdinals<Args extends any[]>(
  formatter: string | ((...formatterArgs: Args) => string),
  args: Args,
  fallbackText: string,
) {
  if (typeof formatter === 'function') {
    return formatter(...args)
  }
  if (typeof formatter === 'string') { // non-blank string
    return args.reduce((str, arg, index) => (
      str.replace('$' + index, arg || '')
    ), formatter)
  }
  return fallbackText
}

export function firstDefined(...args) {
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] !== undefined) {
      return args[i]
    }
  }
  return undefined
}

export function valuesIdentical<T>(a: T, b: T): boolean {
  return a === b
}
