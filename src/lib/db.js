const firebase = require('firebase-admin');

let db;

function initFirebase({ serviceAccountKey, fireBaseUrl }) {
	firebase.initializeApp({
		credential: firebase.credential.cert(serviceAccountKey),
		databaseURL: fireBaseUrl
	});

	const database = firebase.firestore();
	db = database.collection('players');
}

// @TODO: Implement http://fusejs.io/
function getUsersByName(name) {
	return new Promise((resolve, reject) => {
		db.where('personaname', '==', name)
			.get()
			.then(snapshot => {
				let docs = {};
				snapshot.forEach(doc => docs[doc.id] = doc.data());
				resolve(docs);
			})
			.catch(err => reject(err));
	});
}

function setUser(data) {
	return new Promise((resolve, reject) => {
		const userInfo = data[0];
		userInfo.added = Math.round((new Date()).getTime() / 1000);
		const playerRef = db.doc(userInfo.steamid);

		db.doc(userInfo.steamid).get()
			.then(doc => {
				if (doc.exists) {
					resolve({ error: true, userInfo});
				} else {
					playerRef.set(userInfo)
						.then(response => resolve(Object.assign({}, userInfo, response)))
						.catch(err => reject(err));
				}
			})
			.catch(err => reject(err));
	});
}

function getUserById(steamId) {
	return new Promise((resolve, reject) => {
		db.doc(steamId)
			.get()
			.then(doc => {
				if (doc.exists) {
					resolve(doc.data());
				} else {
					reject({ error: true, message: 'Can\'t find player' });
				}
			})
			.catch(err => reject(err));
	});
}

function getAllData(params) {
	const limit = parseInt(params.limit, 10) || 50;
	const sorting = { key: 'added', order: 'desc' };
	let startAfter = params.startAfter;

	if (params.valueType === 'number') {
		startAfter = parseInt(params.startAfter, 10);
	}

	if (params.key) {
		sorting.key = params.key;
		sorting.order = params.order || 'asc';
	}

	return new Promise((resolve, reject) => {
		let query = db.orderBy(sorting.key, sorting.order).limit(limit);
		if (startAfter) {
			query = query.startAfter(startAfter);
		}

		query.get()
			.then(snapshot => {
				const value = snapshot.docs[snapshot.docs.length - 1].data()[sorting.key];
				let docs = { _startAfter: value, _valueType: typeof value };
				snapshot.forEach(doc => docs[doc.id] = doc.data());
				resolve(docs);
			})
			.catch(err => reject(err));
	});
}

function getTotal() {
	return new Promise((resolve, reject) => {
		db.get()
			.then(doc => resolve(doc.size))
			.catch(err => reject(err));
	});
}

function updateUserById(steamId, updatedData) {
	return new Promise((resolve, reject) => {
		db.doc(steamId)
			.update(updatedData)
			.then(response => resolve({ _writeTime: response._writeTime, steamid: steamId, updatedData }))
			.catch(err => reject(err));
	});
}

function removeUserById(steamId) {
	return new Promise((resolve, reject) => {
		db.doc(steamId)
			.delete()
			.then(response => resolve({ _writeTime: response._writeTime, steamid: steamId }))
			.catch(err => reject(err));
	});
}

module.exports = {
	initFirebase,
	setUser,
	getUsersByName,
	getUserById,
	getAllData,
	getTotal,
	updateUserById,
	removeUserById
};
