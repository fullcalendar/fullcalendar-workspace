beforeEach(function() {

	jasmine.addMatchers({

		toEqualMoment: function() {
			return {
				compare: function(actual, expected) {
					var actualStr = $.fullCalendar.moment.parseZone(actual).format();
					var expectedStr = $.fullCalendar.moment.parseZone(expected).format();
					var result = {
						pass: actualStr === expectedStr
					};
					if (!result.pass) {
						result.message = 'Moment ' + actualStr + ' does not equal ' + expectedStr;
					}
					return result;
				}
			};
		}

	});

});