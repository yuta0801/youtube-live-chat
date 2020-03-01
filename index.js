const qs = require('querystring')
const fetch = require('node-fetch')
const { EventEmitter } = require('events')

/**
 * @extends {EventEmitter}
 */
class LiveChat extends EventEmitter {
  /**
   * @param {string} ChannelID ID of the channel to acquire with
   * @param {string} APIKey You'r API key
   */
  constructor(channelId, apiKey) {
    super()
    this.id = channelId
    this.key = apiKey
  }

  /**
   * @returns {Promise<string[]>}
   * @private
   */
  async getLiveIds() {
    const data = await this.fetch('search', {
      eventType: 'live',
      part: 'id',
      channelId: this.id,
      type: 'video',
      key: this.key,
    })
    if (!data)
      this.emit('warn', `Failed fetch live stream for channel ${this.id}`)
    else if (!data.items.length)
      this.emit('warn', `No live stream found for channel ${this.id}`)
    return data ? data.items.map(item => item.id.videoId) : []
  }

  /**
   * @param {string[]} liveIds
   * @returns {Promise<string[]>}
   * @private
   */
  async getChatIds(liveIds) {
    const chatIds = []
    for (const liveId of liveIds) {
      const data = await this.fetch('videos', {
        part: 'liveStreamingDetails',
        id: liveId,
        key: this.key,
      })
      if (!data)
        this.emit('warn', `Failed fetch live stream for stream ${liveId}`)
      if (!data.items.length)
        this.emit('warn', `No live chat found for stream ${liveId}`)
      else chatIds.push(data.items[0].liveStreamingDetails.activeLiveChatId)
    }
    if (!chatIds.length) this.emit('warn', 'No live chat found')
    return chatIds
  }

  /**
   * @param {string[]} chatIds
   * @private
   */
  async getMessages(chatIds) {
    for (const chatId of chatIds) {
      const messages = await this.fetch('liveChat/messages', {
        liveChatId: chatId,
        part: 'id,snippet,authorDetails',
        maxResults: '2000',
        key: this.key,
      })
      if (!messages)
        this.emit('warn', `Failed fetch live chat messages for ${chatId}`)
      else this.emit('json', messages)
    }
  }

  /**
   * @param {string} endpoint
   * @param {Object.<string, string>} [params]
   * @private
   */
  async fetch(endpoint, params) {
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

  /**
   * @private
   */
  handler() {
    this.handled = true
    this.on('json', data => {
      for (const item of data.items) {
        const time = new Date(item.snippet.publishedAt).getTime()
        if (this.lastRead < time) {
          this.lastRead = time
          /**
           * Emitted whenever a new message is recepted.
           * See {@link https://developers.google.com/youtube/v3/live/docs/liveChatMessages#resource}
           * @event LiveChat#message
           * @type {object}
           */
          this.emit('message', item)
        }
      }
    })
  }

  /**
   * Listening options
   * @typedef {Object} ListenOptions
   * @property {number} [interval] Interval to get live chat messages. Default is 1000ms.
   * @property {function} [liveFilter] Filter to select live stream. Default is _all lives_.
   */

  /**
   * Gets live chat messages at regular intervals.
   * @param {ListenOptions} [options] Listening options
   * @fires LiveChat#message
   */
  async listen(options) {
    options = Object.assign(
      {
        interval: 1000,
        liveFilter: c => c,
        ignorePastMessages: true,
      },
      options,
    )

    if (options.ignorePastMessages) this.lastRead = Date.now()

    if (!this.handled) this.handler()
    if (this.interval) this.stop()

    const liveIds = await this.getLiveIds()
    const chatIds = await this.getChatIds(liveIds)

    // hold data for restart
    this.options = options
    this.chatIds = chatIds

    this.interval = setInterval(
      () => this.getMessages(options.liveFilter(chatIds)),
      options.interval,
    )
  }

  /**
   * Stops getting live chat messages
   */
  stop() {
    clearInterval(this.interval)
  }

  /**
   * Restarts getting live chat messages
   * @param {ListenOptions} [options] Listening options. Default is options last passed to listen method_.
   */
  restart(options = this.options) {
    if (this.options.ignorePastMessages) this.lastRead = Date.now()

    this.interval = setInterval(
      () => this.getMessages(options.liveFilter(this.chatIds)),
      options.interval,
    )
  }
}

module.exports = LiveChat
