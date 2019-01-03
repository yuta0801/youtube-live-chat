const YouTube = require('./index.js')

const yt = new YouTube('channelID', 'APIKEY')

yt.on('ready', () => {
  console.log('ready!')
  yt.listen(1000)
})

yt.on('message', data => {
  console.log(data.snippet.displayMessage)
})

yt.on('error', error => {
  console.log(error)
})
