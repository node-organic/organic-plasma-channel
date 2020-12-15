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
    plasma1.on('ready', function (c) { setTimeout(next, 100) })
    plasma1.channel = new PlasmaChannel(plasma1, {
      swarmOpts: require('./swarmOpts'),
      channelName: channelName,
      emitReady: 'ready'
    })
    plasma2.channel = new PlasmaChannel(plasma2, {
      swarmOpts: require('./swarmOpts'),
      channelName: channelName,
      emitReady: 'ready'
    })
    plasma3.channel = new PlasmaChannel(plasma3, {
      swarmOpts: require('./swarmOpts'),
      channelName: channelName,
      emitReady: 'ready'
    })
  })
  afterEach(function (next) {
    expect(plasma3.channel.getConnectionPool().length).to.eq(2)
    expect(plasma3.channel.getConnectionPool()[0].listenerCount('message')).to.eq(1)
    expect(plasma3.channel.getConnectionPool()[1].listenerCount('message')).to.eq(1)
    next()
  })
  afterEach(function (next) {
    plasma1.emit('kill')
    plasma2.emit('kill')
    plasma3.emit('kill')
    setTimeout(next, 0)
  })

  it('sends chemical from one instance to others (w/o feedback)', function (next) {
    var counter = 0
    var checkNext = function () {
      counter += 1
      if (counter === 10 * 2) next()
    }
    plasma3.emit({
      type: 'c1',
      channel: channelName
    })
    plasma3.emit({
      type: 'c1',
      channel: channelName
    })
    plasma3.emit({
      type: 'c1',
      channel: channelName
    })
    plasma3.emit({
      type: 'c1',
      channel: channelName
    })
    plasma3.emit({
      type: 'c1',
      channel: channelName
    })
    plasma3.emit({
      type: 'c1',
      channel: channelName
    })
    plasma3.emit({
      type: 'c1',
      channel: channelName
    })
    plasma3.emit({
      type: 'c1',
      channel: channelName
    })
    plasma3.emit({
      type: 'c1',
      channel: channelName
    })
    plasma3.emit({
      type: 'c1',
      channel: channelName
    })
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
  })

  it('sends chemical from one instance to others (with feedback)', function (next) {
    var counter = 0
    plasma3.emit({
      type: 'c1',
      channel: channelName,
      $feedback_timestamp: ((new Date()).getTime()) + Math.random()
    }, function (err, result) {
      expect(err).to.not.exist
      counter += result
      if (counter === 3) {
        next()
      }
    })
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
      respond(null, 2)
    })
  })
})
