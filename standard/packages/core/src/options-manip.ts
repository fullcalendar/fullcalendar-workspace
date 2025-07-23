import { CustomContentGenerator } from './common/render-hook.js'
import { ClassNameInput, joinArrayishClassNames } from './util/html.js'
import { getUnequalProps, mergeMaybePropsShallow, mergeMaybePropsDepth1 } from './util/object.js'
import { CalendarOptions, ViewOptions } from './options.js'

type FuncishClassNameInput = ((data: any) => ClassNameInput) | ClassNameInput

const classNamesRe = /(^c|C)lass(Name)?$/
const contentRe = /Content$/
const lifecycleRe = /(DidMount|WillUnmount)$/
const handlerRe = /^on[A-Z]/

// Somewhat tracks COMPLEX_OPTION_COMPARATORS
// Unfortunately always need 'maybe' to handle undefined inital value, because of CalendarDataManager
const customMergeFuncs = {
  headerToolbar: mergeMaybePropsShallow,
  footerToolbar: mergeMaybePropsShallow,
  buttons: mergeMaybePropsDepth1,
}

export function mergeViewOptionsMap(
  ...hashes: { [view: string]: ViewOptions }[]
): { [view: string]: ViewOptions } {
  const merged: { [view: string]: ViewOptions } = {}

  for (const hash of hashes) {
    for (const viewName in hash) {
      const viewOptions = hash[viewName]

      if (!merged[viewName]) {
        merged[viewName] = viewOptions
      } else {
        merged[viewName] = mergeCalendarOptions(merged[viewName], viewOptions)
      }
    }
  }

  return merged
}

/*
Merges an array of RAW options objects into a single object.
The second argument allows for an array of property names who's object values will be merged together.
*/
export function mergeCalendarOptions(...optionSets: CalendarOptions[]): any {
  let dest = {}

  for (const options of optionSets) {
    for (let name in options) {
      if (name in dest) {
        const mergeFunc = customMergeFuncs[name] || (
          classNamesRe.test(name) ? joinFuncishClassNames :
          contentRe.test(name) ? mergeContentInjectors :
          lifecycleRe.test(name) ? mergeLifecycleCallbacks : undefined
        )
        dest[name] = mergeFunc
          ? mergeFunc(dest[name], options[name])
          : options[name] // last wins
      } else {
        dest[name] = options[name] // last wins
      }
    }
  }

  return dest
}

export function joinFuncishClassNames(
  input0: FuncishClassNameInput, // added to string first
  input1: FuncishClassNameInput
): FuncishClassNameInput {
  const isFunc0 = typeof input0 === 'function'
  const isFunc1 = typeof input1 === 'function'

  if (isFunc0 || isFunc1) {
    const combinedFunc = (data: any) => {
      return joinArrayishClassNames(
        isFunc0 ? input0(data) : input0,
        isFunc1 ? input1(data) : input1
      )
    }
    (combinedFunc as any).parts = [input0, input1] // see CalendarDataManager::processRawCalendarOptions
    return combinedFunc
  }

  return joinArrayishClassNames(input0 as ClassNameInput, input1 as ClassNameInput)
}

export function mergeContentInjectors(
  contentGenerator0: CustomContentGenerator<any>, // fallback
  contentGenerator1: CustomContentGenerator<any>
): CustomContentGenerator<any> {
  if (typeof contentGenerator1 === 'function') {
    // fabricate new function
    const combinedFunc = (renderProps: any, createElement: any) => {
      const res = contentGenerator1(renderProps, createElement)
      if (res === true) { // `true` indicates use-fallback
        if (typeof contentGenerator0 === 'function') {
          return contentGenerator0(renderProps, createElement)
        }
        return contentGenerator0
      }
      return res
    }
    (combinedFunc as any).parts = [contentGenerator0, contentGenerator1] // see CalendarDataManager::processRawCalendarOptions
    return combinedFunc
  }

  if (contentGenerator1 != null) {
    return contentGenerator1
  }

  return contentGenerator0
}

export function mergeLifecycleCallbacks(
  fn0: (...args: any[]) => any, // called first
  fn1: (...args: any[]) => any
): (...args: any[]) => any {
  if (fn0 && fn1) {
    // fabricate new function
    const combinedFunc = (...args: any[]) => {
      fn0(...args)
      fn1(...args)
    }
    (combinedFunc as any).parts = [fn0, fn1] // see CalendarDataManager::processRawCalendarOptions
    return combinedFunc
  }
  return fn0 || fn1
}

export function isNonHandlerPropsEqual(obj0, obj1) {
  const keys = getUnequalProps(obj0, obj1)

  for (let key of keys) {
    if (!handlerRe.test(key)) {
      return false
    }
  }

  return true
}
