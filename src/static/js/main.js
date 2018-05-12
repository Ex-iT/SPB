(doc => {
	const apiUrl = '/api/v1';
	const apiSteamUrl = '/api/steam';
	const form = doc.getElementById('form');

	// Set initial view
	updateView();

	form.addEventListener('submit', event => {
		event.preventDefault();
		addPlayer(event.target.url.value);
	});

	function addPlayer(profileUrl) {
		getSteamIdByProfileUrl(profileUrl)
			.then(steamId => {
				getUserInfoByIds([steamId])
					.then(userInfo => addUser(userInfo))
					.catch(err => console.log('error', err));
			})
			.catch(err => console.log('error', err));
	}

	function getSteamIdByProfileUrl(url) {
		return new Promise((resolve, reject) => {
			const match = url.match(/\/(id|profiles)\/(.*[^\/])/); // eslint-disable-line no-useless-escape
			if (match && match[1] === 'id') {
				getSteamIdByVanityName(match[2])
					.then(steamId => resolve(steamId))
					.catch(err => reject(err));
			} else if (match && match[1] === 'profiles') {
				resolve(match[2]);
			} else {
				reject('Unknown URL');
			}
		});
	}

	function getSteamIdByVanityName(name) {
		return new Promise((resolve, reject) => {
			fetch(`${apiSteamUrl}/resolvevanityurl/${name}`)
				.then(resp => resp.json())
				.then(json => {
					if (json.response && json.response.success === 1) {
						resolve(json.response.steamid);
					} else {
						reject('Unable to resolve vanity URL');
					}
				})
				.catch(err => reject(err));
		});
	}

	function getUserInfoByIds(steamIds) {
		return new Promise((resolve, reject) => {
			Promise.all([
				getPlayerInfo(steamIds),
				getPlayerBans(steamIds)
			])
				.then(data => {
					const fullInfo = [];
					const playerInfo = data[0].players;
					const playerBan = data[1].players;

					playerInfo.forEach((playerInfo, index) => {
						fullInfo.push(Object.assign({}, playerInfo, playerBan[index]));
					});

					resolve(fullInfo);
				})
				.catch(err => reject(err));
		});
	}

	function getPlayerBans(steamIds) {
		return new Promise((resolve, reject) => {
			fetch(`${apiSteamUrl}/playerban/${steamIds.join(',')}`)
				.then(resp => resp.json())
				.then(json => resolve(json))
				.catch(err => reject(err));
		});
	}

	function getPlayerInfo(steamIds) {
		return new Promise((resolve, reject) => {
			fetch(`${apiSteamUrl}/playerinfo/${steamIds.join(',')}`)
				.then(resp => resp.json())
				.then(json => resolve(json.response))
				.catch(err => reject(err));
		});
	}

	function addUser(userInfo) {
		fetch(`${apiUrl}/user/add`, {
			method: 'POST',
			headers: new Headers({ 'Content-Type': 'application/json' }),
			body: JSON.stringify(userInfo)
		})
			.then(response => response.json())
			.then(addedUser => updateView(addedUser))
			.catch(err => console.log(err));
	}

	function updateView(userInfo = null) {
		getTotal();
		updateUsers(userInfo);
		clearForm();
	}

	function clearForm() {
		form.url.value = '';
	}

	function getTotal() {
		fetch(`${apiUrl}/user/total`)
			.then(response => response.json())
			.then(json => doc.getElementById('total').innerHTML = json.total)
			.catch(err => console.log(err));
	}

	function updateUsers(userInfo = null) {
		if (userInfo) {
			updateUserList(userInfo, true);
		} else {
			getAllUsers();
		}
	}

	function getAllUsers() {
		fetch(`${apiUrl}/user`)
			.then(response => response.json())
			.then(usersInfo => {
				usersInfo.forEach(userInfo => updateUserList(userInfo));
			})
			.catch(err => console.log(err));
	}

	function updateUserList(userInfo, prepend = false) {
		const list = doc.getElementById('user-list');
		const item = doc.createElement('li');
		item.dataset.steamId = userInfo.steamid;
		item.innerHTML = `<img src="${userInfo.avatarmedium}" alt="" /><a href="${userInfo.profileurl}" target="_blank" rel="noopener noreferrer">${userInfo.personaname}</a>`;

		if (prepend && list.children.length) {
			list.insertBefore(item, list.children[0]);
		} else {
			list.appendChild(item);
		}
	}

	function removeUser(steamId) {
		fetch(`${apiUrl}/user/remove/${steamId}`, {
			method: 'POST'
		})
			.then(response => response.json())
			.then(userInfo => updateView(userInfo));
	}

})(document);
