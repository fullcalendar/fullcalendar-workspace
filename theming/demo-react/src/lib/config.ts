
export const uiOptions = {
  default: { text: 'Default' },
  shadcn: { text: 'Shadcn' },
  mui: { text: 'MUI' },
}

export type UIName = keyof typeof uiOptions

export const themeOptions = {
  monarch: { text: 'Monarch' },
  forma: { text: 'Forma' },
  breezy: { text: 'Breezy' },
  pulse: { text: 'Pulse' },
  classic: { text: 'Classic' },
}

export type ThemeName = keyof typeof themeOptions

export const colorSchemeOptions = {
  light: { text: 'Light' },
  dark: { text: 'Dark' },
}

export type ColorScheme = keyof typeof colorSchemeOptions

export const modeOptions = {
  dev: { text: 'Dev' },
  compiled: { text: 'Compiled' },
  prod: { text: 'Prod' },
}

export type Mode = keyof typeof modeOptions

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
}

export const vanillaUrls = {
  dev: 'js-tailwind-dev',
  compiled: 'js-tailwind-compiled',
  prod: 'js',
}

export function getAllUrlValues(): Record<string, string> {
  const values: string[] = []

  for (const uiKey in uiUrls) {
    const modes = uiUrls[uiKey as keyof typeof uiUrls]
    for (const mode in modes) {
      values.push(modes[mode as keyof typeof modes])
    }
  }

  for (const mode in vanillaUrls) {
    values.push(vanillaUrls[mode as keyof typeof vanillaUrls])
  }

  const map: Record<string, string> = {}

  for (const value of values) {
    map[value || 'index'] = (value || 'index') + '.html'
  }

  return map
}
