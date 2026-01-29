import { Fragment as ReactFragment, StrictMode as ReactStrictMode } from 'react'

// Manually change this const to 2 to enable StrictMode
export const strictModeFactor = 2
export const StrictMode = strictModeFactor > 1 ? ReactStrictMode : ReactFragment
