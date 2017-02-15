var Hook = require('./lib/tinyhook')

module.exports = function (plasma, dna) {
  this.hook = new Hook({
    name: dna.hookName
  })

  // hookName :: channelName :: timestamp
  var self = this
  this.hook.on('*::' + dna.channelName + '::*', function (c) {
    if (c.$sender === dna.hookName) return // skip reacting on self-send chemicals
    if (dna.log) console.log(dna.hookName, 'got chemical for a channel via hook', c, this.event)
    c.$sender = dna.hookName
    plasma.emit(c, (err, data) => {
      if (dna.log) console.log(dna.hookName, 'got reaction for a channel', c, data)
      if (err) {
        return this.hook.emit(dna.channelName + '::' + c.$feedback_timestamp + '::error', err)
      }
      self.hook.emit(dna.channelName + '::' + c.$feedback_timestamp + '::result', data)
    })
  })
  plasma.on({
    channel: dna.channelName
  }, (c, next) => {
    if (c.$sender === dna.hookName) return // skip reacting on self-send chemicals
    c.$sender = dna.hookName // set $sender
    if (dna.log) console.log(dna.hookName, 'got chemical for a channel via plasma', c)
    if (!c.$feedback_timestamp) {
      c.$feedback_timestamp = (new Date()).getTime() + Math.random()
    }
    this.hook.once('*::' + dna.channelName + '::' + c.$feedback_timestamp + '::error', function (err) {
      if (dna.log) console.log(dna.hookName, 'got error reaction for a channel', c, err)
      next(err)
    })
    this.hook.once('*::' + dna.channelName + '::' + c.$feedback_timestamp + '::result', function (result) {
      if (dna.log) console.log(dna.hookName, 'got result reaction for a channel', c, result)
      next(null, result)
    })
    this.hook.emit(dna.channelName + '::' + c.$feedback_timestamp, c)
  })
  if (dna.log) console.log('starting', dna.hookName)
  this.hook.start(function (err) {
    if (err) {
      if (dna.emitError) {
        plasma.emit(err)
      } else {
        console.error('during hook start', err)
      }
    }
  })
  this.hook.on('hook::ready', function () {
    if (dna.log) console.log(dna.hookName, 'ready')
    if (dna.emitReady) {
      plasma.emit(dna.emitReady)
    }
  })
  plasma.on('kill', () => {
    this.hook.stop(function () {
      if (dna.emitKilled) {
        plasma.emit(dna.emitKilled)
      }
      console.log('killed')
    })
  })
}
