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

function isDimMapsEqual(
  oldMap: { [key: string]: number },
  newMap: { [key: string]: number },
): boolean {
  for (const key in newMap) {
    const newVal = newMap[key]
    const oldVal = oldMap[key]

    if (newVal !== oldVal && Math.abs(newVal - oldVal) > 0.01) {
      return false
    }
  }

  return true
}
