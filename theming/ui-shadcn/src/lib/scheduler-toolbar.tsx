import React from 'react'
import { CalendarController } from '@fullcalendar/core'

import { Button } from '../ui/button.js'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs.js'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

export interface SchedulerToolbarProps {
  className?: string
  controller: CalendarController
  availableViews: string[]
}

export function SchedulerToolbar({ className, controller, availableViews }: SchedulerToolbarProps) {
  const buttons = controller.getButtonState()

  return (
    <div className={'flex items-center justify-between ' + (className || '')}>
      <div className='flex items-center gap-3'>
        <Button
          onClick={() => alert('Add event...')}
        >Add event</Button>
        <div className='flex items-center'>
          <Button
            onClick={() => controller.today()}
            // disabled={buttons.today.isDisabled} -- too harsh
            aria-label={buttons.today.hint}
            variant='outline'
          >{buttons.today.text}</Button>
          <Button
            onClick={() => controller.prev()}
            disabled={buttons.prev.isDisabled}
            aria-label={buttons.prev.hint}
            variant='ghost'
            size='icon'
          ><ChevronLeftIcon /></Button>
          <Button
            onClick={() => controller.next()}
            disabled={buttons.next.isDisabled}
            aria-label={buttons.next.hint}
            variant='ghost'
            size='icon'
          >
            <ChevronRightIcon />
          </Button>
        </div>
        <div className='text-xl'>{controller.view?.title}</div>
      </div>
      <Tabs value={controller.view?.type}>
        <TabsList>
          {availableViews.map((availableView) => (
            <TabsTrigger
              key={availableView}
              value={availableView}
              onClick={() => controller.changeView(availableView)}
              aria-label={buttons[availableView]?.hint}
            >{buttons[availableView]?.text}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}
