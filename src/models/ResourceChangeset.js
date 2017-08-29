
var ResourceChangeset = Class.extend({

	removalsRepo: null,
	additionsRepo: null,


	constructor: function(removalsRepo, additionsRepo) {
		this.removalsRepo = removalsRepo || new ResourceRepo();
		this.additionsRepo = additionsRepo || new ResourceRepo();
	},


	applyToRepo: function(repo) {
		var removalsHash = this.removalsRepo.hash;
		var additionsHash = this.additionsRepo.hash;
		var key, bucket;
		var i;

		for (key in removalsHash) {
			bucket = removalsHash[key];

			for (i = 0; i < bucket.length; i++) {
				repo.removeWithKey(bucket[i], key);
			}
		}

		for (key in additionsHash) {
			bucket = additionsHash[key];

			for (i = 0; i < bucket.length; i++) {
				repo.addWithKey(bucket[i], key);
			}
		}

		this.connectNewParents(repo);
	},


	applyToChangeset: function(changeset) {
		var removalsHash = this.removalsRepo.hash;
		var additionsHash = this.additionsRepo.hash;
		var key, bucket;
		var i;

		for (key in removalsHash) {
			bucket = removalsHash[key];

			for (i = 0; i < bucket.length; i++) {
				if (!changeset.additionsRepo.removeWithKey(bucket[i], key)) {
					changeset.removalsRepo.addWithKey(bucket[i], key);
				}
			}
		}

		for (key in additionsHash) {
			bucket = additionsHash[key];

			for (i = 0; i < bucket.length; i++) {
				changeset.additionsRepo.addWithKey(bucket[i], key);
			}
		}

		this.connectNewParents(changeset.additionsRepo);
	},


	connectNewParents: function(repo) {
		repo.iterAll(function(resource) {
			var newParent;

			if (!resource.parent && resource.parentId) {
				newParent = repo.getById(resource.parentId)[0];
			}

			if (newParent) {
				newParent.children.push(resource);
				resource.parent = newParent;
			}
		});
	}

});
