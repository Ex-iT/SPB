const Datastore = require('nedb');
const db = new Datastore({ filename: './data.nedb', autoload: true });

function setUser(data) {
	return new Promise((resolve, reject) => {
		db.findOne({ name: data.name }, (err, doc) => {
			if (err) reject(err);
			if (doc) {
				// User already exists so return this user
				resolve(doc);
			} else {
				// Insert the new user
				db.insert(data, (err, newDoc) => {
					if (err) reject(err);
					resolve(newDoc);
				});
			}
		});
	});
}

function getUserByName(name) {
	return new Promise((resolve, reject) => {
		db.find({ name: new RegExp(name, 'i') })
			.sort({ name: 1 })
			.exec((err, docs) => {
				if (err) reject(err);
				resolve(docs);
			});
	});
}

function getUserById(id) {
	return new Promise((resolve, reject) => {
		db.findOne({ _id: id }, (err, doc) => {
			if (err) reject(err);
			resolve(doc);
		});
	});
}

function getAllData(sortOptions, limit = 50, skip = 0) {
	const sorting = { key: 'name', order: 1 };
	if (sortOptions && sortOptions.key) {
		sorting.key = sortOptions.key;
		sorting.order = sortOptions.order === 'asc' ? -1 : 1;
	}

	return new Promise((resolve, reject) => {
		db.find({})
			.skip(skip)
			.limit(limit)
			.sort({ [sorting.key]:sorting.order })
			.exec((err, docs) => {
				if (err) reject(err);
				resolve(docs);
			});
	});
}

function getTotal() {
	return new Promise((resolve, reject) => {
		db.count({})
			.exec((err, docs) => {
				if (err) reject(err);
				resolve(docs);
			});
	});
}

function removeUserById(id) {
	return new Promise((resolve, reject) => {
		db.remove({ _id: id }, (err, numRemoved) => {
			if (err) reject(err);
			resolve(numRemoved);
		});
	});
}

module.exports = {
	setUser,
	getUserByName,
	getUserById,
	getAllData,
	getTotal,
	removeUserById
};
