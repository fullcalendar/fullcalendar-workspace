/*
printing bugs:
   - FF switches back to non-print too quickly
   - IE11 doesn't work at all

NOTE: cell-content-wrap can't contain a sticky (creates new bounding). sticky should be on tr>.cell-content.sticky
  fine because sticky always happens in a rowSpan td, which we dont want to control height
FREEZING happens sometimes, window resize
sometimes scroll joining just dies
*/

import { render, h, Fragment, Component, ComponentContextType, Calendar, ScrollGrid } from 'fullcalendar-scheduler'

let DIR = 'ltr'
let THEME_SYSTEM = ''


document.addEventListener('DOMContentLoaded', function() {
  let el = document.getElementById('scrollgrid-wrap')
  el.className = [
    'fc',
    'fc-' + DIR,
    THEME_SYSTEM === 'bootstrap' ? 'fc-bootstrap' : 'fc-unthemed'
  ].join(' ')
  render(<App />, el)
})


interface AppState {
  forPrint: boolean
}

class App extends Component<{}, AppState> {

  context = null

  state = {
    forPrint: false
  }

  render(props: {}, state: AppState) {
    return (
      <ComponentContextType.Provider value={buildContext({ dir: DIR, themeSystem: THEME_SYSTEM })}>
        <ScrollGrid
          needsSizing={false}
          vGrow={true}
          forPrint={state.forPrint}
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
      </ComponentContextType.Provider>
    )
  }

  componentDidMount() {
    window.addEventListener('beforeprint', this.handleBeforePrint)
    window.addEventListener('afterprint', this.handleAfterPrint)
  }

  componentWillUnmount() {
    window.removeEventListener('beforeprint', this.handleBeforePrint)
    window.removeEventListener('afterprint', this.handleAfterPrint)
  }

  handleBeforePrint = () => {
    this.setState({ forPrint: true })
  }

  handleAfterPrint = () => {
    this.setState({ forPrint: false })
  }

}


function handleScrollerEl(scrollerEl: HTMLElement) {
  // console.log('scrollerEl', scrollerEl)
}


function buildContext(calendarOptions) {
  let calendar = new Calendar(document.createElement('div'), calendarOptions)
  calendar.render()
  return calendar.context
}

