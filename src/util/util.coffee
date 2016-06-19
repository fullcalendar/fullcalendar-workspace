
###
Given a jQuery <tr> set, returns the <td>'s that do not have multi-line rowspans.
Would use the [rowspan] selector, but never not defined in IE8.
###
getOwnCells = (trs) ->
	trs.find('> td').filter (i, tdNode) ->
		tdNode.rowSpan <= 1

###
HACK to combat jQuery 3 promises now always executed done handlers asynchronously.
if the promise is resolved, or not a promise at all, doneFunc executes immediately.
if the promise has already been rejected, failFunc executes immediately.
###
syncThen = (promise, doneFunc, failFunc) ->
	if not promise or not promise.then or promise.state() == 'resolved'
		if doneFunc
			$.when(doneFunc())
		else
			$.when()
	else if promise.state() == 'rejected'
		if failFunc
			failFunc()
		$.Deferred().reject().promise()
	else
		promise.then(doneFunc, failFunc)
