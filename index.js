const request = require('request')
const {EventEmitter} = require('events')

/**
 * The main hub for acquire live chat with the YouTube Date API.
 * @extends {EventEmitter}
 */
class YouTube extends EventEmitter {
  /**
   * @param  {string} ChannelID ID of the channel to acquire with
   * @param  {string} APIKey you'r API key
   */
  constructor(channelId, apiKey) {
    super()
    this.id = channelId
    this.key = apiKey
    this.getLive()
  }

  getLive() {
    const url = 'https://www.googleapis.com/youtube/v3/search'+
      '?eventType=live'+
      '&part=id'+
      `&channelId=${this.id}`+
      '&type=video'+
      `&key=${this.key}`
    this.request(url, data => {
      if (!data.items[0])
        this.emit('error', 'Can not find live.')
      else {
        this.liveId = data.items[0].id.videoId
        this.getChatId()
      }
    })
  }

  getChatId() {
    if (!this.liveId) return this.emit('error', 'Live id is invalid.')
    const url = 'https://www.googleapis.com/youtube/v3/videos'+
      '?part=liveStreamingDetails'+
      `&id=${this.liveId}`+
      `&key=${this.key}`
    this.request(url, data => {
      if (!data.items.length)
        this.emit('error', 'Can not find chat.')
      else {
        this.chatId = data.items[0].liveStreamingDetails.activeLiveChatId
        this.emit('ready')
      }
    })
  }

  /**
   * Get chat messages.
   * See {@link https://developers.google.com/youtube/v3/live/docs/liveChatMessages#resource|docs}.
   * @return {object}
   */
  getChat() {
    if (!this.chatId) return this.emit('error', 'Chat id is invalid.')
    const url = 'https://www.googleapis.com/youtube/v3/liveChat/messages'+
      `?liveChatId=${this.chatId}`+
      '&part=id,snippet,authorDetails'+
      '&maxResults=2000'+
      `&key=${this.key}`
    this.request(url, data => {
      return data
    })
  }

  request(url, callback) {
    request({
      url: url,
      method: 'GET',
      json: true,
    }, (error, response, data) => {
      if (error)
        this.emit('error', error)
      else if (response.statusCode !== 200)
        this.emit('error', data)
      else
        callback(data)
    })
  }

  /**
   * Get chat messages at regular intervals.
   * @param  {[type]} delay Interval to get chat messages.
   * @fires YouTube#message
   */
  listen(delay) {
    let lastRead = 0, time = 0
    this.interval = setInterval(() => {
      const data = this.getChat()
      for (const item of data.items) {
        time = new Date(item.snippet.publishedAt).getTime()
        if (lastRead < time) {
          lastRead = time
          /**
          * Message event.
          * See
          * @event YouTube#message
          * @type {object}
          */
          this.emit('message', item)
        }
      }
    }, delay)
  }

  /**
   * Stop getting chat messages at regular intervals.
   */
  stop() {
    clearInterval(this.interval)
  }
}

module.exports = YouTube
