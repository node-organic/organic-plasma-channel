var PlasmaChannel = require('../../index')
var Plasma = require('organic-plasma')
describe('e2e buffer early events', function () {
  var plasmaMaster
  var plasmaChild
  var channelName = 'default'

  var callbackCount = 0
  var handleCount = 0

  it('setup master channel', function (next) {
    plasmaMaster = new Plasma()
    plasmaMaster.on('masterReady', function (c) { setTimeout(next, 100) })
    plasmaMaster.channel = new PlasmaChannel(plasmaMaster, {
      swarmOpts: require('./swarmOpts'),
      channelName: channelName,
      emitReady: 'masterReady',
      readyOnListening: true, // emitReady on listening event, not on first connected peer
    })
  })
  it('emit from master', function (next) {
    plasmaMaster.emit({
      type: 'c1',
      channel: channelName
    }, function (err, result) {
      expect(err).to.not.exist
      expect(result).to.eq(true)
      callbackCount += 1
    })
    next()
  })
  it('setup child channel', function (next) {
    plasmaChild = new Plasma()
    plasmaChild.on('childReady', function (c) { setTimeout(next, 0) })
    plasmaChild.on({
      channel: channelName
    }, function (c, respond) {
      expect(c.type).to.eq('c1')
      handleCount += 1
      respond(null, true)
    })
    plasmaChild.channel = new PlasmaChannel(plasmaChild, {
      swarmOpts: require('./swarmOpts'),
      channelName: channelName,
      emitReady: 'childReady',
      readyOnListening: true, // emitReady on listening event, not on first connected peer
    })
  })
  it('buffered event emit from master still received', function (next) {
    setTimeout(function () {
      expect(callbackCount).to.eq(1)
      expect(handleCount).to.eq(1)
      next()
    }, 100)
  })
  after(function (next) {
    plasmaMaster.emit('kill')
    plasmaChild.emit('kill')
    setTimeout(next, 0)
  })
})
