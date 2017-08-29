
var ResourceManager = ResourceDataSource.extend({

	calendar: null, // for loading state and options
	eventDataSplitter: null,
	pendingCnt: 0,

	currentStart: null,
	currentEnd: null,


	constructor: function(calendar) {
		ResourceDataSource.call(this);

		this.calendar = calendar;

		// yuck. same as EventManager
		this.on('before:receive', function() {
			calendar.startBatchRender();
		});
		this.on('after:receive', function() {
			calendar.stopBatchRender();
		});

		this.eventDataSplitter = new EventInstanceDataSourceSplitter(function(eventInstance) {
			return eventInstance.def.getResourceIds();
		});

		this.eventDataSplitter.addSource(calendar.eventManager);
	},


	request: function(start, end) { // was requestResources
		if (
			this.currentStart == null || // first time?
			!this.isWithinRange(start, end)
		) {
			this.currentStart = start || false;
			this.currentEnd = end || false;

			this.freeze();
			this.purge();
			this.fetch(start, end);
			this.thaw();
		}
	},


	isWithinRange: function(start, end) {
		return (!start && !this.currentStart) || // both nonexistent ranges?
			(start && this.currentStart && start.isSame(this.currentStart) && end.isSame(this.currentEnd));
	},


	refetch: function() {
		if (this.currentStart != null) {
			this.freeze();
			this.purge();
			this.fetch(this.currentStart, this.currentEnd);
			this.thaw();
		}
	},


	purge: function() {
		if (this.repo.length) {
			this.addChangeset(new ResourceChangeset(
				this.repo // removals
			));
			this.repo = new ResourceRepo();
		}
	},


	fetch: function(start, end) {
		var _this = this;
		var calendar = this.calendar;
		var source = calendar.opt('resources');
		var timezone = calendar.opt('timezone');
		var requestParams;

		if ($.type(source) == 'string') {
			source = { url: source };
		}

		this.pendingCnt++;

		function receive(resourceInputs) {
			var changeset = new ResourceChangeset();
			var i;

			for (i = 0; i < resourceInputs.length; i++) {
				_this.addResourceInputToRepo(resourceInputs[i], changeset.additionsRepo);
			}

			_this.addChangeset(changeset);
			_this.pendingCnt--;
			_this.trySendOutbound();
		}

		switch ($.type(source)) {

			case 'function':
				calendar.pushLoading();
				source(function(resourceInputs) {
					calendar.popLoading();
					receive(resourceInputs);
				}, start, end, calendar.opt('timezone'));
				break;

			case 'object':
				calendar.pushLoading();
				requestParams = {};

				if (start && end) {
					requestParams[calendar.opt('startParam')] = start.format();
					requestParams[calendar.opt('endParam')] = end.format();

					// mimick what EventManager does
					// TODO: more DRY
					if (timezone && timezone != 'local') {
						requestParams[calendar.opt('timezoneParam')] = timezone;
					}
				}

				$.ajax($.extend( // TODO: handle failure
					{ data: requestParams },
					ResourceManager.ajaxDefaults,
					source
				)).then(function(resourceInputs) {
					calendar.popLoading()
					receive(resourceInputs)
				});
				break;

			case 'array':
				receive(source);
				break;

			default:
				receive([]);
				break;
		}
	},


	addResource: function(resourceInput) {
		var changeset = new ResourceChangeset();
		var resource = this.addResourceInputToRepo(resourceInput, changeset.additionsRepo);

		this.addChangeset(changeset);

		return resource;
	},


	removeResource: function(resource) {
		var changeset = new ResourceChangeset();

		changeset.removalsRepo.add(resource);

		this.addChangeset(changeset);
	},


	addResourceInputToRepo: function(resourceInput, repo, parentResource) {
		var resource = this.parseResource(resourceInput); // does not do children
		var childInputs = resourceInput.children || [];
		var i;

		if (!parentResource && resourceInput.parentId) {
			parentResource = repo.getById(resourceInput.parentId)[0];
		}

		if (parentResource) {
			parentResource.children.push(resource);
			resource.parent = parentResource;
		}

		repo.add(resource);

		for (i = 0; i < childInputs.length; i++) {
			this.addResourceInputToRepo(childInputs[i], repo, resource);
		}

		return resource;
	},


	parseResource: function(resourceInput) {
		var _this = this;
		var resource = $.extend({}, resourceInput, {
			parent: null,
			children: []
		});
		var rawClassName;
		var processedClassName;

		resource.id = String(resourceInput.id || '_fc' + ResourceManager.resourceGuid++);

		if (resource.businessHours != null) {
			resource.businessHourGenerator = new BusinessHourGenerator(resource.businessHours, this.calendar);
		}

		resource.eventDataSource = this.eventDataSplitter.buildSubSource(resource.id);

		// TODO: consolidate repeat logic
		rawClassName = resourceInput.eventClassName;

		switch ($.type(rawClassName)) {

			case 'string':
				processedClassName = rawClassName.split(/\s+/);
				break;

			case 'array':
				processedClassName = rawClassName;
				break;

			default:
				processedClassName = [];
		}

		resource.eventClassName = processedClassName;

		return resource;
	},


	canTrigger: function() {
		return ResourceDataSource.prototype.canTrigger.apply(this, arguments) &&
			!this.pendingCnt;
	}

});


ResourceManager.ajaxDefaults = {
	dataType: 'json',
	cache: false
};

ResourceManager.resourceGuid = 0; // better system?
