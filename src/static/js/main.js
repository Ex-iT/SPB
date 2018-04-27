(d => {
	const apiUrl = '/api/v1';
	const apiSteamUrl = '/api/steam';
	const form = d.getElementById('form');

	form.addEventListener('submit', event => {
		event.preventDefault();
		getSteamIdByProfileUrl(event.target.url.value)
			.then(steamId => {
				// const userInfo = getUserInfo(steamId);
				console.log(steamId);
			})
			.catch(err => {
				console.log('error', err);
			});
	});

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

	function getUserInfo(steamId) {
		console.log('getUserInfo', steamId);
	}


	// fetch(`${apiUrl}/user`)
	// 	.then(response => response.json())
	// 	.then(json => {
	// 		console.log(json);
	// 	});

	// fetch(`${apiUrl}/user/total`)
	// 	.then(response => response.json())
	// 	.then(json => {
	// 		console.log(json);
	// 	});

	// const body = JSON.stringify({ name: 'foo4', code: '123' });
	// fetch(`${apiUrl}/user/add`, {
	// 	method: 'POST',
	// 	headers: new Headers({
	// 		'Content-Type': 'application/json'
	// 	}),
	// 	body
	// })
	// 	.then(response => response.json())
	// 	.then(json => {
	// 		console.log(json);
	// 	});

	// const userId = 'uSIdpTVFjtLrpWBM';
	// fetch(`${apiUrl}/user/remove/${userId}`, {
	// 	method: 'POST'
	// })
	// 	.then(response => response.json())
	// 	.then(json => {
	// 		console.log(json);
	// 	});

})(document);
