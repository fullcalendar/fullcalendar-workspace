
import { CssDimValue } from "@fullcalendar/core"
import { fracToCssDim } from "@fullcalendar/core/internal"

export function parseDimConfig(
  input: CssDimValue | undefined,
  minDim = 0,
): { pixels: number, frac: number, min: number } | undefined {
  if (input != null) {
    if (typeof input === 'string') {
      let m = input.match(/^(.*)(%|px)$/)

      if (m) {
        const num = parseFloat(m[1])

        if (!isNaN(num)) {
          if (m[2] === '%') {
            return { pixels: 0, frac: num / 100, min: minDim }
          } else {
            return { pixels: num, frac: 0, min: minDim }
          }
        }
      }
    } else if (typeof input === 'number' && !isNaN(input)) {
      return { pixels: input, frac: 0, min: minDim }
    }
  }
}

export function parseSiblingDimConfig(
  input: CssDimValue | undefined,
  grow: number | undefined, // TODO: use (and sanitize)
  minDim: number | undefined,
): { pixels: number, frac: number, grow: number, min: number } {
  const partialDimConfig = parseDimConfig(input, minDim)

  return partialDimConfig
    ? { ...partialDimConfig, grow: grow || 0 }
    : { pixels: 0, frac: 0, grow: grow || 1, min: minDim }
}

/*
Ensure at least one column can grow
Mutates in-place
*/
export function ensureDimConfigsGrow(dimConfigs: { grow: number }[]): void {
  for (const dimConfig of dimConfigs) {
    if (dimConfig.grow) {
      return
    }
  }

  // make all expand equally
  for (const dimConfig of dimConfigs) {
    dimConfig.grow = 1
  }
}

export function pixelizeDimConfigs(
  dimConfigs: { pixels: number, frac: number, grow: number, min: number }[],
  clientDim: number,
): [
  pixelDims: number[],
  minCanvasDim: number,
] {
  const pixelDims: number[] = []
  let preGrowTotal = 0
  let growDenom = 0

  for (const dimConfig of dimConfigs) {
    const constrainedPixels = Math.max(
      dimConfig.pixels + (dimConfig.frac * clientDim),
      dimConfig.min,
    )

    pixelDims.push(constrainedPixels)
    preGrowTotal += constrainedPixels
    growDenom += dimConfig.grow
  }

  if (preGrowTotal < clientDim) {
    const remainder = clientDim - preGrowTotal

    for (let i = 0; i < dimConfigs.length; i++) {
      pixelDims[i] += remainder * (dimConfigs[i].grow / growDenom)
    }
  }

  return [pixelDims, preGrowTotal]
}

export function portabilizeDimConfigs(
  dimConfigs: { pixels: number, frac: number, grow: number, min: number }[],
  clientDim: number,
): [
  portableDimConfigs: { pixels: number, grow: number }[],
  minCanvasDim: CssDimValue,
] {
  const [pixelDims] = pixelizeDimConfigs(dimConfigs, clientDim)
  const portableDimConfigs: { pixels: number, grow: number }[] = []

  let pixelTotal = 0
  let fracTotal = 0

  for (let i = 0; i < dimConfigs.length; i++) {
    const dimConfig = dimConfigs[i]
    const constrainedPixels = Math.max(
      dimConfig.pixels,
      dimConfig.min,
    )

    portableDimConfigs.push({
      pixels: constrainedPixels,
      grow: pixelDims[i] - constrainedPixels, // a pixel value, but used as a proportion
    })

    pixelTotal += dimConfig.pixels
    fracTotal += dimConfig.frac
  }

  const minCanvasDim = serializeDimConfig({
    pixels: pixelTotal,
    frac: fracTotal,
  })

  return [portableDimConfigs, minCanvasDim]
}

export function serializeDimConfig(
  { pixels, frac }: { pixels: number, frac: number }
): CssDimValue {
  if (!frac) {
    return pixels
  }
  if (!pixels) {
    return fracToCssDim(frac)
  }
  return `calc(${fracToCssDim(frac)} + ${pixels}px)`
}

export function resizeSiblingDimConfig(
  dimConfigs: { pixels: number, frac: number, grow: number, min: number }[],
  pixelDims: number[],
  clientDim: number,
  resizeIndex: number,
  resizeDim: number,
): { pixels: number, frac: number, grow: number, min: number }[] {
  const newDimConfigs: { pixels: number, frac: number, grow: number, min: number }[] = []

  for (let i = 0; i < resizeIndex; i++) {
    newDimConfigs.push(resizeDimConfig(dimConfigs[i], pixelDims[i], clientDim))
  }

  newDimConfigs.push(resizeDimConfig(dimConfigs[resizeIndex], resizeDim, clientDim))

  const len = dimConfigs.length
  let anyGrow = false

  for (let i = resizeIndex + 1; i < len; i++) {
    const dimConfig = dimConfigs[i]
    newDimConfigs.push(dimConfig)

    if (dimConfig.grow) {
      anyGrow = true
    }
  }

  if (!anyGrow) {
    for (let i = resizeIndex + 1; i < len; i++) {
      newDimConfigs[i] = Object.assign({}, newDimConfigs[i], { grow: 1 })
    }
  }

  return newDimConfigs
}

export function resizeDimConfig(
  dimConfig: { pixels: number, min: number },
  newPixels: number,
  clientDim: number,
): { pixels: number, frac: number, grow: number, min: number } {
  const { min } = dimConfig
  newPixels = Math.max(min, newPixels)

  if (dimConfig.pixels) {
    return { pixels: newPixels, frac: 0, grow: 0, min }
  }

  return { pixels: 0, frac: newPixels / clientDim, grow: 0, min }
}

export function sumPixels(dimConfigs: { pixels: number }[]): number {
  let sum = 0

  for (const dimConfig of dimConfigs) {
    sum += dimConfig.pixels
  }

  return sum
}
