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
  }

  async getLives() {
    const data = await this.request('search', {
      eventType: 'live',
      part: 'id',
      channelId: this.id,
      type: 'video',
      key: this.key,
    })
    if (!data || !data.items.length) this.emit('error', `Can not find live for channel ${this.id}`)
    else return data.items.map(item => item.id.videoId)
  }

  async getChats(liveIds) {
    const chatIds = []
    for (const liveId of liveIds) {
      const data = await this.request('videos', {
        part: 'liveStreamingDetails',
        id: liveId,
        key: this.key,
      })
      if (!data || !data.items.length) this.emit('error', `Can not find chat for stream ${liveId}`)
      else chatIds.push(data.items[0].liveStreamingDetails.activeLiveChatId)
    }
    return chatIds
  }

  /**
   * Gets live chat messages.
   * See {@link https://developers.google.com/youtube/v3/live/docs/liveChatMessages/list#response|docs}
   * @return {object}
   */
  async getMessages(chatIds) {
    for (const chatId of chatIds) {
      const messages = await this.request('liveChat/messages', {
        liveChatId: chatId,
        part: 'id,snippet,authorDetails',
        maxResults: '2000',
        key: this.key,
      })
      if (messages) this.emit('json', messages)
    }
  }

  async request(endpoint, params) {
    try {
      const url = 'https://www.googleapis.com/youtube/v3/' + endpoint
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

  handler() {
    this.handled = true
    let lastRead = 0
    let time = 0
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
   * Gets live chat messages at regular intervals.
   * @param {number} [delay] Interval to get live chat messages. Default is 1000ms.
   * @fires YouTube#message
   */
  async listen(delay) {
    if (!this.handled) this.handler()
    if (this.interval) this.stop()

    if (typeof delay !== 'number') delay = 1000
    this.delay = delay

    const liveIds = await this.getLives()
    const chatIds = await this.getChats(liveIds)

    this.chatIds = chatIds
    this.interval = setInterval(() => this.getMessages(chatIds), delay)
  }

  /**
   * Stops getting live chat messages at regular intervals.
   */
  stop() {
    clearInterval(this.interval)
  }

  /**
   * Restarts getting live chat messages at regular intervals.
   * @param {number} [delay] Interval to get live chat messages. Default is last interval.
   */
  restart(delay) {
    if (typeof delay !== 'number') delay = this.delay
    this.interval = setInterval(() => this.getMessages(this.chatIds), delay)
  }
}

module.exports = YouTube
