import React, { ReactNode, useEffect, useRef, useState } from 'react'
import adaptivePlugin from '@fullcalendar/react-scheduler/adaptive'
import scrollGridPlugin from '@fullcalendar/react-scheduler/scrollgrid'
import { EventCalendarProps } from '@fullcalendar/theme-common/event-calendar'
import { SchedulerProps } from '@fullcalendar/theme-common/scheduler'
import { eventCalendarProps, resourceTimelineProps, vResourceProps } from './demo-config.js'
import SlButton from '@shoelace-style/shoelace/dist/react/button/index.js'
import SlCheckbox from '@shoelace-style/shoelace/dist/react/checkbox/index.js'
import SlCopyButton from '@shoelace-style/shoelace/dist/react/copy-button/index.js'
import SlDialog from '@shoelace-style/shoelace/dist/react/dialog/index.js'
import SlInput from '@shoelace-style/shoelace/dist/react/input/index.js'
import SlIcon from '@shoelace-style/shoelace/dist/react/icon/index.js'
import SlRadioButton from '@shoelace-style/shoelace/dist/react/radio-button/index.js'
import SlRadioGroup from '@shoelace-style/shoelace/dist/react/radio-group/index.js'
import SlTab from '@shoelace-style/shoelace/dist/react/tab/index.js'
import SlTabGroup from '@shoelace-style/shoelace/dist/react/tab-group/index.js'
import SlTabPanel from '@shoelace-style/shoelace/dist/react/tab-panel/index.js'
import SlTooltip from '@shoelace-style/shoelace/dist/react/tooltip/index.js'
import { DEFAULT_DARK_CLASS_NAME, DEFAULT_DATA_ATTRIBUTE } from './demo-generator-util.js'
import { ColorScheme, ThemeName } from './config.js'
import { getForkedAppCode, getStockAppCode } from './demo-generator-code.js'

/*
TODO: redirect for MUI and Shadcn
*/

export interface DemoGeneratorProps {
  themeName: string,
  paletteName: string,
  colorScheme: string,
  renderEventCalendar: (props: EventCalendarProps) => ReactNode
  renderResourceTimeline: (props: SchedulerProps) => ReactNode
  renderResourceTimeGrid: (props: SchedulerProps) => ReactNode
}

interface CodeDialogParams {
  label: string // TODO: keep?
  themeName: ThemeName
  paletteName: string
  colorScheme: 'light' | 'dark'
  pluginMap: Record<string, string>
  isScheduler: boolean
  availableViews: string[]
}

function CodeFileTabs({ sourceFiles }: { sourceFiles: Record<string, string> }) {
  const filenames = Object.keys(sourceFiles)
  const [activeFilename, setActiveFilename] = useState(filenames[0])
  const activeCode = sourceFiles[activeFilename] ?? ''
  const copyWrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = copyWrapperRef.current
    if (!el) return
    // SlCopyButton contains a tooltip that fires sl-after-hide when it hides.
    // That event bubbles up to SlDialog, which interprets it as itself closing.
    // Stop propagation here to prevent the dialog from closing on copy button hover/click.
    const stop = (e: Event) => e.stopPropagation()
    el.addEventListener('sl-after-hide', stop)
    return () => el.removeEventListener('sl-after-hide', stop)
  }, [])

  return (
    <div className='demo-code-tabs'>
      <div ref={copyWrapperRef} className='demo-code-copy-btn'>
        <SlCopyButton value={activeCode} />
      </div>
      <SlTabGroup onSlTabShow={(e: any) => setActiveFilename(e.detail.name)}>
        {filenames.map((filename) => (
          <SlTab key={filename} slot='nav' panel={filename}>{filename}</SlTab>
        ))}
        {filenames.map((filename) => (
          <SlTabPanel key={filename} name={filename}>
            <pre className='demo-code-pre'>{sourceFiles[filename]}</pre>
          </SlTabPanel>
        ))}
      </SlTabGroup>
    </div>
  )
}


const VALID_IDENTIFIER_RE = /^[a-zA-Z][a-zA-Z0-9-]*$/

function CodeButton({ onPress }: { onPress: () => void }) {
  return (
    <SlButton
      size='small'
      variant='default'
      onClick={onPress}
      className='demo-code-button'
    >
      <SlIcon slot='prefix' name='code-slash'></SlIcon>Code
    </SlButton>
  )
}

