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
import { DEFAULT_DATA_ATTRIBUTE } from './demo-generator-util.js'
import { ColorScheme, ThemeName } from './config.js'
import { getCompiledEventCalendar, getCompiledScheduler, getForkedAppCode, getPaletteCss, getStockAppCode, getThemeCss } from './demo-generator-code.js'

/*
TODO: redirect for MUI and Shadcn
*/

export interface DemoGeneratorProps {
  uiName: 'default' | 'shadcn' | 'mui',
  themeName: string,
  paletteName: string,
  colorScheme: string,
  renderEventCalendar: (props: EventCalendarProps) => ReactNode
  renderResourceTimeline: (props: SchedulerProps) => ReactNode
  renderResourceTimeGrid: (props: SchedulerProps) => ReactNode
}

interface CodeDialogParams {
  uiName: 'default' | 'shadcn' | 'mui'
  themeName: ThemeName
  paletteName: string
  colorScheme: 'light' | 'dark'
  isScheduler: boolean
  pluginMap: Record<string, string>
  availableViews: string[]
  initialView?: string
}

function CodeFileTabs({ sourceFiles }: { sourceFiles: Record<string, string> }) {
  const filenames = Object.keys(sourceFiles)
  const [activeFilename, setActiveFilename] = useState(filenames[0])
  const effectiveFilename = filenames.includes(activeFilename) ? activeFilename : filenames[0]
  const activeCode = sourceFiles[effectiveFilename] ?? ''
  const copyWrapperRef = useRef<HTMLDivElement>(null)
  const tabGroupRef = useRef<any>(null)

  useEffect(() => {
    if (!filenames.includes(activeFilename)) {
      setActiveFilename(filenames[0])
      tabGroupRef.current?.show(filenames[0])
    }
  }, [filenames.join(',')])

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
      <SlTabGroup ref={tabGroupRef} onSlTabShow={(e: any) => setActiveFilename(e.detail.name)}>
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
  const [styling, setStyling] = useState('tailwind')

  function resetForm() {
    setIsFork(false)
    setColorSchemeTechnique('component-prop')
    setDataAttribute(DEFAULT_DATA_ATTRIBUTE)
    setStyling('tailwind')
  }

  const sourceFiles: Record<string, string> = {}

  const effectiveDataAttribute = VALID_IDENTIFIER_RE.test(dataAttribute) ? dataAttribute : DEFAULT_DATA_ATTRIBUTE

  if (activeDialog) {
    sourceFiles['app.tsx'] = isFork
      ? getForkedAppCode({
          colorScheme: activeDialog?.colorScheme,
          colorSchemeTechnique,
          colorSchemeDataAttribute: effectiveDataAttribute,
          isScheduler: activeDialog?.isScheduler,
          pluginMap: activeDialog?.pluginMap,
          availableViews: activeDialog?.availableViews,
          initialView: activeDialog?.initialView,
        })
      : getStockAppCode({
          themeName: activeDialog?.themeName,
          paletteName: activeDialog?.paletteName,
          colorScheme: activeDialog?.colorScheme,
          colorSchemeTechnique,
          colorSchemeDataAttribute: effectiveDataAttribute,
          isScheduler: activeDialog?.isScheduler,
          pluginMap: activeDialog?.pluginMap,
          availableViews: activeDialog?.availableViews,
          initialView: activeDialog?.initialView,
        })

    if (isFork) {
      if (activeDialog.isScheduler) {
        sourceFiles['scheduler.tsx'] = getCompiledScheduler(activeDialog.themeName)
      }

      const needsThemeCss = styling !== 'tailwind'

      sourceFiles['event-calendar.tsx'] = getCompiledEventCalendar(activeDialog.themeName, needsThemeCss)

      if (needsThemeCss) {
        sourceFiles['theme.css'] = getThemeCss(activeDialog.themeName)
      }
    }

    if (
      isFork || (
        colorSchemeTechnique !== 'component-prop' &&
        !(colorSchemeTechnique === 'data-attribute' && effectiveDataAttribute === DEFAULT_DATA_ATTRIBUTE)
      )
    ) {
      const paletteCss = getPaletteCss(
        activeDialog.themeName,
        activeDialog.paletteName,
        colorSchemeTechnique === 'data-attribute' ? dataAttribute : '',
        colorSchemeTechnique === 'class-name',
        colorSchemeTechnique === 'media-query',
      )
      if (paletteCss) {
        sourceFiles['palette.css'] = paletteCss
      }
    }
  }

  const isCustomUi = activeDialog?.uiName === 'shadcn' || activeDialog?.uiName === 'mui'
  const customUiDocsUrl = activeDialog?.uiName === 'mui'
    ? 'https://v7.fullcalendar.io/mui'
    : activeDialog?.uiName === 'shadcn'
      ? 'https://v7.fullcalendar.io/shadcn'
      : undefined

  return (
    <SlDialog
      label={(activeDialog?.isScheduler ? 'Scheduler' : 'Event Calendar') + ' Code'}
      open={activeDialog !== null}
      onSlAfterHide={onClose}
      style={{ '--width': '860px' } as React.CSSProperties}
    >
      {!isCustomUi && (
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
              <SlRadioButton value='vanilla' disabled>
                Vanilla
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
                <div className='demo-dialog-field-note'>This technique is simple but may result in a FOUC.</div>
              )}
              {colorSchemeTechnique === 'data-attribute' && (
                <div className='demo-dialog-field-input-row'>
                  <SlInput label='Data Attribute' size='small' value={dataAttribute} onSlInput={(e: any) => setDataAttribute(e.target.value)} />
                  <SlButton size='small' variant='default' onClick={() => setDataAttribute(DEFAULT_DATA_ATTRIBUTE)}>Reset</SlButton>
                </div>
              )}
              {colorSchemeTechnique === 'data-attribute' && !VALID_IDENTIFIER_RE.test(dataAttribute) && (
                <div className='demo-dialog-field-error'>This data attribute is invalid</div>
              )}
              {colorSchemeTechnique === 'data-attribute' && VALID_IDENTIFIER_RE.test(dataAttribute) && dataAttribute !== DEFAULT_DATA_ATTRIBUTE && !isFork && (
                <div className='demo-dialog-field-note'>A non-default data attribute requires a forked palette.css</div>
              )}
            </div>
            {isFork && (
            <div className='demo-dialog-field'>
              <SlRadioGroup label='Styling' value={styling} size='small' onSlChange={(e: any) => setStyling(e.target.value)}>
                <SlRadioButton value='tailwind'>Tailwind</SlRadioButton>
                <SlRadioButton value='global-css'>Global CSS</SlRadioButton>
                <SlRadioButton value='css-module'>CSS Module</SlRadioButton>
              </SlRadioGroup>
              {styling === 'global-css' && (
                <div className='demo-dialog-field-warning'>The readability of selectors needs improving.</div>
              )}
              {styling === 'css-module' && (
                <div className='demo-dialog-field-error'>Not yet available. Use Global CSS instead.</div>
              )}
            </div>
            )}
          </div>
        </div>
      )}
      {customUiDocsUrl && (
        <p className='demo-dialog-custom-ui-link'>For more info, visit <a href={customUiDocsUrl} target='_blank'>{customUiDocsUrl}</a></p>
      )}
      {!isCustomUi && activeDialog && <CodeFileTabs sourceFiles={sourceFiles} />}
      {!isCustomUi && <SlButton slot='footer' variant='default' onClick={resetForm}>Reset All</SlButton>}
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
            plugins: [
              scrollGridPlugin,
              adaptivePlugin,
            ],
          })}
          <CodeButton
            onPress={() => setActiveDialog({
              uiName: props.uiName,
              themeName: props.themeName as ThemeName,
              paletteName: props.paletteName,
              colorScheme: props.colorScheme as ColorScheme,
              isScheduler: false,
              pluginMap: {
                'dayGridPlugin': '@fullcalendar/react/daygrid',
                'timeGridPlugin': '@fullcalendar/react/timegrid',
                'listPlugin': '@fullcalendar/react/list',
                'multiMonthPlugin': '@fullcalendar/react/multimonth',
              },
              availableViews: ['dayGridMonth', 'timeGridWeek', 'timeGridDay', 'listWeek', 'multiMonthYear'],
            })}
          />
        </div>

        <div className='demo-item'>
          {props.renderEventCalendar({
            ...eventCalendarProps,
            initialView: 'timeGridWeek',
            availableViews: ['timeGridWeek', 'timeGridDay', 'dayGridMonth'],
            plugins: [
              scrollGridPlugin,
              adaptivePlugin,
            ],
          })}
          <CodeButton
            onPress={() => setActiveDialog({
              uiName: props.uiName,
              themeName: props.themeName as ThemeName,
              paletteName: props.paletteName,
              colorScheme: props.colorScheme as ColorScheme,
              isScheduler: false,
              pluginMap: {
                'timeGridPlugin': '@fullcalendar/react/timegrid',
                'dayGridPlugin': '@fullcalendar/react/daygrid',
              },
              availableViews: ['timeGridWeek', 'timeGridDay', 'dayGridMonth'],
            })}
          />
        </div>

        <div className='demo-item'>
          {props.renderEventCalendar({
            ...eventCalendarProps,
            initialView: 'multiMonthYear',
            availableViews: ['multiMonthYear'],
            plugins: [
              scrollGridPlugin,
              adaptivePlugin,
            ],
          })}
          <CodeButton
            onPress={() => setActiveDialog({
              uiName: props.uiName,
              themeName: props.themeName as ThemeName,
              paletteName: props.paletteName,
              colorScheme: props.colorScheme as ColorScheme,
              isScheduler: false,
              pluginMap: {
                'multiMonthPlugin': '@fullcalendar/react/multimonth',
              },
              availableViews: ['multiMonthYear'],
            })}
          />
        </div>

        <div className='demo-item'>
          {props.renderEventCalendar({
            ...eventCalendarProps,
            multiMonthMaxColumns: 1,
            initialView: 'multiMonthYear',
            availableViews: ['multiMonthYear'],
            plugins: [
              scrollGridPlugin,
              adaptivePlugin,
            ],
          })}
          <CodeButton
            onPress={() => setActiveDialog({
              uiName: props.uiName,
              themeName: props.themeName as ThemeName,
              paletteName: props.paletteName,
              colorScheme: props.colorScheme as ColorScheme,
              isScheduler: false,
              pluginMap: {
                'multiMonthPlugin': '@fullcalendar/react/multimonth',
              },
              availableViews: ['multiMonthYear'],
            })}
          />
        </div>

        <div className='demo-item'>
          {props.renderEventCalendar({
            ...eventCalendarProps,
            initialView: 'dayGridYear',
            availableViews: ['dayGridYear'],
            plugins: [
              scrollGridPlugin,
              adaptivePlugin,
            ],
          })}
          <CodeButton
            onPress={() => setActiveDialog({
              uiName: props.uiName,
              themeName: props.themeName as ThemeName,
              paletteName: props.paletteName,
              colorScheme: props.colorScheme as ColorScheme,
              isScheduler: false,
              pluginMap: {
                'dayGridPlugin': '@fullcalendar/react/daygrid',
              },
              availableViews: ['dayGridYear'],
            })}
          />
        </div>

        <div className='demo-item'>
          {props.renderEventCalendar({
            ...eventCalendarProps,
            initialView: 'listYear',
            availableViews: ['listYear', 'listMonth', 'listWeek'],
            plugins: [
              scrollGridPlugin,
              adaptivePlugin,
            ],
            listText: '',
          })}
          <CodeButton
            onPress={() => setActiveDialog({
              uiName: props.uiName,
              themeName: props.themeName as ThemeName,
              paletteName: props.paletteName,
              colorScheme: props.colorScheme as ColorScheme,
              isScheduler: false,
              pluginMap: {
                'listPlugin': '@fullcalendar/react/list',
              },
              availableViews: ['listYear', 'listMonth', 'listWeek'],
            })}
          />
        </div>

        <div className='demo-item'>
          {props.renderResourceTimeline({
            ...resourceTimelineProps,
            availableViews: ['resourceTimelineDay', 'resourceTimelineThreeDay', 'resourceTimelineWeek'],
            initialView: 'resourceTimelineWeek',
          })}
          <CodeButton
            onPress={() => setActiveDialog({
              uiName: props.uiName,
              themeName: props.themeName as ThemeName,
              paletteName: props.paletteName,
              colorScheme: props.colorScheme as ColorScheme,
              isScheduler: true,
              pluginMap: {
                'resourceTimelinePlugin': '@fullcalendar/react-scheduler/resource-timeline',
              },
              availableViews: ['resourceTimelineDay', 'resourceTimelineWeek'],
              initialView: 'resourceTimelineWeek',
            })}
          />
        </div>

        <div className='demo-item'>
          {props.renderResourceTimeGrid({
            ...vResourceProps,
            availableViews: ['resourceTimeGridDay', 'resourceTimeGridTwoDay', 'resourceTimeGridFiveDay', 'resourceTimeGridWeek'],
            initialView: 'resourceTimeGridFiveDay',
          })}
          <CodeButton
            onPress={() => setActiveDialog({
              uiName: props.uiName,
              themeName: props.themeName as ThemeName,
              paletteName: props.paletteName,
              colorScheme: props.colorScheme as ColorScheme,
              isScheduler: true,
              pluginMap: {
                'resourceTimeGridPlugin': '@fullcalendar/react-scheduler/resource-timegrid',
              },
              availableViews: ['resourceTimeGridDay', 'resourceTimeGridWeek'],
              initialView: 'resourceTimeGridWeek',
            })}
          />
        </div>
      </div>
    </>
  )
}
