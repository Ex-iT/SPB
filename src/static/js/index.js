import sTE from './lib/STE.js';

(doc => {
	const apiUrl = '/api/v1';
	const apiSteamUrl = '/api/steam';
	const itemsPerPage = 10;

	// Set initial view
	updateView();
	addEvents();

	function addEvents() {
		const formAdd = doc.getElementById('form-add');
		const formSearch = doc.getElementById('form-search');
		const btnSearch = doc.getElementById('btn-search');
		const btnClear = doc.getElementById('btn-clear');
		const btnFirst = doc.getElementById('btn-first');
		const btnNext = doc.getElementById('btn-next');

		formAdd.addEventListener('submit', event => {
			event.preventDefault();
			addPlayer(event.target, event.target.url.value);
		});

		formSearch.addEventListener('submit', event => {
			event.preventDefault();
			findPlayer(event.target, event.target.search.value);
		});

		btnSearch.addEventListener('click', event => {
			event.preventDefault();
			clearUserList();
			setTotal(0);

			showForm('search');
		});

		btnClear.addEventListener('click', event => {
			event.preventDefault();
			clearUserList();
			getUsers({});
			getTotal();

			formSearch.search.value = '';

			showForm('add');
		});

		btnNext.addEventListener('click', event => {
			event.preventDefault();
			getUsers({ startAfter: event.target.dataset.startAfter });
			window.scrollTo(0, 0);
		});

		btnFirst.addEventListener('click', event => {
			event.preventDefault();
			getUsers({});
			window.scrollTo(0, 0);
		});
	}

	function findPlayer(form, query) {
		form.classList.add('loading');
		if (query) {
			getPlayerByName(query)
				.then(usersInfo => {
					clearUserList();
					const steamIds = Object.keys(usersInfo);
					steamIds.forEach(steamId => updateUsers(usersInfo[steamId]));
					setTotal(steamIds.length);
				})
				.catch(err => addNotification(err.message))
				.finally(() => form.classList.remove('loading'));
		} else {
			addNotification('Enter a search query', 'warning');
			form.classList.remove('loading');
		}
	}

	function addPlayer(form, profileUrl) {
		form.classList.add('loading');
		getSteamIdByProfileUrl(profileUrl)
			.then(steamId => {
				getUserInfoByIds([steamId])
					.then(userInfo => addUser(userInfo))
					.catch(userInfo => {
						addNotification(`
							Player <a href="${userInfo.profileurl}" target="_blank" rel="noopener noreferrer">${userInfo.personaname}</a> already added.
							<button class="btn clean" data-look-up="${userInfo.personaname}" type="button">Look up</button>.
						`, 'warning');
						clearForm();
					})
					.finally(() => form.classList.remove('loading'));
			})
			.catch(err => {
				if (err.error) {
					addNotification(err.message, 'warning');
				} else {
					addNotification('Unexpected error occured while trying to add a player.');
				}
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
				reject({ error: true, message: 'Unknown URL, check the URL and try again'});
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

	function getPlayerByName(name) {
		return new Promise((resolve, reject) => {
			fetch(`${apiUrl}/user/name/${name}`)
				.then(response => response.json())
				.then(userInfo => resolve(userInfo))
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
					if (!addedUser.error) {
						resolve(addedUser);
						updateView(addedUser);
					} else if (addedUser.userInfo) {
						reject(addedUser.userInfo);
					}
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
				.then(json => resolve(json))
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
		formAdd.url.value = '';
	}

	function clearUserList() {
		const userList = doc.getElementById('user-list');
		userList.innerHTML = '';
	}

	function stateUserList(loading = true) {
		const userList = doc.getElementById('user-list');
		userList.classList.toggle('loading', loading);
	}

	function getTotal() {
		fetch(`${apiUrl}/user/total`)
			.then(response => response.json())
			.then(json => setTotal(json.total))
			.catch(err => addNotification(err.message));
	}

	function setTotal(total) {
		doc.getElementById('count').innerHTML = total;
	}

	function updateUsers(userInfo = null) {
		if (userInfo) {
			updateUserList(userInfo, true);
		} else {
			getUsers({});
		}
	}

	// @TODO: use this for fuzzy search
	function getAllUsers() {
		fetch(`${apiUrl}/user`)
			.then(response => response.json())
			.then(usersInfo => {
				Object.keys(usersInfo)
					.filter(object => object.indexOf('_') === -1)
					.forEach(key => updateUserList(usersInfo[key]));
			})
			.catch(err => addNotification(err.message));
	}

	function getUsers({ limit = itemsPerPage, startAfter = -1 }) {
		stateUserList();
		const url = `${apiUrl}/user?limit=${limit}&startAfter=${startAfter}`;
		fetch(url)
			.then(response => response.json())
			.then(usersInfo => {
				clearUserList();
				if (usersInfo.error) {
					addNotification(usersInfo.message);
				} else {
					const btnNext = doc.getElementById('btn-next');
					btnNext.dataset.startAfter = usersInfo._startAfter;
					Object.keys(usersInfo)
						.filter(object => object.indexOf('_') === -1)
						.forEach(key => updateUserList(usersInfo[key]));
				}
			})
			.catch(err => addNotification(err.message))
			.finally(() => stateUserList(false));
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
		const added = docFrag.querySelector('[datetime]').getAttribute('datetime');

		btnUpdate.addEventListener('click', () => {
			listItem.classList.add('loading');
			getPlayerBans(steamId)
				.then(playerBans => {
					getUserInfoByIds([steamId])
						.then(userInfo => {
							const updatedData = Object.assign({}, playerBans.players[0], userInfo[0]);
							updateUser(steamId, updatedData)
								.then(() => {
									updatedData.added = added;
									updateSingleItem(listItem, updatedData);
								})
								.catch(err => console.log(err))
								.finally(() => listItem.classList.remove('loading'));
						});


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

	function addNotification(message, type = 'error') {
		const noteElem = doc.getElementById('notifications');

		const item = doc.createElement('li');
		item.className = type;

		const text = doc.createElement('p');
		text.innerHTML = message;

		const btnClose = doc.createElement('button');
		btnClose.type = 'button';
		btnClose.className = 'btn-close';
		btnClose.innerHTML = 'X';
		btnClose.addEventListener('click', event => {
			event.preventDefault();
			item.remove();
		});

		addNotificationEvents(text, item);

		item.appendChild(text);
		item.appendChild(btnClose);
		noteElem.appendChild(item);
	}

	function addNotificationEvents(html, notificationItem) {
		const lookUpElems = html.querySelectorAll('[data-look-up]');
		lookUpElems.forEach(element => {
			element.addEventListener('click', event => {
				event.preventDefault();
				const form = showForm('search');
				findPlayer(form, element.dataset.lookUp);
				notificationItem.remove();
			});
		});
	}

	function showForm(form = 'add') {
		const formAdd = doc.getElementById('form-add');
		const formSearch = doc.getElementById('form-search');
		const footerActions = doc.getElementById('footer-actions');
		let activeForm = formAdd;

		if (form === 'add') {
			formAdd.removeAttribute('hidden');
			formSearch.setAttribute('hidden', 'hidden');
			footerActions.removeAttribute('hidden');
		} else {
			formAdd.setAttribute('hidden', 'hidden');
			formSearch.removeAttribute('hidden');
			footerActions.setAttribute('hidden', 'hidden');

			activeForm = formSearch;
		}

		return activeForm;
	}

})(document);
