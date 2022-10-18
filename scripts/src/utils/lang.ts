
export function mapHash(hash: any, func: (val: any, key: string) => any): any {
  const newHash: { [key: string]: any } = {}

  for (const key in hash) {
    newHash[key] = func(hash[key], key)
  }

  return newHash
}

export function boolPromise(promise: Promise<any>): Promise<boolean> {
  return promise.then(
    () => true,
    () => false,
  )
}
