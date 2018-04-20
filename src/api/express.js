const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

const db = require('../lib/db');

app.disable('x-powered-by');
app.use(bodyParser.json());
app.use(express.json());

const whitelist = [
	'http://localhost',
	'https://localhost',
	'http://localhost:8080',
	'https://localhost:8080'
];

const corsOptions = {
	origin: (origin, callback) => {
		if (process.env.NODE_ENV === 'development' || whitelist.indexOf(origin) !== -1) {
			callback(null, true);
		} else {
			callback(new Error('Not allowed by CORS'));
		}
	}
};

app.get('/user/total', cors(corsOptions), (req, res) => {
	db.getTotal()
		.then(count => res.json({ total: count }))
		.catch(err => sendError(res, err));
});

app.get('/user/name/:name', cors(corsOptions), (req, res) => {
	db.getUserByName(req.params.name)
		.then(data => res.json(data))
		.catch(err => sendError(res, err));
});

app.get('/user/id/:id', cors(corsOptions), (req, res) => {
	db.getUserById(req.params.id)
		.then(data => res.json(data))
		.catch(err => sendError(res, err));
});

app.options('/user/add', cors());
app.post('/user/add', cors(corsOptions), (req, res) => {
	db.setUser(req.body)
		.then(data => res.json(data))
		.catch(err => sendError(res, err));
});

app.options('/user/add', cors());
app.post('/user/remove/:id', cors(corsOptions), (req, res) => {
	db.removeUserById(req.params.id)
		.then(data => res.json({ numRemoved: data.toString() }))
		.catch(err => sendError(res, err));
});

app.get('/user', cors(corsOptions), (req, res) => {
	db.getAllData(req.query)
		.then(data => res.json(data))
		.catch(err => sendError(res, err));
});

app.get('*', (req, res) => res.status(400).send('Bad Request'));

function sendError(res, message, code = 500) {
	res.status(code).send(message);
}

app.listen(3000);
