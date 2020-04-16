/*
printing bugs:
   - FF switches back to non-print too quickly
   - IE11 doesn't work at all

TEST in other browsers now that we don't doHacks
IMPLEMENT forPrint in SimpleScrollGrid
FREEZING happens sometimes, window resize
*/

import { render, h, Fragment, ComponentContextType, Calendar, SimpleScrollGrid, OptionsInput } from '@fullcalendar/core'
import { ScrollGrid } from '@fullcalendar/scrollgrid'
import dayGridPlugin from '@fullcalendar/daygrid' // we don't use. initializing Calendar requires one view plugin

let doSimple = false
let doVGrow = true
let options: OptionsInput = {
  direction: 'ltr',
  themeSystem: 'standard',
  plugins: [ dayGridPlugin ]
}

document.addEventListener('DOMContentLoaded', function() {
  let el = document.getElementById('scrollgrid-wrap')
  let fakeCalendar = new Calendar(document.createElement('div'), options)
  fakeCalendar.render()

  function renderStuff(forPrint) {
    el.className = fakeCalendar.el.className + (doVGrow ? ' scrollgrid-wrap--vgrow' : '') // sync classNames
    let content = doSimple ? renderSimpleScrollGrid(doVGrow, forPrint) : renderScrollGrid(doVGrow, forPrint)

    render(
      <ComponentContextType.Provider value={null /* BROKEN! */}>
        {content}
      </ComponentContextType.Provider>,
      el
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
      liquid={isLiquid}
      forPrint={forPrint}
      colGroups={[
        { width: 150, cols: [
          { width: 'shrink' },
          { width: 200 }
        ] },
        { cols: [
          { minWidth: 2000 },
          { minWidth: 2000 }
        ] }
      ]}
      sections={[
        {
          type: 'header',
          chunks: [
            { rowContent: (
              <Fragment>
                <tr>
                  <th class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame'>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>All-Dayyyy</div>
                    </div>
                  </th>
                  <th>
                    <div class='cell-padding'>su</div>
                  </th>
                </tr>
              </Fragment>
            ) },
            { rowContent: (
              <Fragment>
                <tr>
                  <th><div class='cell-padding'><span class='fc-sticky' style='display:inline-block'>Monday</span></div></th>
                  <th><div class='cell-padding'><span class='fc-sticky' style='display:inline-block'>Tuesday</span></div></th>
                </tr>
                <tr>
                  <th><div class='cell-padding'><span class='fc-sticky' style='display:inline-block'>Monday</span></div></th>
                  <th><div class='cell-padding'><span class='fc-sticky' style='display:inline-block'>Tuesday</span></div></th>
                </tr>
              </Fragment>
            ) }
          ]
        },
        {
          type: 'body',
          maxHeight: 100,
          chunks: [
            { rowContent: (
              <Fragment>
                <tr>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame'>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>haaii</div>
                    </div>
                  </td>
                  <td>
                    <div class='cell-padding'>su</div>
                  </td>
                </tr>
              </Fragment>
            ) },
            { rowContent: (
              <Fragment>
                <tr><td>
                  <div class='cell-padding'>
                    yo<br />
                    yo<br />
                    yo<br />
                    yo<br />
                    yo<br />
                    yo<br />
                    yo<br />
                    yo<br />
                    yo<br />
                    yo<br />
                    yo<br />
                  </div>
                </td><td>
                  <div class='cell-padding'>
                    yo<br />
                    yo<br />
                    yo<br />
                    yo<br />
                    yo<br />
                    yo<br />
                    yo<br />
                    yo<br />
                    yo<br />
                    yo<br />
                    yo<br />
                  </div>
                </td></tr>
              </Fragment>
            ) }
          ]
        },
        {
          type: 'body',
          liquid: true,
          expandRows: true,
          chunks: [
            { rowContent: (contentArg) => (
              <Fragment>
                <tr>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame' style={{ height: contentArg.rowSyncHeights[0] }}>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>
                        whatev
                      </div>
                    </div>
                  </td>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame' style={{ height: contentArg.rowSyncHeights[0] }}>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>
                        su
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame' style={{ height: contentArg.rowSyncHeights[1] }}>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>
                        whatev
                      </div>
                    </div>
                  </td>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame' style={{ height: contentArg.rowSyncHeights[1] }}>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>
                        su
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame' style={{ height: contentArg.rowSyncHeights[2] }}>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>
                        whatev<br />whatev<br />whatever<br />whatever<br />whatever<br />what
                      </div>
                    </div>
                  </td>
                  <td rowSpan={3}>
                    <div class='vgrow'>{/* for cells with rowspan, cant use cell-content wrap (used for row height syncing). always use an inner vgrow */}
                      <div class='cell-padding fc-sticky'>su</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame' style={{ height: contentArg.rowSyncHeights[3] }}>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>
                        su
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame' style={{ height: contentArg.rowSyncHeights[4] }}>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>
                        su
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame' style={{ height: contentArg.rowSyncHeights[5] }}>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>
                        whatev
                      </div>
                    </div>
                  </td>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame' style={{ height: contentArg.rowSyncHeights[5] }}>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>
                        su
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame' style={{ height: contentArg.rowSyncHeights[6] }}>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>
                        whatev
                      </div>
                    </div>
                  </td>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame' style={{ height: contentArg.rowSyncHeights[6] }}>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>
                        su
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame' style={{ height: contentArg.rowSyncHeights[7] }}>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>
                        whatev
                      </div>
                    </div>
                  </td>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame' style={{ height: contentArg.rowSyncHeights[7] }}>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>
                        su
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame' style={{ height: contentArg.rowSyncHeights[8] }}>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>
                        whatev
                      </div>
                    </div>
                  </td>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame' style={{ height: contentArg.rowSyncHeights[8] }}>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>
                        su
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame' style={{ height: contentArg.rowSyncHeights[9] }}>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>
                        whatev
                      </div>
                    </div>
                  </td>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame' style={{ height: contentArg.rowSyncHeights[9] }}>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>
                        su
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame' style={{ height: contentArg.rowSyncHeights[10] }}>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>
                        whatev
                      </div>
                    </div>
                  </td>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame' style={{ height: contentArg.rowSyncHeights[10] }}>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>
                        su
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame' style={{ height: contentArg.rowSyncHeights[11] }}>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>
                        whatev
                      </div>
                    </div>
                  </td>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame' style={{ height: contentArg.rowSyncHeights[11] }}>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>
                        su
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame' style={{ height: contentArg.rowSyncHeights[12] }}>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>
                        whatev
                      </div>
                    </div>
                  </td>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame' style={{ height: contentArg.rowSyncHeights[12] }}>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>
                        su
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame' style={{ height: contentArg.rowSyncHeights[13] }}>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>
                        whatev
                      </div>
                    </div>
                  </td>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame' style={{ height: contentArg.rowSyncHeights[13] }}>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>
                        su
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame' style={{ height: contentArg.rowSyncHeights[14] }}>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>
                        whatev
                      </div>
                    </div>
                  </td>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame' style={{ height: contentArg.rowSyncHeights[14] }}>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>
                        su
                      </div>
                    </div>
                  </td>
                </tr>
              </Fragment>
            ) },
            {
              scrollerElRef: handleScrollerEl,
              content: (contentArg) => {
                return (
                  <table class='vgrow' style={{ minWidth: contentArg.tableMinWidth, width: contentArg.clientWidth, height: contentArg.clientHeight }}>
                    {contentArg.tableColGroupNode}
                    <tbody>
                      <tr>
                        <td>
                          <div style={{ height: contentArg.rowSyncHeights[0] }}>
                            <div class='cell-padding'><span class='fc-sticky' style='display:inline-block'>event1</span></div>
                          </div>
                        </td>
                        <td>
                          <div style={{ height: contentArg.rowSyncHeights[0] }}>
                            <div class='cell-padding'>event2</div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div style={{ height: contentArg.rowSyncHeights[1] }}>
                            <div class='cell-padding'>event1<br />event1<br />event1</div>
                          </div>
                        </td>
                        <td>
                          <div style={{ height: contentArg.rowSyncHeights[1] }}>
                            <div class='cell-padding'>event2</div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div style={{ height: contentArg.rowSyncHeights[2] }}>
                            <div class='cell-padding'>event1</div>
                          </div>
                        </td>
                        <td>
                          <div style={{ height: contentArg.rowSyncHeights[2] }}>
                            <div class='cell-padding'>event2</div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div style={{ height: contentArg.rowSyncHeights[3] }}>
                            <div class='cell-padding'>event1</div>
                          </div>
                        </td>
                        <td>
                          <div style={{ height: contentArg.rowSyncHeights[3] }}>
                            <div class='cell-padding'>event2</div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div style={{ height: contentArg.rowSyncHeights[4] }}>
                            <div class='cell-padding'>event1</div>
                          </div>
                        </td>
                        <td>
                          <div style={{ height: contentArg.rowSyncHeights[4] }}>
                            <div class='cell-padding'>event2</div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div style={{ height: contentArg.rowSyncHeights[5] }}>
                            <div class='cell-padding'>event1</div>
                          </div>
                        </td>
                        <td>
                          <div style={{ height: contentArg.rowSyncHeights[5] }}>
                            <div class='cell-padding'>event2</div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div style={{ height: contentArg.rowSyncHeights[6] }}>
                            <div class='cell-padding'>event1</div>
                          </div>
                        </td>
                        <td>
                          <div style={{ height: contentArg.rowSyncHeights[6] }}>
                            <div class='cell-padding'>event2</div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div style={{ height: contentArg.rowSyncHeights[7] }}>
                            <div class='cell-padding'>event1</div>
                          </div>
                        </td>
                        <td>
                          <div style={{ height: contentArg.rowSyncHeights[7] }}>
                            <div class='cell-padding'>event2</div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div style={{ height: contentArg.rowSyncHeights[8] }}>
                            <div class='cell-padding'>event1</div>
                          </div>
                        </td>
                        <td>
                          <div style={{ height: contentArg.rowSyncHeights[8] }}>
                            <div class='cell-padding'>event2</div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div style={{ height: contentArg.rowSyncHeights[9] }}>
                            <div class='cell-padding'>event1</div>
                          </div>
                        </td>
                        <td>
                          <div style={{ height: contentArg.rowSyncHeights[9] }}>
                            <div class='cell-padding'>event2</div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div style={{ height: contentArg.rowSyncHeights[10] }}>
                            <div class='cell-padding'>event1</div>
                          </div>
                        </td>
                        <td>
                          <div style={{ height: contentArg.rowSyncHeights[10] }}>
                            <div class='cell-padding'>event2</div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div style={{ height: contentArg.rowSyncHeights[11] }}>
                            <div class='cell-padding'>event1</div>
                          </div>
                        </td>
                        <td>
                          <div style={{ height: contentArg.rowSyncHeights[11] }}>
                            <div class='cell-padding'>event2</div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div style={{ height: contentArg.rowSyncHeights[12] }}>
                            <div class='cell-padding'>event1</div>
                          </div>
                        </td>
                        <td>
                          <div style={{ height: contentArg.rowSyncHeights[12] }}>
                            <div class='cell-padding'>event2</div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div style={{ height: contentArg.rowSyncHeights[13] }}>
                            <div class='cell-padding'>event1</div>
                          </div>
                        </td>
                        <td>
                          <div style={{ height: contentArg.rowSyncHeights[13] }}>
                            <div class='cell-padding'>event2</div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div style={{ height: contentArg.rowSyncHeights[14] }}>
                            <div class='cell-padding'>event1</div>
                          </div>
                        </td>
                        <td>
                          <div style={{ height: contentArg.rowSyncHeights[14] }}>
                            <div class='cell-padding'>event2</div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )
              }
            }
          ]
        },
        {
          type: 'footer',
          chunks: [
            { rowContent: (
              <Fragment>
                <tr>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame'>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>
                        All-Day
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class='cell-padding'>su</div>
                  </td>
                </tr>
              </Fragment>
            ) },
            { rowContent: (
              <Fragment>
                <tr>
                  <td><div class='cell-padding'>Monday</div></td>
                  <td><div class='cell-padding'>Tuesday</div></td>
                </tr>
              </Fragment>
             ) }
          ]
        }
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
      liquid={isLiquid}
      forPrint={forPrint}
      cols={[
        {},
        { width: 'shrink' }
      ]}
      sections={[
        {
          type: 'header',
          chunk: {
            rowContent: (
              <tr>
                <th>
                  <div class='cell-padding'>this is cool</div>
                </th>
                <th class='fc-scrollgrid-shrink'>
                  <div class='fc-scrollgrid-shrink-frame'>
                    <div class='fc-scrollgrid-shrink-cushion cell-padding'>yup</div>
                  </div>
                </th>
              </tr>
            )
          }
        },
        {
          type: 'body',
          liquid: true,
          expandRows: true,
          chunk: {
            rowContent: (
              <Fragment>
                <tr>
                  <td>
                    <div class='cell-padding'>this is cool</div>
                  </td>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame'>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>yup</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class='cell-padding'>this is cool</div>
                  </td>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame'>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>yuuuuup</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class='cell-padding'>this is cool</div>
                  </td>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame'>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>yup</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class='cell-padding'>this is cool</div>
                  </td>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame'>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>yup</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class='cell-padding'>this is cool</div>
                  </td>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame'>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>yup</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class='cell-padding'>this is cool</div>
                  </td>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame'>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>yup</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class='cell-padding'>this is cool</div>
                  </td>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame'>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>yup</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class='cell-padding'>this is cool</div>
                  </td>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame'>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>yup</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class='cell-padding'>this is cool</div>
                  </td>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame'>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>yup</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class='cell-padding'>this is cool</div>
                  </td>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame'>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>yup</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class='cell-padding'>this is cool</div>
                  </td>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame'>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>yup</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class='cell-padding'>this is cool</div>
                  </td>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame'>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>yup</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class='cell-padding'>this is cool</div>
                  </td>
                  <td class='fc-scrollgrid-shrink'>
                    <div class='fc-scrollgrid-shrink-frame'>
                      <div class='fc-scrollgrid-shrink-cushion cell-padding'>yup</div>
                    </div>
                  </td>
                </tr>
              </Fragment>
            )
          }
        }
      ]}
    />
  )
}
