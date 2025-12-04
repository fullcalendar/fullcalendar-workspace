import React from 'react'
import { CalendarController } from '@fullcalendar/core'
import Box, { BoxProps } from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import Typography from '@mui/material/Typography'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ToggleButton from '@mui/material/ToggleButton'

export interface EventCalendarToolbarProps extends BoxProps {
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
  ...boxProps
}: EventCalendarToolbarProps) {
  const buttons = controller.getButtonState()

  return (
    <Box
      {...boxProps}
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1,
        ...boxProps.sx,
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
            <ChevronLeftIcon className='[[dir=rtl]_&]:rotate-180' />
          </IconButton>
          <IconButton
            onClick={() => controller.next()}
            disabled={buttons.next.isDisabled}
            aria-label={buttons.next.hint}
          >
            <ChevronRightIcon className='[[dir=rtl]_&]:rotate-180' />
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
            <span style={{ paddingLeft: 8, paddingRight: 8 }}>
              {buttons[availableView]?.text}
            </span>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  )
}

