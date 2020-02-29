const qs = require('querystring')
const fetch = require('node-fetch')
const { EventEmitter } = require('events')

/**
 * The main hub for acquire live chat with the YouTube Date API.
 * @extends {EventEmitter}
 */
class YouTube extends EventEmitter {
  /**
   * @param {string} ChannelID ID of the channel to acquire with
   * @param {string} APIKey You'r API key
   */
  constructor(channelId, apiKey) {
    super()
    this.id = channelId
    this.key = apiKey
    this.getLive()
  }

  async getLive() {
    const data = await this.request('search', {
      eventType: 'live',
      part: 'id',
      channelId: this.id,
      type: 'video',
      key: this.key,
    })
    if (!data || !data.items.length) this.emit('error', `Can not find live for channel ${this.id}`)
    else {
      this.liveIds = []
      for (let item in data.items) {
        this.liveIds.push(data.items[item].id.videoId)
      }
      this.getChatIds()
    }
  }

  async getChatIds() {
    if (!this.liveIds) return this.emit('error', 'Live ids are not valid.')
    this.chatIds = []
    for (let id in this.liveIds) {
      const data = await this.request('videos', {
        part: 'liveStreamingDetails',
        id: this.liveIds[id],
        key: this.key,
      })
      if (!data || !data.items.length) this.emit('error', `Can not find chat for stream ${this.liveIds[id]}`)
      else {
        this.chatIds.push(data.items[0].liveStreamingDetails.activeLiveChatId)
      }
    }
    if (this.chatIds.length) this.emit('ready')
  }

  /**
   * Gets live chat messages.
   * See {@link https://developers.google.com/youtube/v3/live/docs/liveChatMessages/list#response|docs}
   * @return {object}
   */
  async getChats() {
    if (!this.chatIds) return this.emit('error', 'Chat id is invalid.')
    for (let chat in this.chatIds) {
      const messages = await this.request('liveChat/messages', {
        liveChatId: this.chatIds[chat],
        part: 'id,snippet,authorDetails',
        maxResults: '2000',
        key: this.key,
      })
      if (messages) this.emit('json', messages)
    }
  }

  async request(endpoint, params) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/` + endpoint
      const query = params ? '?' + qs.stringify(params) : ''
      const res = await fetch(url + query)
      const data = await res.json()
      if (!res.ok) throw data
      return data
    } catch (error) {
      this.emit('error', error)
      return null
    }
  }

  /**
   * Gets live chat messages at regular intervals.
   * @param {number} delay Interval to get live chat messages
   * @fires YouTube#message
   */
  listen(delay) {
    let lastRead = 0,
      time = 0
    this.interval = setInterval(() => this.getChats(), delay)
    this.on('json', data => {
      for (const item of data.items) {
        time = new Date(item.snippet.publishedAt).getTime()
        if (lastRead < time) {
          lastRead = time
          /**
           * Emitted whenever a new message is recepted.
           * See {@link https://developers.google.com/youtube/v3/live/docs/liveChatMessages#resource|docs}
           * @event YouTube#message
           * @type {object}
           */
          this.emit('message', item)
        }
      }
    })
  }

  /**
   * Stops getting live chat messages at regular intervals.
   */
  stop() {
    clearInterval(this.interval)
  }
}

module.exports = YouTube
