/*
printing bugs:
   - FF switches back to non-print too quickly
   - IE11 doesn't work at all

TEST in other browsers now that we don't doHacks
IMPLEMENT forPrint in SimpleScrollGrid
FREEZING happens sometimes, window resize
*/

import { render, createElement, Fragment, ViewContextType, Calendar, SimpleScrollGrid, CalendarOptions } from '@fullcalendar/core'
import { ScrollGrid } from '@fullcalendar/scrollgrid'
import dayGridPlugin from '@fullcalendar/daygrid' // we don't use. initializing Calendar requires one view plugin

let doSimple = false
let doVGrow = true
let options: CalendarOptions = {
  direction: 'ltr',
  themeSystem: 'standard',
  plugins: [dayGridPlugin],
}

document.addEventListener('DOMContentLoaded', () => {
  let el = document.getElementById('scrollgrid-wrap')
  let fakeCalendar = new Calendar(document.createElement('div'), options)
  fakeCalendar.render()

  function renderStuff(forPrint) {
    el.className = fakeCalendar.el.className + (doVGrow ? ' scrollgrid-wrap--vgrow' : '') // sync classNames
    let content = doSimple ? renderSimpleScrollGrid(doVGrow, forPrint) : renderScrollGrid(doVGrow, forPrint)

    render(
      <ViewContextType.Provider value={null /* BROKEN! */}>
        {content}
      </ViewContextType.Provider>,
      el,
    )
  }

  renderStuff(false)
  window.addEventListener('beforeprint', renderStuff.bind(null, true))
  window.addEventListener('afterprint', renderStuff.bind(null, false))
})

// TODO: revive height syncing
// TODO: kill obsolete vgrow