function CodeDialog({ activeDialog, onClose }: { activeDialog: CodeDialogParams | null; onClose: () => void }) {
  const [isFork, setIsFork] = useState(false)
  const [colorSchemeTechnique, setColorSchemeTechnique] = useState<'component-prop' | 'data-attribute' | 'class-name' | 'media-query'>('component-prop')
  const [dataAttribute, setDataAttribute] = useState(DEFAULT_DATA_ATTRIBUTE)
  const [darkClassName, setDarkClassName] = useState(DEFAULT_DARK_CLASS_NAME)
  const [styling, setStyling] = useState('tailwind')

  function resetForm() {
    setIsFork(false)
    setColorSchemeTechnique('component-prop')
    setDataAttribute(DEFAULT_DATA_ATTRIBUTE)
    setDarkClassName(DEFAULT_DARK_CLASS_NAME)
    setStyling('tailwind')
  }

  const sourceFiles: Record<string, string> = {}

  if (activeDialog) {
    sourceFiles['app.tsx'] = isFork
      ? getForkedAppCode({
          colorScheme: activeDialog?.colorScheme,
          colorSchemeTechnique,
          colorSchemeDataAttribute: dataAttribute,
          darkClassName,
          pluginMap: activeDialog?.pluginMap,
          isScheduler: activeDialog?.isScheduler,
          availableViews: activeDialog?.availableViews,
        })
      : getStockAppCode({
          themeName: activeDialog?.themeName,
          paletteName: activeDialog?.paletteName,
          colorScheme: activeDialog?.colorScheme,
          colorSchemeTechnique,
          colorSchemeDataAttribute: dataAttribute,
          darkClassName,
          pluginMap: activeDialog?.pluginMap,
          isScheduler: activeDialog?.isScheduler,
          availableViews: activeDialog?.availableViews,
        })
  }

  return (
    <SlDialog label={activeDialog?.label ?? ''} open={activeDialog !== null} onSlAfterHide={onClose} style={{ '--width': '860px' } as React.CSSProperties}>
      <div className='demo-dialog-fields'>
          <div className='demo-dialog-fields-row' style={{ alignItems: 'end', marginBottom: 20 }}>
            <SlRadioGroup label='UI Framework' value='react' size='small'>
              <SlRadioButton value='react'>React</SlRadioButton>
              <SlRadioButton value='vue' disabled>
                Vue
                <SlTooltip slot='suffix' content='Examples coming soon' style={{ pointerEvents: 'auto' }} onSlAfterHide={(e: any) => e.stopPropagation()}>
                  <SlIcon name='question-circle' style={{ cursor: 'help' }} />
                </SlTooltip>
              </SlRadioButton>
              <SlRadioButton value='angular' disabled>
                Angular
                <SlTooltip slot='suffix' content='Examples coming soon' style={{ pointerEvents: 'auto' }} onSlAfterHide={(e: any) => e.stopPropagation()}>
                  <SlIcon name='question-circle' style={{ cursor: 'help' }} />
                </SlTooltip>
              </SlRadioButton>
            </SlRadioGroup>
            <SlCheckbox className='demo-dialog-checkbox-field' checked={isFork} onSlChange={() => setIsFork(!isFork)}>Fork theme source code</SlCheckbox>
          </div>
          <div className='demo-dialog-fields-row' style={{ alignItems: 'start', minHeight: 130 }}>
            <div className='demo-dialog-field'>
              <SlRadioGroup label='Dark/Light Technique' value={colorSchemeTechnique} size='small' onSlChange={(e: any) => setColorSchemeTechnique(e.target.value)}>
                <SlRadioButton value='component-prop'>Component Prop</SlRadioButton>
                <SlRadioButton value='data-attribute'>Data Attribute</SlRadioButton>
                <SlRadioButton value='class-name'>Class Name</SlRadioButton>
                <SlRadioButton value='media-query'>Media Query</SlRadioButton>
              </SlRadioGroup>
              {colorSchemeTechnique === 'component-prop' && (
                <div className='demo-dialog-field-warning'>This technique is simple but may result in a FOUC.</div>
              )}
              {colorSchemeTechnique === 'data-attribute' && (
                <div className='demo-dialog-field-input-row'>
                  <SlInput label='Data Attribute' size='small' value={dataAttribute} onSlInput={(e: any) => setDataAttribute(e.target.value)} />
                  <SlButton size='small' variant='default' onClick={() => setDataAttribute(DEFAULT_DATA_ATTRIBUTE)}>Reset</SlButton>
                </div>
              )}
              {colorSchemeTechnique === 'data-attribute' && !VALID_IDENTIFIER_RE.test(dataAttribute) && (
                <div className='demo-dialog-field-warning'>This data attribute is invalid</div>
              )}
              {colorSchemeTechnique === 'data-attribute' && VALID_IDENTIFIER_RE.test(dataAttribute) && dataAttribute !== DEFAULT_DATA_ATTRIBUTE && !isFork && (
                <div className='demo-dialog-field-warning'>A non-default data attribute requires a forked palette.css</div>
              )}
              {colorSchemeTechnique === 'class-name' && (
                <div className='demo-dialog-field-input-row'>
                  <SlInput label='Dark Class Name' size='small' value={darkClassName} onSlInput={(e: any) => setDarkClassName(e.target.value)} />
                  <SlButton size='small' variant='default' onClick={() => setDarkClassName(DEFAULT_DARK_CLASS_NAME)}>Reset</SlButton>
                </div>
              )}
              {colorSchemeTechnique === 'class-name' && !VALID_IDENTIFIER_RE.test(darkClassName) && (
                <div className='demo-dialog-field-warning'>This class name is invalid</div>
              )}
            </div>
            {isFork && (
            <div className='demo-dialog-field'>
              <SlRadioGroup label='Styling' value={styling} size='small' onSlChange={(e: any) => setStyling(e.target.value)}>
                <SlRadioButton value='tailwind'>Tailwind</SlRadioButton>
                <SlRadioButton value='global-css'>Global CSS</SlRadioButton>
                <SlRadioButton value='css-modules'>CSS Modules</SlRadioButton>
              </SlRadioGroup>
              {styling === 'global-css' && (
                <div className='demo-dialog-field-warning'>The readability of selectors is still being improved for CSS modules.</div>
              )}
              {styling === 'css-modules' && (
                <div className='demo-dialog-field-warning'>This option is not yet available. Please consult Global CSS for now.</div>
              )}
            </div>
            )}
          </div>
        </div>
        {activeDialog && <CodeFileTabs sourceFiles={sourceFiles} />}
        <SlButton slot='footer' variant='default' onClick={resetForm}>Reset All</SlButton>
        <SlButton slot='footer' variant='primary' onClick={onClose}>Close</SlButton>
      </SlDialog>
  )
}

