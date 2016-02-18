
v1.2.1 (2016-02-17)
-------------------

- allow minTime/maxTime to be negative or beyond 24hrs in timeline (#112)
- fix for nowIndicator not updating position on window resize (#130)
- fix for events resourceId/resourceIds being non-string integers (#120)
- fix external drag handlers not being unbound (#117, #118)
- fix refetchResources should rerender resources in vertical view (#100)
- fix events incorrectly rendered when clipped by minTime/maxTime (#96)
- fix resourceRender's resource object param when resources above dates (#91)
- fix eventOverlap:false with eventResourceField (#86)
- fix license key warning being rendered multiple times (#75)
- fix broken Resource Object eventClassName property
- fix separate event instances via multiple resourceIds, wrong color assignment


v1.2.0 (2016-01-07)
-------------------

- current time indicator (#9)
- pass resourceId into the drop event (#27)
- fix for refetchEvents reseting the scroll position (#89)
- fix for addResource/removeResource failing to rerender in vertical views (#84)
- fix for timeline resource rows sometimes being misaligned when column grouping (#80)
- fix for timeline events not rendering correctly when minTime specified (#78)
- fix for erradic resource ordering in verical views when no resourceOrder specified (#74)
- fix bug where external event dragging would not respect eventOverlap (#72)


v1.1.0 (2015-11-30)
-------------------

- vertical resource view (#5)
- fix event overlap not working in day/week/month view (#24)


v1.0.2 (2015-10-18)
-------------------

- incorrect rendering of events when using slotDuration equal to one day (#49)
- minimum jQuery is now v1.8.0 (solves #44)
- more tests


v1.0.1 (2015-10-13)
-------------------

- fix event rendering coordinates when timezone (#15)
- fix event rendering in non-expanded non-rendered resource rows (#30)
- fix accidentally caching result of resource fetching (#41)
- fix for dragging between resources when custom eventResourceField (#18)
- fix scroll jumping bug (#25)
- relax bower's ignore (#21)


v1.0.0 (2015-08-17)
-------------------

Issues resolved since v1.0.0-beta:
[2523], [2533], [2534], [2562]

[2523]: https://code.google.com/p/fullcalendar/issues/detail?id=2523
[2533]: https://code.google.com/p/fullcalendar/issues/detail?id=2533
[2534]: https://code.google.com/p/fullcalendar/issues/detail?id=2534
[2562]: https://code.google.com/p/fullcalendar/issues/detail?id=2562