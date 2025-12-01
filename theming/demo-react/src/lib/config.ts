
export type ColorScheme = 'light' | 'dark'

export type Mode = 'dev' | 'compiled' | 'prod'

export const uiOptions = {
  default: { text: 'Default' },
  shadcn: { text: 'Shadcn' },
  mui: { text: 'MUI' },
}

export const themeOptions = {
  monarch: { text: 'Monarch' },
  forma: { text: 'Forma' },
  breezy: { text: 'Breezy' },
  pulse: { text: 'Pulse' },
  classic: { text: 'Classic' },
}

export const colorSchemeOptions = {
  light: { text: 'Light' },
  dark: { text: 'Dark' },
}

export const modeOptions = {
  dev: { text: 'Dev' },
  compiled: { text: 'Compiled' },
  prod: { text: 'Prod' },
}

export const uiUrls = {
  default: {
    dev: 'tailwind-dev',
    compiled: 'tailwind-compiled',
    prod: '', // index.html
  },
  shadcn: {
    dev: 'shadcn-dev',
    compiled: 'shadcn-compiled',
    prod: 'shadcn',
  },
  mui: {
    dev: 'mui-tailwind-dev',
    compiled: 'mui-tailwind-compiled',
    prod: 'mui',
  },
} as {
  [ui: string]: { dev: string, compiled: string, prod: string }
}

export const vanillaUrls = {
  dev: 'js-tailwind-dev',
  compiled: 'js-tailwind-compiled',
  prod: 'js',
}
