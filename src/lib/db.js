const Datastore = require('nedb');
const db = new Datastore({ filename: './data.nedb', autoload: true });

function setUser(data) {
	return new Promise((resolve, reject) => {
		const userInfo = data[0];
		userInfo.added = Math.round((new Date()).getTime() / 1000);

		db.findOne({ steamid: userInfo.steamid }, (err, doc) => {
			if (err) reject(err);
			if (doc) {
				// User already exists so return this user
				resolve(doc);
			} else {
				// Insert the new user
				db.insert(userInfo, (err, newDoc) => {
					if (err) reject(err);
					resolve(newDoc);
				});
			}
		});
	});
}

function getUserByName(name) {
	return new Promise((resolve, reject) => {
		db.find({ $or: [
			{ personaname: new RegExp(name, 'i') },
			{ realname: new RegExp(name, 'i') }
		]})
			.sort({ personaname: 1, realname: 1 })
			.exec((err, docs) => {
				if (err) reject(err);
				resolve(docs);
			});
	});
}

function getUserById(steamId) {
	return new Promise((resolve, reject) => {
		db.findOne({ steamid: steamId }, (err, doc) => {
			if (err) reject(err);
			resolve(doc);
		});
	});
}

function getAllData(sortOptions, limit = 50, skip = 0) {
	const sorting = { key: 'added', order: -1 };
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

function removeUserById(steamId) {
	return new Promise((resolve, reject) => {
		db.remove({ steamid: steamId }, (err, numRemoved) => {
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
