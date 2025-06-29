import './App.css'
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs.js'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.js'
import { useState } from 'react'

function App() {
  const [theme, setTheme] = useState('monarch')
  const [componentLib, setComponentLib] = useState('default')
  const [shadcnPalette, setShadcnPalette] = useState('default')
  const [muiPalette, setMuiPalette] = useState('blue')

  return (
    <div className='sticky top-0 p-4 border-b shadow-xs flex flex-row gap-8 justify-between'>
      <div className='flex flex-row gap-8'>
        <div className='flex flex-row items-center gap-4'>
          <div className='text-sm text-muted-foreground'>Theme</div>
          <Tabs value={theme} onValueChange={(v) => setTheme(v)}>
            <TabsList>
              <TabsTrigger value='monarch'>Monarch</TabsTrigger>
              <TabsTrigger value='forma'>Forma</TabsTrigger>
              <TabsTrigger value='zen'>Zen</TabsTrigger>
              <TabsTrigger value='classic'>Classic</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className='flex flex-row items-center gap-4'>
          <div className='text-sm text-muted-foreground'>Component Lib</div>
          <Tabs value={componentLib} onValueChange={(v) => setComponentLib(v)}>
            <TabsList>
              <TabsTrigger value='default'>Default</TabsTrigger>
              <TabsTrigger value='shadcn'>Shadcn</TabsTrigger>
              <TabsTrigger value='mui'>MUI</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      <div className='flex flex-row gap-8'>
        {(componentLib === 'shadcn') ? (
          <div className='flex flex-row items-center gap-4'>
            <div className='text-sm text-muted-foreground'>Palette</div>
            <Select value={shadcnPalette} onValueChange={(v) => setShadcnPalette(v)}>
              <SelectTrigger className='w-50'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='default' className='flex flex-row'>
                  <div className='w-4 h-4 bg-black dark:bg-white' />
                  Default
                </SelectItem>
                <SelectItem value='red' className='flex flex-row'>
                  <div className='w-4 h-4 bg-[oklch(0.577_0.245_27.325)] dark:bg-[oklch(0.637_0.237_25.331)]' />
                  Red
                </SelectItem>
                <SelectItem value='rose' className='flex flex-row'>
                  <div className='w-4 h-4 bg-[oklch(0.586_0.253_17.585)] dark:bg-[oklch(0.645_0.246_16.439)]' />
                  Rose
                </SelectItem>
                <SelectItem value='orange' className='flex flex-row'>
                  <div className='w-4 h-4 bg-[oklch(0.646_0.222_41.116)] dark:bg-[oklch(0.705_0.213_47.604))]' />
                  Orange
                </SelectItem>
                <SelectItem value='green' className='flex flex-row'>
                  <div className='w-4 h-4 bg-[oklch(0.648_0.2_131.684)] dark:bg-[oklch(0.648_0.2_131.684)]' />
                  Green
                </SelectItem>
                <SelectItem value='blue' className='flex flex-row'>
                  <div className='w-4 h-4 bg-[oklch(0.546_0.245_262.881)] dark:bg-[oklch(0.623_0.214_259.815)]' />
                  Blue
                </SelectItem>
                <SelectItem value='yellow' className='flex flex-row'>
                  <div className='w-4 h-4 bg-[oklch(0.852_0.199_91.936)] dark:bg-[oklch(0.795_0.184_86.047)]' />
                  Yellow
                </SelectItem>
                <SelectItem value='violet' className='flex flex-row'>
                  <div className='w-4 h-4 bg-[oklch(0.541_0.281_293.009)] dark:bg-[oklch(0.606_0.25_292.717)]' />
                  Violet
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : (componentLib === 'mui') && (
          <div className='flex flex-row items-center gap-4'>
            <div className='text-sm text-muted-foreground'>Palette</div>
            <Select value={muiPalette} onValueChange={(v) => setMuiPalette(v)}>
              <SelectTrigger className='w-50'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='blue' className='flex flex-row'>
                  <div className='w-4 h-4 bg-[rgb(25,118,210)] dark:bg-[rgb(144,202,249)]' />
                  Blue
                </SelectItem>
                <SelectItem value='purple' className='flex flex-row'>
                  <div className='w-4 h-4 bg-[#6200ea] dark:bg-[#bb86fc]' />
                  Purple
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <Tabs defaultValue='light'>
          <TabsList>
            <TabsTrigger value='light'>Light</TabsTrigger>
            <TabsTrigger value='dark'>Dark</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  )
}

export default App
