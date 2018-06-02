import sTE from './lib/STE.js';

(doc => {
	const apiUrl = '/api/v1';
	const apiSteamUrl = '/api/steam';

	// Set initial view
	updateView();
	addEvents();

	function addEvents() {
		const formAdd = doc.getElementById('form-add');
		const formSearch = doc.getElementById('form-search');

		formAdd.addEventListener('submit', event => {
			event.preventDefault();
			addPlayer(event.target, event.target.url.value);
		});

		formSearch.addEventListener('submit', event => {
			event.preventDefault();
			console.log('Implement search -', event.target.search.value);
		});
	}

	function addPlayer(form, profileUrl) {
		form.classList.add('loading');
		getSteamIdByProfileUrl(profileUrl)
			.then(steamId => {
				getUserInfoByIds([steamId])
					.then(userInfo => addUser(userInfo))
					.catch(err => console.log('error', err))
					.finally(() => form.classList.remove('loading'));
			})
			.catch(err => {
				console.log('error', err);
				form.classList.remove('loading');
			});
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

	function getPlayerBans(steamId) {
		return new Promise((resolve, reject) => {
			fetch(`${apiSteamUrl}/playerban/${steamId}`)
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
		return new Promise((resolve, reject) => {
			fetch(`${apiUrl}/user/add`, {
				method: 'POST',
				headers: new Headers({ 'Content-Type': 'application/json' }),
				body: JSON.stringify(userInfo)
			})
				.then(response => response.json())
				.then(addedUser => {
					resolve(addedUser);
					updateView(addedUser);
				})
				.catch(err => reject(err));
		});
	}

	function updateUser(steamId, updateddata) {
		return new Promise((resolve, reject) =>{
			fetch(`${apiUrl}/user/update`, {
				method: 'POST',
				headers: new Headers({ 'Content-Type': 'application/json' }),
				body: JSON.stringify({ steamid: steamId, updateddata })
			})
				.then(response => response.json())
				.then(json => {
					getUserInfoByIds([json.steamid])
						.then(userInfo => {
							userInfo[0].added = json.updatedData.added;
							resolve(userInfo);
						})
						.catch(err => reject(err));
				})
				.catch(err => reject(err));
		});
	}

	function updateView(userInfo = null) {
		getTotal();
		updateUsers(userInfo);
		clearForm();
	}

	function clearForm() {
		const formAdd = doc.getElementById('form-add');
		const formSearch = doc.getElementById('form-search');

		formAdd.url.value = '';
		formSearch.search.value = '';
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
				Object.keys(usersInfo)
					.filter(object => object.indexOf('_') === -1)
					.forEach(key => updateUserList(usersInfo[key]));
			})
			.catch(err => console.log(err));
	}

	function removeItem(steamId) {
		return new Promise((resolve, reject) => {
			fetch(`${apiUrl}/user/remove`, {
				method: 'POST',
				headers: new Headers({ 'Content-Type': 'application/json' }),
				body: JSON.stringify({ steamid: steamId })
			})
				.then(response => response.json())
				.then(json => resolve(json.steamid))
				.catch(err => reject(err));
		});
	}

	function updateUserList(userInfo, prepend = false) {
		const list = doc.getElementById('user-list');

		userInfo.addedDate = displayTime(userInfo.added);
		const listItem = updateListItem(userInfo);

		if (prepend && list.children.length) {
			list.insertBefore(listItem, list.children[0]);
		} else {
			list.appendChild(listItem);
		}
	}

	function updateListItem(context) {
		const template = doc.getElementById('user-list-item');
		const clone = doc.importNode(template.content, true);

		clone.children[0].innerHTML = sTE(clone.children[0].innerHTML, context);
		addActions(clone);

		return clone;
	}

	function updateSingleItem(item, userInfo) {
		userInfo.addedDate = displayTime(userInfo.added);
		const listItem = updateListItem(userInfo);
		item.innerHTML = listItem.children[0].innerHTML;
		addActions(item);
	}

	function addActions(docFrag) {
		const btnUpdate = docFrag.querySelector('[data-btn-update]');
		const btnRemove = docFrag.querySelector('[data-btn-remove]');
		const listItem = docFrag.querySelector('li') || docFrag;
		const steamId = docFrag.querySelector('[data-steam-id]').dataset.steamId;

		btnUpdate.addEventListener('click', () => {
			listItem.classList.add('loading');
			getPlayerBans(steamId)
				.then(playerBans => {
					updateUser(steamId, playerBans.players[0])
						.then(userInfo => updateSingleItem(listItem, userInfo[0]))
						.catch(err => console.log(err))
						.finally(() => listItem.classList.remove('loading'));
				});
		});

		btnRemove.addEventListener('click', () => {
			listItem.classList.add('loading');
			removeItem(steamId)
				.then(() => {
					listItem.remove();
					getTotal();
				})
				.catch(err => console.log(err));
		});
	}

	function displayTime(timestamp) {
		const date = new Date(timestamp * 1000);
		const day = `0${date.getDate()}`;
		const month = `0${(date.getMonth() + 1)}`;
		const year = date.getFullYear();
		return `${day.substr(-2)}-${month.substr(-2)}-${year}`;
	}

})(document);