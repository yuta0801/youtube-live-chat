const LiveChat = require('./index.js')

const chat = new LiveChat('CHANNEL_ID', 'APIKEY')

chat.listen(1000)

chat.on('message', data => {
  console.log(data.snippet.displayMessage)
})

chat.on('error', error => {
  console.log(error)
})

chat.on('warn', warn => {
  console.warn(warn)
})

setTimeout(() => {
  chat.stop()
  console.log('--- stopped listening ---')
  setTimeout(() => {
    chat.restart()
    console.log('--- restartted listening ---')
    setTimeout(() => {
      chat.stop()
      console.log('--- stopped listening ---')
    }, 3000)
  }, 3000)
}, 5000)
