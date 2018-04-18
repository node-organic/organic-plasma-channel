var PlasmaChannel = require('../../index')
var Plasma = require('organic-plasma')
describe('e2e general', function () {
  var plasmaMaster
  var plasmaChild
  var channelName = 'default'
  beforeEach(function (next) {
    plasmaMaster = new Plasma()
    plasmaChild = new Plasma()
    plasmaMaster.channel = new PlasmaChannel(plasmaMaster, {
      swarmOpts: require('./swarmOpts'),
      channelName: channelName,
      emitReady: 'masterReady'
    })
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

  it('sends chemical from child to master (w/o feedback)', function (next) {
    plasmaMaster.on({
      channel: channelName
    }, function (c) {
      expect(c.type).to.eq('c1')
      next()
    })
    plasmaChild.emit({
      type: 'c1',
      channel: channelName
    })
  })

  it('sends chemical from master to child (w/o feedback)', function (next) {
    plasmaChild.on({
      channel: channelName
    }, function (c) {
      expect(c.type).to.eq('c1')
      next()
    })
    plasmaMaster.emit({
      type: 'c1',
      channel: channelName
    })
  })

  it('sends chemical from child to master (with feedback)', function (next) {
    plasmaMaster.on({
      channel: channelName
    }, function (c, respond) {
      expect(c.type).to.eq('c1')
      respond(null, true)
    })
    plasmaChild.emit({
      type: 'c1',
      channel: channelName
    }, function (err, result) {
      expect(err).to.not.exist
      expect(result).to.eq(true)
      next()
    })
  })

  it('sends chemical from master to child (with feedback)', function (next) {
    plasmaChild.on({
      channel: channelName
    }, function (c, respond) {
      expect(c.type).to.eq('c1')
      respond(null, true)
    })
    plasmaMaster.emit({
      type: 'c1',
      channel: channelName
    }, function (err, result) {
      expect(err).to.not.exist
      expect(result).to.eq(true)
      next()
    })
  })

  it('sends chemical from master to child (with feedback with error)', function (next) {
    plasmaChild.on({
      channel: channelName
    }, function (c, respond) {
      expect(c.type).to.eq('c1')
      var err = new Error('test error')
      err.someProp = 'someValue'
      respond(err)
    })
    plasmaMaster.emit({
      type: 'c1',
      channel: channelName
    }, function (err, result) {
      expect(err).to.exist
      expect(err).to.be.an('object')
      expect(err.message).to.eq('test error')
      expect(err.someProp).to.eq('someValue')
      expect(result).to.not.exist
      next()
    })
  })

  it('sends chemical from child to master (with feedback, but no data)', function (next) {
    plasmaMaster.on({
      channel: channelName
    }, function (c, respond) {
      expect(c.type).to.eq('c1')
      respond()
    })
    plasmaChild.emit({
      type: 'c1',
      channel: channelName
    }, function (err, result) {
      expect(err).to.not.exist
      expect(result).to.not.exist
      next()
    })
  })

  it('sends two parallel chemicals from child to master (with feedback and data)', function (next) {
    var c1CallbackHit = 0
    var c2CallbackHit = 0

    plasmaMaster.on({
      type: 'c1',
      channel: channelName
    }, function (c, respond) {
      expect(c.type).to.eq('c1')
      respond(null, 'ok c1')
    })
    plasmaMaster.on({
      type: 'c2',
      channel: channelName
    }, function (c, respond) {
      expect(c.type).to.eq('c2')
      respond(null, 'ok c2')
    })

    plasmaChild.emit({
      type: 'c1',
      channel: channelName
    }, function (err, result) {
      expect(err).to.not.exist
      expect(result).to.exist
      c1CallbackHit++
    })

    plasmaChild.emit({
      type: 'c2',
      channel: channelName
    }, function (err, result) {
      expect(err).to.not.exist
      expect(result).to.exist
      c2CallbackHit++
    })

    setTimeout(function () {
      expect(c1CallbackHit).to.eq(1)
      expect(c2CallbackHit).to.eq(1)
      next()
    }, 100)
  })
})
