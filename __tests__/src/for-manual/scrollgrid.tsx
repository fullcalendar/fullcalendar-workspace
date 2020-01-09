/*
printing bugs:
   - FF switches back to non-print too quickly
   - IE11 doesn't work at all

BROKEN: doVGrow=false, horizontal scrolling
TEST in other browsers now that we don't doHacks
IMPLEMENT forPrint in SimpleScrollGrid
FREEZING happens sometimes, window resize
BUG sometimes scroll joining just dies

NOTES:
  cell-content-wrap can't contain a sticky (creates new bounding)
  shrink should be on .cell-content.shrink
  fine because sticky always happens in a rowSpan td, which we dont want to control height
*/

import { render, h, Fragment, ComponentContextType, Calendar, ScrollGrid, SimpleScrollGrid, OptionsInput } from 'fullcalendar-scheduler'

let doSimple = false
let doVGrow = true
let options: OptionsInput = {
  dir: 'ltr',
  themeSystem: 'standard'
}

document.addEventListener('DOMContentLoaded', function() {
  let el = document.getElementById('scrollgrid-wrap')
  let fakeCalendar = new Calendar(document.createElement('div'), options)
  fakeCalendar.render()

  function renderStuff(forPrint) {
    el.className = fakeCalendar.el.className + (doVGrow ? ' scrollgrid-wrap--vgrow' : '') // sync classNames
    let content = doSimple ? renderSimpleScrollGrid(doVGrow, forPrint) : renderScrollGrid(doVGrow, forPrint)

    render(
      <ComponentContextType.Provider value={fakeCalendar.context}>
        {content}
      </ComponentContextType.Provider>,
      el
    )
  }

  renderStuff(false)
  window.addEventListener('beforeprint', renderStuff.bind(null, true))
  window.addEventListener('afterprint', renderStuff.bind(null, false))
})


