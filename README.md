# youtube-live-chat

[![Build Status](https://travis-ci.org/yuta0801/youtube-live-chat.svg?branch=master)](https://travis-ci.org/yuta0801/youtube-live-chat)

A library for get YouTube live chat messages

## Demo

```js
const LiveChat = require('youtube-live-chat')

const chat = new LiveChat('CHANNEL_ID_IS_HERE', 'APIKEY_IS_HERE')

chat.listen(1000)

chat.on('message', data => {
  console.log(data.snippet.displayMessage)
})

// API request error
chat.on('error', error => {
  console.error(error)
})

// some useful messages for debugging
chat.on('warn', warn => {
  console.warn(warn)
})
```

## Install

```
$ npm install --save youtube-live-chat
```

## License

[MIT](https://github.com/yuta0801/youtube-live-chat/blob/master/LICENSE)

## Author

[yuta0801](https://github.com/yuta0801)
