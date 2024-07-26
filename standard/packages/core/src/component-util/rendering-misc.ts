import { Component } from '../preact.js'

// TODO: kill Component::safeSetState

export function setStateDimMap<State>(
  component: Component<unknown, State>,
  key: keyof State,
  newMap: { [key: string]: number },
): void {
  const currentMap = component.state[key] as any
  if (!currentMap || !isDimMapsEqual(currentMap, newMap)) {
    component.setState({ [key]: newMap } as State)
  }
}

export function isDimMapsEqual(
  oldMap: { [key: string]: number },
  newMap: { [key: string]: number },
): boolean {
  for (const key in newMap) {
    if (!isDimsEqual(oldMap[key], newMap[key])) {
      return false
    }
  }

  return true
}

export function isDimsEqual(v0: number | undefined, v1: number): boolean {
  return v0 != null && (v0 === v1 || Math.abs(v0 - v1) < 0.01)
}