function renderScrollGrid(vGrow: boolean, forPrint: boolean) {
  return (
    <ScrollGrid
      vGrow={vGrow}
      forPrint={forPrint}
      needsSizing={false}
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
          type: 'head',
          chunks: [
            { vGrowRows: true, rowContent: (
              <Fragment>
                <tr><th><div class='cell-content shrink'>All-Dayyyy</div></th><th><div class='cell-content'>su</div></th></tr>
              </Fragment>
            ) },
            { rowContent: (
              <Fragment>
                <tr><th><div class='cell-content'><span class='fc-sticky' style='display:inline-block'>Monday</span></div></th><th><div class='cell-content'><span class='fc-sticky' style='display:inline-block'>Tuesday</span></div></th></tr>
                <tr><th><div class='cell-content'><span class='fc-sticky' style='display:inline-block'>Monday</span></div></th><th><div class='cell-content'><span class='fc-sticky' style='display:inline-block'>Tuesday</span></div></th></tr>
              </Fragment>
            ) }
          ]
        },
        {
          type: 'body',
          maxHeight: 100,
          chunks: [
            { vGrowRows: true, rowContent: (
              <Fragment>
                <tr><td><div class='cell-content shrink'>hai</div></td><td><div class='cell-content'>su</div></td></tr>
              </Fragment>
            ) },
            { rowContent: (
              <Fragment>
                <tr><td>
                  <div class='cell-content'>
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
                  <div class='cell-content'>
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
          vGrow: true,
          vGrowRows: true,
          syncRowHeights: true,
          chunks: [
            { rowContent: (
              <Fragment>
                <tr><td><div class='cell-content-wrap'><div class='cell-content shrink'>whatev</div></div></td><td><div class='cell-content-wrap'><div class='cell-content'>su</div></div></td></tr>
                <tr><td><div class='cell-content-wrap'><div class='cell-content shrink'>whatev</div></div></td><td><div class='cell-content-wrap'><div class='cell-content'>su</div></div></td></tr>
                <tr>
                  <td>
                    <div class='cell-content-wrap'>
                      <div class='cell-content shrink'>
                        whatev<br />whatev<br />whatever<br />whatever<br />whatever<br />what
                      </div>
                    </div>
                  </td>
                  <td rowSpan={3}>
                    <div class='vgrow'>{/* for cells with rowspan, cant use cell-content wrap (used for row height syncing). always use an inner vgrow */}
                      <div class='cell-content fc-sticky'>su</div>
                    </div>
                  </td>
                </tr>
                <tr><td><div class='cell-content-wrap'><div class='cell-content shrink'>whatev</div></div></td></tr>
                <tr><td><div class='cell-content-wrap'><div class='cell-content shrink'>whatev</div></div></td></tr>
                <tr><td><div class='cell-content-wrap'><div class='cell-content shrink'>whatev</div></div></td><td><div class='cell-content-wrap'><div class='cell-content'>su</div></div></td></tr>
                <tr><td><div class='cell-content-wrap'><div class='cell-content shrink'>whatev</div></div></td><td><div class='cell-content-wrap'><div class='cell-content'>su</div></div></td></tr>
                <tr><td><div class='cell-content-wrap'><div class='cell-content shrink'>whatev</div></div></td><td><div class='cell-content-wrap'><div class='cell-content'>su</div></div></td></tr>
                <tr><td><div class='cell-content-wrap'><div class='cell-content shrink'>whatev</div></div></td><td><div class='cell-content-wrap'><div class='cell-content'>su</div></div></td></tr>
                <tr><td><div class='cell-content-wrap'><div class='cell-content shrink'>whatev</div></div></td><td><div class='cell-content-wrap'><div class='cell-content'>su</div></div></td></tr>
                <tr><td><div class='cell-content-wrap'><div class='cell-content shrink'>whatev</div></div></td><td><div class='cell-content-wrap'><div class='cell-content'>su</div></div></td></tr>
                <tr><td><div class='cell-content-wrap'><div class='cell-content shrink'>whatev</div></div></td><td><div class='cell-content-wrap'><div class='cell-content'>su</div></div></td></tr>
                <tr><td><div class='cell-content-wrap'><div class='cell-content shrink'>whatev</div></div></td><td><div class='cell-content-wrap'><div class='cell-content'>su</div></div></td></tr>
                <tr><td><div class='cell-content-wrap'><div class='cell-content shrink'>whatev</div></div></td><td><div class='cell-content-wrap'><div class='cell-content'>su</div></div></td></tr>
                <tr><td><div class='cell-content-wrap'><div class='cell-content shrink'>whatev</div></div></td><td><div class='cell-content-wrap'><div class='cell-content'>su</div></div></td></tr>
              </Fragment>
            ) },
            {
              scrollerElRef: handleScrollerEl,
              // needsSizing: true,
              content: (stuff) => {
                // console.log('isSizingReady', stuff.isSizingReady)
                return (
                  <table class='vgrow' style={{ minWidth: stuff.minWidth }}>
                    {stuff.colGroupNode}
                    <tbody>
                      <tr><td><div class='cell-content-wrap'><div class='cell-content'><span class='fc-sticky' style='display:inline-block'>event1</span></div></div></td><td><div class='cell-content-wrap'><div class='cell-content'>event2</div></div></td></tr>
                      <tr><td><div class='cell-content-wrap'><div class='cell-content'>event1<br />event1<br />event1</div></div></td><td><div class='cell-content-wrap'><div class='cell-content'>event2</div></div></td></tr>
                      <tr><td><div class='cell-content-wrap'><div class='cell-content'>event1</div></div></td><td><div class='cell-content-wrap'><div class='cell-content'>event2</div></div></td></tr>
                      <tr><td><div class='cell-content-wrap'><div class='cell-content'>event1</div></div></td><td><div class='cell-content-wrap'><div class='cell-content'>event2</div></div></td></tr>
                      <tr><td><div class='cell-content-wrap'><div class='cell-content'>event1</div></div></td><td><div class='cell-content-wrap'><div class='cell-content'>event2</div></div></td></tr>
                      <tr><td><div class='cell-content-wrap'><div class='cell-content'>event1</div></div></td><td><div class='cell-content-wrap'><div class='cell-content'>event2</div></div></td></tr>
                      <tr><td><div class='cell-content-wrap'><div class='cell-content'>event1</div></div></td><td><div class='cell-content-wrap'><div class='cell-content'>event2</div></div></td></tr>
                      <tr><td><div class='cell-content-wrap'><div class='cell-content'>event1</div></div></td><td><div class='cell-content-wrap'><div class='cell-content'>event2</div></div></td></tr>
                      <tr><td><div class='cell-content-wrap'><div class='cell-content'>event1</div></div></td><td><div class='cell-content-wrap'><div class='cell-content'>event2</div></div></td></tr>
                      <tr><td><div class='cell-content-wrap'><div class='cell-content'>event1</div></div></td><td><div class='cell-content-wrap'><div class='cell-content'>event2</div></div></td></tr>
                      <tr><td><div class='cell-content-wrap'><div class='cell-content'>event1</div></div></td><td><div class='cell-content-wrap'><div class='cell-content'>event2</div></div></td></tr>
                      <tr><td><div class='cell-content-wrap'><div class='cell-content'>event1</div></div></td><td><div class='cell-content-wrap'><div class='cell-content'>event2</div></div></td></tr>
                      <tr><td><div class='cell-content-wrap'><div class='cell-content'>event1</div></div></td><td><div class='cell-content-wrap'><div class='cell-content'>event2</div></div></td></tr>
                      <tr><td><div class='cell-content-wrap'><div class='cell-content'>event1</div></div></td><td><div class='cell-content-wrap'><div class='cell-content'>event2</div></div></td></tr>
                      <tr><td><div class='cell-content-wrap'><div class='cell-content'>event1</div></div></td><td><div class='cell-content-wrap'><div class='cell-content'>event2</div></div></td></tr>
                    </tbody>
                  </table>
                )
              }
            }
          ]
        },
        {
          type: 'foot',
          chunks: [
            { rowContent: <Fragment><tr><td><div class='cell-content shrink'>All-Day</div></td><td><div class='cell-content'>su</div></td></tr></Fragment> },
            { rowContent: <Fragment><tr><td><div class='cell-content'>Monday</div></td><td><div class='cell-content'>Tuesday</div></td></tr></Fragment> }
          ]
        }
      ]}
    />
  )
}


