
// copy and pasted from core :(

function countHandlers(el) {
	var hash = getHandlerHash(el);
	var cnt = 0;

	$.each(hash, function(name, handlers) {
		cnt += handlers.length;
	});

	return cnt;
}

function getHandlerHash(el) {
	return $._data($(el)[0], 'events') || {};
}
