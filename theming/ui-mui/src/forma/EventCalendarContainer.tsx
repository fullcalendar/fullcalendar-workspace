import React, { ReactNode } from 'react'
import Box from '@mui/material/Box'

export interface EventCalendarContainerProps {
  direction: 'ltr' | 'rtl' | undefined
  className: string | undefined
  height: string | number | undefined
  borderless: boolean | undefined
  borderlessX: boolean | undefined
  borderlessTop: boolean | undefined
  borderlessBottom: boolean | undefined
  children: ReactNode
}

export default function EventCalendarContainer(props: EventCalendarContainerProps) {
  const borderlessX = props.borderlessX ?? props.borderless
  const borderlessTop = props.borderlessTop ?? props.borderless
  const borderlessBottom = props.borderlessBottom ?? props.borderless

  return (
    <Box
      dir={props.direction === 'rtl' ? 'rtl' : undefined}
      className={props.className}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: props.height,
        bgcolor: 'background.paper',
        borderStyle: 'solid',
        borderColor: 'divider',
        borderLeftWidth: borderlessX ? 0 : 1,
        borderRightWidth: borderlessX ? 0 : 1,
        borderTopWidth: borderlessTop ? 0 : 1,
        borderBottomWidth: borderlessBottom ? 0 : 1,
        ...(borderlessX || borderlessTop || borderlessBottom ? {} : {
          borderRadius: 1,
          overflow: 'hidden',
        })
      }}
    >
      {props.children}
    </Box>
  )
}