function handleScrollerEl(scrollerEl: HTMLElement) {
  // console.log('scrollerEl', scrollerEl)
}


function renderSimpleScrollGrid(vGrow: boolean, forPrint: boolean) {
  return (
    <SimpleScrollGrid
      vGrow={vGrow}
      forPrint={forPrint}
      cols={[
        {},
        { width: 'shrink' }
      ]}
      sections={[
        {
          type: 'head',
          chunk: {
            rowContent: (
              <tr>
                <th><div class='cell-content'>this is cool</div></th>
                <th><div class='cell-content shrink'>yup</div></th>
              </tr>
            )
          }
        },
        {
          type: 'body',
          vGrow: true,
          vGrowRows: true,
          chunk: {
            rowContent: (
              <Fragment>
                <tr><td><div class='cell-content'>this is cool</div></td><td><div class='cell-content shrink'>yup</div></td></tr>
                <tr><td><div class='cell-content'>this is cool</div></td><td><div class='cell-content shrink'>yuuup</div></td></tr>
                <tr><td><div class='cell-content'>this is cool</div></td><td><div class='cell-content shrink'>yup</div></td></tr>
                <tr><td><div class='cell-content'>this is cool</div></td><td><div class='cell-content shrink'>yup</div></td></tr>
                <tr><td><div class='cell-content'>this is cool</div></td><td><div class='cell-content shrink'>yup</div></td></tr>
                <tr><td><div class='cell-content'>this is cool</div></td><td><div class='cell-content shrink'>yup</div></td></tr>
                <tr><td><div class='cell-content'>this is cool</div></td><td><div class='cell-content shrink'>yup</div></td></tr>
                <tr><td><div class='cell-content'>this is cool</div></td><td><div class='cell-content shrink'>yup</div></td></tr>
                <tr><td><div class='cell-content'>this is cool</div></td><td><div class='cell-content shrink'>yup</div></td></tr>
                <tr><td><div class='cell-content'>this is cool</div></td><td><div class='cell-content shrink'>yup</div></td></tr>
                <tr><td><div class='cell-content'>this is cool</div></td><td><div class='cell-content shrink'>yup</div></td></tr>
                <tr><td><div class='cell-content'>this is cool</div></td><td><div class='cell-content shrink'>yup</div></td></tr>
                <tr><td><div class='cell-content'>this is cool</div></td><td><div class='cell-content shrink'>yup</div></td></tr>
              </Fragment>
            )
          }
        }
      ]}
    />
  )
}
