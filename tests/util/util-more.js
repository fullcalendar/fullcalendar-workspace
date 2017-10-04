
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


function spyOnMethod(Class, methodName) {
	var origMethod = Class.prototype.hasOwnProperty(methodName) ?
		Class.prototype[methodName] :
		null;

	var spy = spyOn(Class.prototype, methodName).and.callThrough();

	spy.restore = function() {
		if (origMethod) {
			Class.prototype[methodName] = origMethod;
		}
		else {
			delete Class.prototype[methodName];
		}
	};

	return spy;
}
