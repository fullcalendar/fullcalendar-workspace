import React, { ReactNode } from 'react'
import Box from '@mui/material/Box'

export interface EventCalendarContainerProps {
  direction: 'ltr' | 'rtl' | undefined
  className: string | undefined
  height: string | number | undefined
  children: ReactNode
}

export default function EventCalendarContainer(props: EventCalendarContainerProps) {
  return (
    <Box
      dir={props.direction === 'rtl' ? 'rtl' : undefined}
      className={props.className}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2.5,
        height: props.height,
      }}
    >
      {props.children}
    </Box>
  )
}
