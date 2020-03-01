const YouTube = require('./index.js')

const yt = new YouTube('channelID', 'APIKEY')

yt.listen(1000)

yt.on('message', data => {
  console.log(data.snippet.displayMessage)
})

yt.on('error', error => {
  console.log(error)
})

yt.on('warn', warn => {
  console.warn(warn)
})

setTimeout(() => {
  yt.stop()
  console.log('--- stopped listening ---')
  setTimeout(() => {
    yt.restart()
    console.log('--- restartted listening ---')
  }, 3000)
}, 5000)