export function DemoGenerator(props: DemoGeneratorProps) {
  const [activeDialog, setActiveDialog] = useState<CodeDialogParams | null>(null)

  return (
    <>
      <CodeDialog activeDialog={activeDialog} onClose={() => setActiveDialog(null)} />
      <div className='demo-container'>

        <div className='demo-item'>
          {props.renderEventCalendar({
            ...eventCalendarProps,
            initialView: 'dayGridMonth',
            availableViews: ['dayGridMonth', 'timeGridWeek', 'timeGridDay', 'listWeek', 'multiMonthYear'],
            plugins: [scrollGridPlugin, adaptivePlugin],
          })}
          <CodeButton
            onPress={() => setActiveDialog({
              label: 'Day Grid Month',
              themeName: props.themeName as ThemeName,
              paletteName: props.paletteName,
              colorScheme: props.colorScheme as ColorScheme,
              pluginMap: {
                'dayGridPlugin': '@fullcalendar/react/daygrid',
                'timeGridPlugin': '@fullcalendar/react/timegrid',
                'listPlugin': '@fullcalendar/react/list',
                'multiMonthPlugin': '@fullcalendar/react/multimonth',
              },
              isScheduler: false,
              availableViews: ['dayGridMonth', 'timeGridWeek', 'timeGridDay', 'listWeek', 'multiMonthYear'],
            })}
          />
        </div>

        <div className='demo-item'>
          {props.renderEventCalendar({
            ...eventCalendarProps,
            initialView: 'timeGridWeek',
            plugins: [scrollGridPlugin, adaptivePlugin],
          })}
          <CodeButton
            onPress={() => setActiveDialog({
              label: 'Time Grid Week',
              themeName: props.themeName as ThemeName,
              paletteName: props.paletteName,
              colorScheme: props.colorScheme as ColorScheme,
              pluginMap: {
                'timeGridPlugin': '@fullcalendar/react/timegrid',
                'dayGridPlugin': '@fullcalendar/react/daygrid',
              },
              isScheduler: false,
              availableViews: ['timeGridWeek', 'timeGridDay', 'dayGridMonth'],
            })}
          />
        </div>

        <div className='demo-item'>
          {props.renderEventCalendar({
            ...eventCalendarProps,
            initialView: 'multiMonthYear',
            plugins: [scrollGridPlugin, adaptivePlugin],
          })}
          <CodeButton
            onPress={() => setActiveDialog({
              label: 'Multi Month Year',
              themeName: props.themeName as ThemeName,
              paletteName: props.paletteName,
              colorScheme: props.colorScheme as ColorScheme,
              pluginMap: {
                'multiMonthPlugin': '@fullcalendar/react/multimonth',
              },
              isScheduler: false,
              availableViews: ['multiMonthYear'],
            })}
          />
        </div>

        <div className='demo-item'>
          {props.renderEventCalendar({
            ...eventCalendarProps,
            initialView: 'dayGridYear',
            availableViews: ['dayGridYear'],
            plugins: [scrollGridPlugin, adaptivePlugin],
          })}
          <CodeButton
            onPress={() => setActiveDialog({
              label: 'Day Grid Year',
              themeName: props.themeName as ThemeName,
              paletteName: props.paletteName,
              colorScheme: props.colorScheme as ColorScheme,
              pluginMap: {
                'dayGridPlugin': '@fullcalendar/react/daygrid',
              },
              isScheduler: false,
              availableViews: ['dayGridYear'],
            })}
          />
        </div>

        <div className='demo-item'>
          {props.renderEventCalendar({
            ...eventCalendarProps,
            initialView: 'listYear',
            availableViews: ['listYear', 'listMonth', 'listWeek'],
            plugins: [scrollGridPlugin, adaptivePlugin],
            listText: '',
          })}
          <CodeButton
            onPress={() => setActiveDialog({
              label: 'List Year',
              themeName: props.themeName as ThemeName,
              paletteName: props.paletteName,
              colorScheme: props.colorScheme as ColorScheme,
              pluginMap: {
                'listPlugin': '@fullcalendar/react/list',
              },
              isScheduler: false,
              availableViews: ['listYear', 'listMonth', 'listWeek'],
            })}
          />
        </div>

        <div className='demo-item'>
          {props.renderResourceTimeline({
            ...resourceTimelineProps,
            initialView: 'resourceTimelineThreeDay',
            availableViews: ['resourceTimelineDay', 'resourceTimelineThreeDay', 'resourceTimelineWeek'],
          })}
          <CodeButton
            onPress={() => setActiveDialog({
              label: 'Resource Timeline',
              themeName: props.themeName as ThemeName,
              paletteName: props.paletteName,
              colorScheme: props.colorScheme as ColorScheme,
              pluginMap: {
                'resourceTimelinePlugin': '@fullcalendar/react-scheduler/resource-timeline',
              },
              isScheduler: true,
              availableViews: ['resourceTimelineDay', 'resourceTimelineThreeDay', 'resourceTimelineWeek'],
            })}
          />
        </div>

        <div className='demo-item'>
          {props.renderResourceTimeGrid({
            ...vResourceProps,
            initialView: 'resourceTimeGridFiveDay',
            availableViews: ['resourceTimeGridDay', 'resourceTimeGridTwoDay', 'resourceTimeGridFiveDay', 'resourceTimeGridWeek'],
          })}
          <CodeButton
            onPress={() => setActiveDialog({
              label: 'Resource Time Grid',
              themeName: props.themeName as ThemeName,
              paletteName: props.paletteName,
              colorScheme: props.colorScheme as ColorScheme,
              pluginMap: {
                'resourceTimeGridPlugin': '@fullcalendar/react-scheduler/resource-timegrid',
              },
              isScheduler: true,
              availableViews: ['resourceTimeGridDay', 'resourceTimeGridTwoDay', 'resourceTimeGridFiveDay', 'resourceTimeGridWeek'],
            })}
          />
        </div>
      </div>
    </>
  )
}