function renderScrollGrid(isLiquid: boolean, forPrint: boolean) {
  return (
    <ScrollGrid
      liquid={isLiquid && !forPrint}
      collapsibleWidth={false}
      colGroups={[
        {
          width: 150,
          cols: [
            { width: 'shrink' },
            { width: 200 },
          ],
        },
        {
          cols: [
            { minWidth: 2000 },
            { minWidth: 2000 },
          ],
        },
      ]}
      sections={[
        {
          type: 'header',
          key: 'header',
          chunks: [
            {
              key: 'a',
              rowContent: (
                <Fragment>
                  <tr>
                    <th className="fc-scrollgrid-shrink">
                      <div className="fc-scrollgrid-shrink-frame">
                        <div className="fc-scrollgrid-shrink-cushion cell-padding">All-Dayyyy</div>
                      </div>
                    </th>
                    <th>
                      <div className="cell-padding">su</div>
                    </th>
                  </tr>
                </Fragment>
              ),
            },
            {
              key: 'b',
              rowContent: (
                <Fragment>
                  <tr>
                    <th>
                      <div className="cell-padding">
                        <span className="fc-sticky" style={{ display: 'inline-block' }}>Monday</span>
                      </div>
                    </th>
                    <th>
                      <div className="cell-padding">
                        <span className="fc-sticky" style={{ display: 'inline-block' }}>Tuesday</span>
                      </div>
                    </th>
                  </tr>
                  <tr>
                    <th>
                      <div className="cell-padding">
                        <span className="fc-sticky" style={{ display: 'inline-block' }}>Monday</span>
                      </div>
                    </th>
                    <th>
                      <div className="cell-padding">
                        <span className="fc-sticky" style={{ display: 'inline-block' }}>Tuesday</span>
                      </div>
                    </th>
                  </tr>
                </Fragment>
              ),
            },
          ],
        },
        {
          type: 'body',
          key: 'body0',
          maxHeight: 100,
          chunks: [
            {
              key: 'a',
              rowContent: (
                <Fragment>
                  <tr>
                    <td className="fc-scrollgrid-shrink">
                      <div className="fc-scrollgrid-shrink-frame">
                        <div className="fc-scrollgrid-shrink-cushion cell-padding">haaii</div>
                      </div>
                    </td>
                    <td>
                      <div className="cell-padding">su</div>
                    </td>
                  </tr>
                </Fragment>
              ),
            },
            {
              key: 'b',
              rowContent: (
                <Fragment>
                  <tr>
                    <td>
                      <div className="cell-padding">
                        yo
                        <br />
                        yo
                        <br />
                        yo
                        <br />
                        yo
                        <br />
                        yo
                        <br />
                        yo
                        <br />
                        yo
                        <br />
                        yo
                        <br />
                        yo
                        <br />
                        yo
                        <br />
                        yo
                        <br />
                      </div>
                    </td>
                    <td>
                      <div className="cell-padding">
                        yo
                        <br />
                        yo
                        <br />
                        yo
                        <br />
                        yo
                        <br />
                        yo
                        <br />
                        yo
                        <br />
                        yo
                        <br />
                        yo
                        <br />
                        yo
                        <br />
                        yo
                        <br />
                        yo
                        <br />
                      </div>
                    </td>
                  </tr>
                </Fragment>
              ),
            },
          ],
        },
        {
          type: 'body',
          key: 'body1',
          liquid: true,
          expandRows: true,
          chunks: [
            {
              key: 'a',
              rowContent: (contentArg) => (
                <Fragment>
                  <tr>
                    <td className="fc-scrollgrid-shrink">
                      <div className="fc-scrollgrid-shrink-frame" style={{ height: contentArg.rowSyncHeights[0] }}>
                        <div className="fc-scrollgrid-shrink-cushion cell-padding">
                          whatev
                        </div>
                      </div>
                    </td>
                    <td className="fc-scrollgrid-shrink">
                      <div className="fc-scrollgrid-shrink-frame" style={{ height: contentArg.rowSyncHeights[0] }}>
                        <div className="fc-scrollgrid-shrink-cushion cell-padding">
                          su
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="fc-scrollgrid-shrink">
                      <div className="fc-scrollgrid-shrink-frame" style={{ height: contentArg.rowSyncHeights[1] }}>
                        <div className="fc-scrollgrid-shrink-cushion cell-padding">
                          whatev
                        </div>
                      </div>
                    </td>
                    <td className="fc-scrollgrid-shrink">
                      <div className="fc-scrollgrid-shrink-frame" style={{ height: contentArg.rowSyncHeights[1] }}>
                        <div className="fc-scrollgrid-shrink-cushion cell-padding">
                          su
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="fc-scrollgrid-shrink">
                      <div className="fc-scrollgrid-shrink-frame" style={{ height: contentArg.rowSyncHeights[2] }}>
                        <div className="fc-scrollgrid-shrink-cushion cell-padding">
                          whatev
                          <br />
                          whatev
                          <br />
                          whatever
                          <br />
                          whatever
                          <br />
                          whatever
                          <br />
                          what
                        </div>
                      </div>
                    </td>
                    <td rowSpan={3}>
                      <div className="vgrow">
                        {/* for cells with rowspan, cant use cell-content wrap (used for row height syncing). always use an inner vgrow */}
                        <div className="cell-padding fc-sticky">su</div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="fc-scrollgrid-shrink">
                      <div className="fc-scrollgrid-shrink-frame" style={{ height: contentArg.rowSyncHeights[3] }}>
                        <div className="fc-scrollgrid-shrink-cushion cell-padding">
                          su
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="fc-scrollgrid-shrink">
                      <div className="fc-scrollgrid-shrink-frame" style={{ height: contentArg.rowSyncHeights[4] }}>
                        <div className="fc-scrollgrid-shrink-cushion cell-padding">
                          su
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="fc-scrollgrid-shrink">
                      <div className="fc-scrollgrid-shrink-frame" style={{ height: contentArg.rowSyncHeights[5] }}>
                        <div className="fc-scrollgrid-shrink-cushion cell-padding">
                          whatev
                        </div>
                      </div>
                    </td>
                    <td className="fc-scrollgrid-shrink">
                      <div className="fc-scrollgrid-shrink-frame" style={{ height: contentArg.rowSyncHeights[5] }}>
                        <div className="fc-scrollgrid-shrink-cushion cell-padding">
                          su
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="fc-scrollgrid-shrink">
                      <div className="fc-scrollgrid-shrink-frame" style={{ height: contentArg.rowSyncHeights[6] }}>
                        <div className="fc-scrollgrid-shrink-cushion cell-padding">
                          whatev
                        </div>
                      </div>
                    </td>
                    <td className="fc-scrollgrid-shrink">
                      <div className="fc-scrollgrid-shrink-frame" style={{ height: contentArg.rowSyncHeights[6] }}>
                        <div className="fc-scrollgrid-shrink-cushion cell-padding">
                          su
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="fc-scrollgrid-shrink">
                      <div className="fc-scrollgrid-shrink-frame" style={{ height: contentArg.rowSyncHeights[7] }}>
                        <div className="fc-scrollgrid-shrink-cushion cell-padding">
                          whatev
                        </div>
                      </div>
                    </td>
                    <td className="fc-scrollgrid-shrink">
                      <div className="fc-scrollgrid-shrink-frame" style={{ height: contentArg.rowSyncHeights[7] }}>
                        <div className="fc-scrollgrid-shrink-cushion cell-padding">
                          su
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="fc-scrollgrid-shrink">
                      <div className="fc-scrollgrid-shrink-frame" style={{ height: contentArg.rowSyncHeights[8] }}>
                        <div className="fc-scrollgrid-shrink-cushion cell-padding">
                          whatev
                        </div>
                      </div>
                    </td>
                    <td className="fc-scrollgrid-shrink">
                      <div className="fc-scrollgrid-shrink-frame" style={{ height: contentArg.rowSyncHeights[8] }}>
                        <div className="fc-scrollgrid-shrink-cushion cell-padding">
                          su
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="fc-scrollgrid-shrink">
                      <div className="fc-scrollgrid-shrink-frame" style={{ height: contentArg.rowSyncHeights[9] }}>
                        <div className="fc-scrollgrid-shrink-cushion cell-padding">
                          whatev
                        </div>
                      </div>
                    </td>
                    <td className="fc-scrollgrid-shrink">
                      <div className="fc-scrollgrid-shrink-frame" style={{ height: contentArg.rowSyncHeights[9] }}>
                        <div className="fc-scrollgrid-shrink-cushion cell-padding">
                          su
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="fc-scrollgrid-shrink">
                      <div className="fc-scrollgrid-shrink-frame" style={{ height: contentArg.rowSyncHeights[10] }}>
                        <div className="fc-scrollgrid-shrink-cushion cell-padding">
                          whatev
                        </div>
                      </div>
                    </td>
                    <td className="fc-scrollgrid-shrink">
                      <div className="fc-scrollgrid-shrink-frame" style={{ height: contentArg.rowSyncHeights[10] }}>
                        <div className="fc-scrollgrid-shrink-cushion cell-padding">
                          su
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="fc-scrollgrid-shrink">
                      <div className="fc-scrollgrid-shrink-frame" style={{ height: contentArg.rowSyncHeights[11] }}>
                        <div className="fc-scrollgrid-shrink-cushion cell-padding">
                          whatev
                        </div>
                      </div>
                    </td>
                    <td className="fc-scrollgrid-shrink">
                      <div className="fc-scrollgrid-shrink-frame" style={{ height: contentArg.rowSyncHeights[11] }}>
                        <div className="fc-scrollgrid-shrink-cushion cell-padding">
                          su
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="fc-scrollgrid-shrink">
                      <div className="fc-scrollgrid-shrink-frame" style={{ height: contentArg.rowSyncHeights[12] }}>
                        <div className="fc-scrollgrid-shrink-cushion cell-padding">
                          whatev
                        </div>
                      </div>
                    </td>
                    <td className="fc-scrollgrid-shrink">
                      <div className="fc-scrollgrid-shrink-frame" style={{ height: contentArg.rowSyncHeights[12] }}>
                        <div className="fc-scrollgrid-shrink-cushion cell-padding">
                          su
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="fc-scrollgrid-shrink">
                      <div className="fc-scrollgrid-shrink-frame" style={{ height: contentArg.rowSyncHeights[13] }}>
                        <div className="fc-scrollgrid-shrink-cushion cell-padding">
                          whatev
                        </div>
                      </div>
                    </td>
                    <td className="fc-scrollgrid-shrink">
                      <div className="fc-scrollgrid-shrink-frame" style={{ height: contentArg.rowSyncHeights[13] }}>
                        <div className="fc-scrollgrid-shrink-cushion cell-padding">
                          su
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="fc-scrollgrid-shrink">
                      <div className="fc-scrollgrid-shrink-frame" style={{ height: contentArg.rowSyncHeights[14] }}>
                        <div className="fc-scrollgrid-shrink-cushion cell-padding">
                          whatev
                        </div>
                      </div>
                    </td>
                    <td className="fc-scrollgrid-shrink">
                      <div className="fc-scrollgrid-shrink-frame" style={{ height: contentArg.rowSyncHeights[14] }}>
                        <div className="fc-scrollgrid-shrink-cushion cell-padding">
                          su
                        </div>
                      </div>
                    </td>
                  </tr>
                </Fragment>
              ),
            },
            {
              key: 'b',
              scrollerElRef: handleScrollerEl,
              content: (contentArg) => (
                <table
                  className="vgrow"
                  style={{ minWidth: contentArg.tableMinWidth, width: contentArg.clientWidth, height: contentArg.clientHeight }}
                >
                  {contentArg.tableColGroupNode}
                  <tbody>
                    <tr>
                      <td>
                        <div style={{ height: contentArg.rowSyncHeights[0] }}>
                          <div className="cell-padding"><span className="fc-sticky" style={{ display: 'inline-block' }}>event1</span></div>
                        </div>
                      </td>
                      <td>
                        <div style={{ height: contentArg.rowSyncHeights[0] }}>
                          <div className="cell-padding">event2</div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div style={{ height: contentArg.rowSyncHeights[1] }}>
                          <div className="cell-padding">
                            event1
                            <br />
                            event1
                            <br />
                            event1
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ height: contentArg.rowSyncHeights[1] }}>
                          <div className="cell-padding">event2</div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div style={{ height: contentArg.rowSyncHeights[2] }}>
                          <div className="cell-padding">event1</div>
                        </div>
                      </td>
                      <td>
                        <div style={{ height: contentArg.rowSyncHeights[2] }}>
                          <div className="cell-padding">event2</div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div style={{ height: contentArg.rowSyncHeights[3] }}>
                          <div className="cell-padding">event1</div>
                        </div>
                      </td>
                      <td>
                        <div style={{ height: contentArg.rowSyncHeights[3] }}>
                          <div className="cell-padding">event2</div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div style={{ height: contentArg.rowSyncHeights[4] }}>
                          <div className="cell-padding">event1</div>
                        </div>
                      </td>
                      <td>
                        <div style={{ height: contentArg.rowSyncHeights[4] }}>
                          <div className="cell-padding">event2</div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div style={{ height: contentArg.rowSyncHeights[5] }}>
                          <div className="cell-padding">event1</div>
                        </div>
                      </td>
                      <td>
                        <div style={{ height: contentArg.rowSyncHeights[5] }}>
                          <div className="cell-padding">event2</div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div style={{ height: contentArg.rowSyncHeights[6] }}>
                          <div className="cell-padding">event1</div>
                        </div>
                      </td>
                      <td>
                        <div style={{ height: contentArg.rowSyncHeights[6] }}>
                          <div className="cell-padding">event2</div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div style={{ height: contentArg.rowSyncHeights[7] }}>
                          <div className="cell-padding">event1</div>
                        </div>
                      </td>
                      <td>
                        <div style={{ height: contentArg.rowSyncHeights[7] }}>
                          <div className="cell-padding">event2</div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div style={{ height: contentArg.rowSyncHeights[8] }}>
                          <div className="cell-padding">event1</div>
                        </div>
                      </td>
                      <td>
                        <div style={{ height: contentArg.rowSyncHeights[8] }}>
                          <div className="cell-padding">event2</div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div style={{ height: contentArg.rowSyncHeights[9] }}>
                          <div className="cell-padding">event1</div>
                        </div>
                      </td>
                      <td>
                        <div style={{ height: contentArg.rowSyncHeights[9] }}>
                          <div className="cell-padding">event2</div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div style={{ height: contentArg.rowSyncHeights[10] }}>
                          <div className="cell-padding">event1</div>
                        </div>
                      </td>
                      <td>
                        <div style={{ height: contentArg.rowSyncHeights[10] }}>
                          <div className="cell-padding">event2</div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div style={{ height: contentArg.rowSyncHeights[11] }}>
                          <div className="cell-padding">event1</div>
                        </div>
                      </td>
                      <td>
                        <div style={{ height: contentArg.rowSyncHeights[11] }}>
                          <div className="cell-padding">event2</div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div style={{ height: contentArg.rowSyncHeights[12] }}>
                          <div className="cell-padding">event1</div>
                        </div>
                      </td>
                      <td>
                        <div style={{ height: contentArg.rowSyncHeights[12] }}>
                          <div className="cell-padding">event2</div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div style={{ height: contentArg.rowSyncHeights[13] }}>
                          <div className="cell-padding">event1</div>
                        </div>
                      </td>
                      <td>
                        <div style={{ height: contentArg.rowSyncHeights[13] }}>
                          <div className="cell-padding">event2</div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div style={{ height: contentArg.rowSyncHeights[14] }}>
                          <div className="cell-padding">event1</div>
                        </div>
                      </td>
                      <td>
                        <div style={{ height: contentArg.rowSyncHeights[14] }}>
                          <div className="cell-padding">event2</div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              ),
            },
          ],
        },
        {
          type: 'footer',
          key: 'footer',
          chunks: [
            {
              key: 'a',
              rowContent: (
                <Fragment>
                  <tr>
                    <td className="fc-scrollgrid-shrink">
                      <div className="fc-scrollgrid-shrink-frame">
                        <div className="fc-scrollgrid-shrink-cushion cell-padding">
                          All-Day
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="cell-padding">su</div>
                    </td>
                  </tr>
                </Fragment>
              ),
            },
            {
              key: 'b',
              rowContent: (
                <Fragment>
                  <tr>
                    <td><div className="cell-padding">Monday</div></td>
                    <td><div className="cell-padding">Tuesday</div></td>
                  </tr>
                </Fragment>
              ),
            },
          ],
        },
      ]}
    />
  )
}

