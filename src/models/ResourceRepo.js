
var ResourceRepo = Class.extend({

	// TODO: remove util should kill parent/child relationship and FLATTEN
	// iterate top-level

	hash: null,
	length: 0,


	constructor: function(resources) {
		this.hash = {};

		(resources || []).forEach(this.add.bind(this));
	},


	resolveKey: function(resource) {
		return resource.id;
	},


	iterSubtrees: function(func) {
		var _this = this;

		this.iterAll(function(resource) {
			if (!resource.parent || !_this.contains(resource.parent)) {
				func(resource);
			}
		});
	},


	getTopLevel: function() {
		var items = [];

		this.iterTopLevel(items.push.bind(items));

		return items;
	},


	iterTopLevel: function(func) {
		var _this = this;

		this.iterAll(function(resource) {
			if (!resource.parent) {
				func(resource);
			}
		});
	},


	contains: function(item) {
		var bucket = this.hash[this.resolveKey(item)];

		return bucket.indexOf(item) !== -1;
	},


	iterAll: function(func) {
		var hash = this.hash;
		var key;

		for (key in hash) {
			hash[key].forEach(func);
		}
	},


	getAll: function(key) {
		var items = [];

		this.iterAll(items.push.bind(items));

		return items;
	},


	getById: function(key) {
		var bucket = this.hash[key];

		if (bucket) {
			return bucket.slice(); // clone
		}

		return [];
	},


	add: function(item) {
		this.addWithKey(item, this.resolveKey(item));
	},


	addWithKey: function(item, key) {
		(this.hash[key] || (this.hash[key] = []))
			.push(item);

		this.length++;
	},


	remove: function(item) {
		//return this.removeWithKey(item, this.resolveKey(item));

		var success = this.removeWithKey(item, this.resolveKey(item));
		var parent = item.parent || null;

		if (success) {

			if (parent) {
				removeExact(parent.children, item);
			}

			item.children.forEach(function(child) {
				child.parent = parent;
			});

			item.parent = null;
			item.children = [];
		}

		return success;
		// NOTE: UI handlers of removes must mirror same child-flattening behavior
	},


	removeWithKey: function(item, key) {
		var bucket = this.hash[key];

		if (bucket && removeExact(bucket, eventInstance)) {

			if (!bucket.length) {
				delete this.hash[key];
			}

			this.length--;

			return true;
		}

		return false;
	}

});
