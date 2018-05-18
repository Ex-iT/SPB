const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const path = require('path');

const db = require('../lib/db');

const apiVersion = '/v1';
const apiUrl = `/api${apiVersion}`;
const apiSteamUrl = '/api/steam';

const steamApiUrl = 'https://api.steampowered.com/ISteamUser';
const apiKey = process.env.KEY;

if (!apiKey) {
	throw new Error('Please start with a Steam API key.');
}

// Express
const app = express();
const port = process.env.PORT || 3000;

app.disable('x-powered-by');
app.use(bodyParser.json());
app.use(express.json());

function sendError(res, message, code = 500) {
	res.status(code).send(message);
}

// Api - Steam
app.get(`${apiSteamUrl}/resolvevanityurl/:name`, (req, res) => {
	fetch(`${steamApiUrl}/ResolveVanityURL/v0001/?key=${apiKey}&vanityurl=${req.params.name}`)
		.then(resp => resp.json())
		.then(json => res.json(json))
		.catch(err => sendError(res, err));
});

app.get(`${apiSteamUrl}/playerinfo/:steamids`, (req, res) => {
	fetch(`${steamApiUrl}/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${req.params.steamids}`)
		.then(resp => resp.json())
		.then(json => res.json(json))
		.catch(err => sendError(res, err));
});

app.get(`${apiSteamUrl}/playerban/:steamids`, (req, res) => {
	fetch(`${steamApiUrl}/GetPlayerBans/v1/?key=${apiKey}&steamids=${req.params.steamids}`)
		.then(resp => resp.json())
		.then(json => res.json(json))
		.catch(err => sendError(res, err));
});

// Api - Database
app.get(`${apiUrl}/user/total`, (req, res) => {
	db.getTotal()
		.then(count => res.json({ total: count }))
		.catch(err => sendError(res, err));
});

app.get(`${apiUrl}/user/name/:name`, (req, res) => {
	db.getUsersByName(req.params.name)
		.then(data => res.json(data))
		.catch(err => sendError(res, err));
});

app.get(`${apiUrl}/user/id/:id`, (req, res) => {
	db.getUserById(req.params.id)
		.then(data => res.json(data))
		.catch(err => sendError(res, err));
});

app.post(`${apiUrl}/user/add`, (req, res) => {
	db.setUser(req.body)
		.then(data => res.json(data))
		.catch(err => sendError(res, err));
});

app.post(`${apiUrl}/user/remove/:id`, (req, res) => {
	db.removeUserById(req.params.id)
		.then(data => res.json({ numRemoved: data }))
		.catch(err => sendError(res, err));
});

app.get(`${apiUrl}/user`, (req, res) => {
	db.getAllData(req.query)
		.then(data => res.json(data))
		.catch(err => sendError(res, err));
});

// Front
const root = path.join(__dirname, '..', '..', 'dist');
app.use('/static', express.static(path.join(__dirname, '..', '..', 'src', 'static')));
app.get('/favicon.ico', (req, res) => res.sendFile('favicon.ico', { root }) );
app.get('/', (req, res) => res.sendFile('index.html', { root }) );

app.get('*', (req, res) => res.status(400));

app.listen(port);
