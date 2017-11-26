var PlasmaChannel = require('../../index')
var Plasma = require('organic-plasma')
describe('e2e general emit only once', function () {
  var plasmaMaster
  var plasmaChild
  var channelName = 'default'
  beforeEach(function (next) {
    plasmaMaster = new Plasma()
    plasmaChild = new Plasma()
    next()
  })
  beforeEach(function (next) {
    plasmaMaster.on('masterReady', function (c) { next() })
    plasmaMaster.channel = new PlasmaChannel(plasmaMaster, {
      channelName: channelName,
      emitReady: 'masterReady'
    })
  })
  beforeEach(function (next) {
    plasmaChild.on('childReady', function (c) { next() })
    plasmaChild.channel = new PlasmaChannel(plasmaChild, {
      channelName: channelName,
      emitReady: 'childReady'
    })
  })
  beforeEach(function (next) {
    // wait channels to resolve and connect
    setTimeout(next, 1000)
  })
  afterEach(function (next) {
    plasmaMaster.emit('kill')
    plasmaChild.emit('kill')
    setTimeout(next, 1000)
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
    }, 800)
  })
})
