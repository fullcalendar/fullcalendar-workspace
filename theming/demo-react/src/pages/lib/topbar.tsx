import './topbar.css'

export interface PaletteMeta {
  text: string
  lightColor: string
  darkColor: string
}

export type PaletteMap = { [palette: string]: PaletteMeta }

export interface TopBarProps {
  theme: string
  onThemeChange: (theme: string) => void
  ui: string
  mode: 'dev' | 'compiled' | 'prod'
  isPlugin: boolean
  palettes?: PaletteMap
  themePalette?: { [theme: string]: PaletteMap }
  colorScheme: 'light' | 'dark'
  onColorSchemeChange: (colorScheme: string) => void
}

const themes = {
  monarch: { text: 'Monarch' },
  forma: { text: 'Forma' },
  breezy: { text: 'Breezy' },
  pulse: { text: 'Pulse' },
  classic: { text: 'Classic' },
}

const uis = {
  default: { text: 'Default' },
  shadcn: { text: 'Shadcn' },
  mui: { text: 'MUI' },
}

export function TopBar(props: TopBarProps) {
  return (
    <div className='topbar'>
      <div className='topbar-section'>
        <div className='topbar-subsection'>
          <label>Theme</label>
          <div className='tabbar'>
            {Object.entries(themes).map(([themeOption, themeMeta]) => (
              <button
                onClick={() => props.onThemeChange(themeOption)}
                className={
                  'tabbar-item' +
                  (themeOption === props.theme ? ' tabbar-item-selected' : '')
                }
              >{themeMeta.text}</button>
            ))}
          </div>
        </div>
        <div className='topbar-subsection'>
          <label>UI</label>
          <div className='tabbar'>
            {Object.entries(uis).map(([uiOption, uiMeta]) => (
              <a
                href={''}
                className={
                  'tabbar-item' +
                  (uiOption === props.ui ? ' tabbar-item-selected' : '')
                }
              >{uiMeta.text}</a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
