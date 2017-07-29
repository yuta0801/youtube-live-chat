const get = require('request').get;
const EventEmitter = require('events').EventEmitter;

class YouTube extends EventEmitter {
	constructor(channelId, apiKey) {
		super();
		this.id = channelId;
		this.key = apiKey;
		this.getLive();
	}

	getLive() {
		get({url: `https://www.googleapis.com/youtube/v3/search?eventType=live&part=id&channelId=${this.id}&type=video&key=${this.key}`, json: true}, (err, res, json) => {
			if (err || res.statusCode != 200){
				this.emit('error', err);
			} else if (!json.items[0]) {
				this.emit('error', 'Nothing live');
			} else {
				this.liveId = json.items[0].id.videoId;
				this.getChatId();
			}
		});
	}

	getChatId() {
		get({url: `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${this.liveId}&key=${this.key}`, json: true}, (err, res, json) => {
			if (err || res.statusCode != 200) {
				this.emit('error', err);
			} else if (!json.items.length) {
				this.emit('error', 'Nothing live chat');
			} else {
				this.chatId = json.items[0].liveStreamingDetails.activeLiveChatId;
				this.emit('ready', null);
			}
		});
	}

	getChat() {
		get({url: `https://www.googleapis.com/youtube/v3/liveChat/messages?liveChatId=${this.chatId}&part=authorDetails,snippet&hl=ja&maxResults=2000&key=${this.key}`, json: true}, (err, res, json) => {
			if (err || res.statusCode != 200) {
				this.emit('error', err);
			} else {
				this.emit('json', json);
			}
		});
	}

	listen(timeout) {
		setInterval(()=>{this.getChat()}, timeout);
		let lastRead = 0, item = {}, time = 0;
		this.on('json', json => {
			for (let i=0; i<json.items.length; i++) {
				item = json.items[i];
				time = new Date(item.snippet.publishedAt).getTime();
				if (lastRead < time) {
					lastRead = time;
					this.emit('chat', item);
				}
			}
		});
	}

}

module.exports = YouTube;
