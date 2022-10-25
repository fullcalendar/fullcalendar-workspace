
export function mapObj(hash: any, func: (val: any, key: string) => any): any {
  const newHash: { [key: string]: any } = {}

  for (const key in hash) {
    newHash[key] = func(hash[key], key)
  }

  return newHash
}

export function strsToMap(strs: string[]): { [str: string]: true } {
  const map: { [str: string]: true } = {}

  for (const str of strs) {
    map[str] = true
  }

  return map
}

export function boolPromise(promise: Promise<any>): Promise<boolean> {
  return promise.then(
    () => true,
    () => false,
  )
}

export function arrayify(input: any): any[] {
  return Array.isArray(input) ? input : (input == null ? [] : [input])
}

// Async
// -------------------------------------------------------------------------------------------------

export type ContinuousAsyncFunc = (rerun: () => void) => ContinuousAsyncFuncRes
export type ContinuousAsyncFuncRes =
  Promise<(() => void) | void> |
  (() => void) |
  void

export async function continuousAsync(workerFunc: ContinuousAsyncFunc): Promise<() => void> {
  let currentRun: Promise<ContinuousAsyncFuncRes> | undefined
  let currentCleanupFunc: (() => void) | undefined
  let isDirty = false
  let isStopped = false

  async function run() {
    if (!isStopped) {
      if (!currentRun) {
        currentRun = Promise.resolve(workerFunc(run))
        currentCleanupFunc = (await currentRun) || undefined
        currentRun = undefined

        // had scan requests during previous run?
        if (isDirty) {
          isDirty = false
          currentCleanupFunc && currentCleanupFunc()
          currentCleanupFunc = undefined
          run()
        }
      } else {
        isDirty = true
      }
    }
  }

  await run()

  return () => { // the "stop" function
    isStopped = true
    currentCleanupFunc && currentCleanupFunc()
  }
}
