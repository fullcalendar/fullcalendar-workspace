
###
Given a jQuery <tr> set, returns the <td>'s that do not have multi-line rowspans.
Would use the [rowspan] selector, but never not defined in IE8.
###
getOwnCells = (trs) ->
	trs.find('> td').filter (i, tdNode) ->
		tdNode.rowSpan <= 1

###
Will take part_Date (assuming its like 01/01/2010) and will give it the time of part_Time 
(part_Date becoming 01/01/2010 05:00:00 for example).
###
setTimeToDate: (part_Date, part_Time) ->
	part_Date.hours(part_Time.hours())
	part_Date.minutes(part_Time.minutes())