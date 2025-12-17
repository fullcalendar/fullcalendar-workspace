import React from 'react'
import { CalendarController } from '@fullcalendar/core'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ToggleButton from '@mui/material/ToggleButton'
import { EventCalendarPrevIcon, EventCalendarNextIcon } from './icons.js'

export interface EventCalendarToolbarProps {
  controller: CalendarController
  availableViews: string[]
  addButton?: {
    isPrimary?: boolean
    text?: string
    hint?: string
    click?: (ev: MouseEvent) => void
  }
}

export default function EventCalendarToolbar({
  controller,
  availableViews,
  addButton,
}: EventCalendarToolbarProps) {
  const buttons = controller.getButtonState()

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1,
        padding: 1.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexShrink: 0,
          alignItems: 'center',
          gap: 1,
        }}
      >
        {addButton && (
          <Button
            onClick={addButton.click as any}
            aria-label={addButton.hint}
            variant={addButton.isPrimary === false ? 'outlined' : 'contained'}
          >{addButton.text}</Button>
        )}
        <Button
          onClick={() => controller.today()}
          aria-label={buttons.today.hint}
          variant="outlined"
        >{buttons.today.text}</Button>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <IconButton
            onClick={() => controller.prev()}
            disabled={buttons.prev.isDisabled}
            aria-label={buttons.prev.hint}
          >
            <EventCalendarPrevIcon />
          </IconButton>
          <IconButton
            onClick={() => controller.next()}
            disabled={buttons.next.isDisabled}
            aria-label={buttons.next.hint}
          >
            <EventCalendarNextIcon />
          </IconButton>
        </Box>
        <Typography variant="h5">{controller.view?.title}</Typography>
      </Box>
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
            <Box sx={{ px: 1 }}>
              {buttons[availableView]?.text}
            </Box>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  )
}

