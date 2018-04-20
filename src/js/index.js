const apiUrl = '//localhost:3000';

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

// const body = JSON.stringify({ name: 'foo2', code: '123' });
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


fetch(`${apiUrl}/user/remove/`, {
	method: 'POST'
})
	.then(response => response.json())
	.then(json => {
		console.log(json);
	});
