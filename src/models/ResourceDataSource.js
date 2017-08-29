
var ResourceDataSource = Class.extend(EmitterMixin, {

	repo: null,
	freezeDepth: 0,
	isResolved: false, // for eventAfterAllRender
	outboundChangeset: null,


	constructor: function() {
		this.repo = new ResourceRepo();
	},


	tryReset: function() {
		if (this.isResolved && this.canTrigger()) {
			this.triggerChangeset(new EventInstanceChangeset(
				this.repo, // removals
				this.repo // additions
			));
			this.trigger('resolved');
		}
	},


	// Reporting and Triggering
	// -----------------------------------------------------------------------------------------------------------------


	addChangeset: function(changeset) {
		if (!this.outboundChangeset) {
			this.outboundChangeset = new ResourceChangeset();
		}

		changeset.applyToChangeset(this.outboundChangeset);

		this.trySendOutbound();
	},


	freeze: function() {
		this.freezeDepth++;
	},


	thaw: function() {
		this.freezeDepth--;
		this.trySendOutbound();
	},


	trySendOutbound: function() { // also might apply outbound changes to INTERNAL data
		var outboundChangeset = this.outboundChangeset;

		if (this.canTrigger()) {

			if (outboundChangeset) {
				outboundChangeset.applyToRepo(this.repo); // finally internally record

				this.outboundChangeset = null;
				this.triggerChangeset(outboundChangeset);
			}

			// for eventAfterAllRender
			this.isResolved = true;
			this.trigger('resolved');
		}
	},


	canTrigger: function() {
		return !this.freezeDepth;
	},


	triggerChangeset: function(changeset) {
		this.trigger('before:receive');
		this.trigger('receive', changeset);
		this.trigger('after:receive');
	}

});