function handleScrollerEl(scrollerEl: HTMLElement) {
  // console.log('scrollerEl', scrollerEl)
}

function renderSimpleScrollGrid(isLiquid: boolean, forPrint: boolean) {
  return (
    <SimpleScrollGrid
      liquid={isLiquid && !forPrint}
      collapsibleWidth={false}
      cols={[
        {},
        { width: 'shrink' },
      ]}
      sections={[
        {
          type: 'header',
          key: 'header',
          chunk: {
            rowContent: (
              <tr>
                <th>
                  <div className="cell-padding">this is cool</div>
                </th>
                <th className="fc-scrollgrid-shrink">
                  <div className="fc-scrollgrid-shrink-frame">
                    <div className="fc-scrollgrid-shrink-cushion cell-padding">yup</div>
                  </div>
                </th>
              </tr>
            ),
          },
        },
        {
          type: 'body',
          key: 'body',
          liquid: true,
          expandRows: true,
          chunk: {
            rowContent: (
              <Fragment>
                <tr>
                  <td>
                    <div className="cell-padding">this is cool</div>
                  </td>
                  <td className="fc-scrollgrid-shrink">
                    <div className="fc-scrollgrid-shrink-frame">
                      <div className="fc-scrollgrid-shrink-cushion cell-padding">yup</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div className="cell-padding">this is cool</div>
                  </td>
                  <td className="fc-scrollgrid-shrink">
                    <div className="fc-scrollgrid-shrink-frame">
                      <div className="fc-scrollgrid-shrink-cushion cell-padding">yuuuuup</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div className="cell-padding">this is cool</div>
                  </td>
                  <td className="fc-scrollgrid-shrink">
                    <div className="fc-scrollgrid-shrink-frame">
                      <div className="fc-scrollgrid-shrink-cushion cell-padding">yup</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div className="cell-padding">this is cool</div>
                  </td>
                  <td className="fc-scrollgrid-shrink">
                    <div className="fc-scrollgrid-shrink-frame">
                      <div className="fc-scrollgrid-shrink-cushion cell-padding">yup</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div className="cell-padding">this is cool</div>
                  </td>
                  <td className="fc-scrollgrid-shrink">
                    <div className="fc-scrollgrid-shrink-frame">
                      <div className="fc-scrollgrid-shrink-cushion cell-padding">yup</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div className="cell-padding">this is cool</div>
                  </td>
                  <td className="fc-scrollgrid-shrink">
                    <div className="fc-scrollgrid-shrink-frame">
                      <div className="fc-scrollgrid-shrink-cushion cell-padding">yup</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div className="cell-padding">this is cool</div>
                  </td>
                  <td className="fc-scrollgrid-shrink">
                    <div className="fc-scrollgrid-shrink-frame">
                      <div className="fc-scrollgrid-shrink-cushion cell-padding">yup</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div className="cell-padding">this is cool</div>
                  </td>
                  <td className="fc-scrollgrid-shrink">
                    <div className="fc-scrollgrid-shrink-frame">
                      <div className="fc-scrollgrid-shrink-cushion cell-padding">yup</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div className="cell-padding">this is cool</div>
                  </td>
                  <td className="fc-scrollgrid-shrink">
                    <div className="fc-scrollgrid-shrink-frame">
                      <div className="fc-scrollgrid-shrink-cushion cell-padding">yup</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div className="cell-padding">this is cool</div>
                  </td>
                  <td className="fc-scrollgrid-shrink">
                    <div className="fc-scrollgrid-shrink-frame">
                      <div className="fc-scrollgrid-shrink-cushion cell-padding">yup</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div className="cell-padding">this is cool</div>
                  </td>
                  <td className="fc-scrollgrid-shrink">
                    <div className="fc-scrollgrid-shrink-frame">
                      <div className="fc-scrollgrid-shrink-cushion cell-padding">yup</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div className="cell-padding">this is cool</div>
                  </td>
                  <td className="fc-scrollgrid-shrink">
                    <div className="fc-scrollgrid-shrink-frame">
                      <div className="fc-scrollgrid-shrink-cushion cell-padding">yup</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div className="cell-padding">this is cool</div>
                  </td>
                  <td className="fc-scrollgrid-shrink">
                    <div className="fc-scrollgrid-shrink-frame">
                      <div className="fc-scrollgrid-shrink-cushion cell-padding">yup</div>
                    </div>
                  </td>
                </tr>
              </Fragment>
            ),
          },
        },
      ]}
    />
  )
}
