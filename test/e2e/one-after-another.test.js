var PlasmaChannel = require('../../index')
var Plasma = require('organic-plasma')
describe('e2e one after another', function () {
  var plasmaMaster
  var plasmaChild
  var channelName = 'default'
  beforeEach(function (next) {
    plasmaMaster = new Plasma()
    plasmaMaster.on('masterReady', function (c) { setTimeout(next, 100) })
    plasmaMaster.channel = new PlasmaChannel(plasmaMaster, {
      swarmOpts: require('./swarmOpts'),
      channelName: channelName,
      emitReady: 'masterReady',
      readyOnListening: true, // emitReady on listening event, not on first connected peer
    })
  })
  beforeEach(function (next) {
    plasmaChild = new Plasma()
    plasmaChild.on('childReady', function (c) { setTimeout(next, 100) })
    plasmaChild.channel = new PlasmaChannel(plasmaChild, {
      swarmOpts: require('./swarmOpts'),
      channelName: channelName,
      emitReady: 'childReady'
    })
  })
  afterEach(function (next) {
    plasmaMaster.emit('kill')
    plasmaChild.emit('kill')
    setTimeout(next, 0)
  })
  it('sends chemical from master to child (with feedback)', function (next) {
    var callbackCount = 0
    var handleCount = 0
    plasmaChild.on({
      channel: channelName
    }, function (c, respond) {
      expect(c.type).to.eq('c1')
      handleCount += 1
      respond(null, true)
    })
    plasmaMaster.emit({
      type: 'c1',
      channel: channelName
    }, function (err, result) {
      expect(err).to.not.exist
      expect(result).to.eq(true)
      callbackCount += 1
    })
    setTimeout(function () {
      if (callbackCount === 1 && handleCount === 1) return next()
      next(new Error('emit was called more than once'))
    }, 100)
  })
})
