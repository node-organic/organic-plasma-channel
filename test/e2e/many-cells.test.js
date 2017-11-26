var PlasmaChannel = require('../../index')
var Plasma = require('organic-plasma')
describe('e2e many cells', function () {
  var plasma1
  var plasma2
  var plasma3
  var channelName = 'default'
  beforeEach(function (next) {
    plasma1 = new Plasma()
    plasma2 = new Plasma()
    plasma3 = new Plasma()
    next()
  })
  beforeEach(function (next) {
    plasma1.on('ready', function (c) { next() })
    plasma1.channel = new PlasmaChannel(plasma1, {
      channelName: channelName,
      emitReady: 'ready'
    })
  })
  beforeEach(function (next) {
    plasma2.on('ready', function (c) { next() })
    plasma2.channel = new PlasmaChannel(plasma2, {
      channelName: channelName,
      emitReady: 'ready'
    })
  })
  beforeEach(function (next) {
    plasma3.on('ready', function (c) { next() })
    plasma3.channel = new PlasmaChannel(plasma3, {
      channelName: channelName,
      emitReady: 'ready'
    })
  })
  beforeEach(function (next) {
    // wait channels to resolve and connect
    setTimeout(next, 1000)
  })
  afterEach(function (next) {
    plasma1.emit('kill')
    plasma2.emit('kill')
    plasma3.emit('kill')
    setTimeout(next, 1000)
  })

  it('sends chemical from one instance to others (w/o feedback)', function (next) {
    var counter = 0
    var checkNext = function () {
      counter += 1
      if (counter === 2) next()
    }
    plasma1.on({
      channel: channelName
    }, function (c) {
      expect(c.type).to.eq('c1')
      checkNext()
    })
    plasma2.on({
      channel: channelName
    }, function (c) {
      expect(c.type).to.eq('c1')
      checkNext()
    })
    plasma3.emit({
      type: 'c1',
      channel: channelName
    })
  })

  it('sends chemical from one instance to others (with feedback)', function (next) {
    var counter = 0
    plasma1.on({
      channel: channelName
    }, function (c, respond) {
      expect(c.type).to.eq('c1')
      respond(null, 1)
    })
    plasma2.on({
      channel: channelName
    }, function (c, respond) {
      expect(c.type).to.eq('c1')
      respond(null, 1)
    })
    plasma3.emit({
      type: 'c1',
      channel: channelName,
      $feedback_timestamp: ((new Date()).getTime()) + Math.random()
    }, function (err, result) {
      expect(err).to.not.exist
      counter += result
      if (counter === 2) {
        next()
      }
    })
  })
})
