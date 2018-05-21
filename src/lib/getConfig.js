const fs = require('fs');
const fetch = require('node-fetch');

function getConfig(configPath = './src/config.json') {
	return new Promise((resolve, reject) => {
		if (process.env.CONFIG) {
			const configUrl = process.env.CONFIG;

			fetch(configUrl)
				.then(resp => resp.json())
				.then(json => resolve(json))
				.catch(() => {
					console.log(`[-] Failed getting config from: ${configUrl}, trying local config...`);
					getLocalConfig(configPath, resolve, reject);
				});
		} else {
			getLocalConfig(configPath, resolve, reject);
		}
	});
}

function getLocalConfig(configPath, resolve, reject) {
	fs.readFile(configPath, 'utf8', (err, config) => {
		if (err) {
			reject(err);
		} else {
			resolve(JSON.parse(config));
		}
	});
}

module.exports = {
	getConfig
};
