const YouTube = require('../src/index.js');

const yt = new YouTube('channelID', 'APIKEY');

yt.on('ready', () => {
	console.log('ready!');
	yt.listen(1000);
});

yt.on('chat', json => {
	console.log(json.snippet.displayMessage);
});

yt.on('error', err => {
	console.log(err);
});
