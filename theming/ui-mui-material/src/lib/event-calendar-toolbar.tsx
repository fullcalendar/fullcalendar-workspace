import React from 'react'
import { CalendarController } from '@fullcalendar/core'

import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import Typography from '@mui/material/Typography'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ToggleButton from '@mui/material/ToggleButton'

export interface EventCalendarToolbarProps {
  controller: CalendarController
  availableViews: string[]
}

export function EventCalendarToolbar({ controller, availableViews }: EventCalendarToolbarProps) {
  const buttons = controller.getButtonState()

  return (
    <div className='flex items-center justify-between py-3 px-3'>
      <div className='flex items-center gap-2'>
        <Button
          onClick={() => alert("Add event...")}
          variant="contained"
        >Add event</Button>
        <Button
          onClick={() => controller.today()}
          // disabled={buttons.today.isDisabled} -- too harsh
          aria-label={buttons.today.hint}
          variant="outlined"
        >{buttons.today.text}</Button>
        <div className='flex items-center'>
          <IconButton
            onClick={() => controller.prev()}
            disabled={buttons.prev.isDisabled}
            aria-label={buttons.prev.hint}
          ><ChevronLeftIcon /></IconButton>
          <IconButton
            onClick={() => controller.next()}
            disabled={buttons.next.isDisabled}
            aria-label={buttons.next.hint}
          ><ChevronRightIcon /></IconButton>
        </div>
        <Typography variant="h5">{controller.view?.title}</Typography>
      </div>
      <ToggleButtonGroup
        size="small"
        exclusive
        value={controller.view?.type}
        onChange={(_ev, val) => {
          controller.changeView(val)
        }}
      >
        {availableViews.map((availableView) => (
          <ToggleButton
            key={availableView}
            value={availableView}
            aria-label={buttons[availableView]?.hint}
            color="primary"
          >
            {/* add extra spacing. better way to do this idiomatically in MUI */}
            <span style={{ paddingLeft: 8, paddingRight: 8 }}>
              {buttons[availableView]?.text}
            </span>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </div>
  )
}
