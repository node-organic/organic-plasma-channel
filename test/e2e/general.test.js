var PlasmaChannel = require('../../index')
var Plasma = require('organic-plasma')
describe('e2e general', function () {
  var plasmaMaster
  var plasmaChild
  beforeEach(function (next) {
    plasmaMaster = require('organic-plasma-feedback')(new Plasma())
    plasmaChild = require('organic-plasma-feedback')(new Plasma())
    next()
  })
  beforeEach(function (next) {
    plasmaMaster.on('masterReady', function (c) { next() })
    plasmaMaster.channel = new PlasmaChannel(plasmaMaster, {
      hookName: 'master',
      channelName: 'common',
      emitReady: 'masterReady',
      log: true
    })
  })
  beforeEach(function (next) {
    plasmaChild.on('childReady', function (c) { next() })
    plasmaChild.channel = new PlasmaChannel(plasmaChild, {
      hookName: 'child',
      channelName: 'common',
      emitReady: 'childReady',
      log: true
    })
  })
  afterEach(function (next) {
    plasmaMaster.emit('kill')
    plasmaChild.emit('kill')
    plasmaMaster = null
    plasmaChild = null
    next()
  })
  it('sends chemical from child to master (w/o feedback)', function (next) {
    plasmaMaster.on({
      channel: 'common'
    }, function (c) {
      expect(c.type).to.eq('c1')
      next()
    })
    plasmaChild.emit({
      type: 'c1',
      channel: 'common'
    })
  })
  it('sends chemical from master to child (w/o feedback)', function (next) {
    plasmaChild.on({
      channel: 'common'
    }, function (c) {
      expect(c.type).to.eq('c1')
      next()
    })
    plasmaMaster.emit({
      type: 'c1',
      channel: 'common'
    })
  })
  xit('sends chemical from child to master (with feedback)', function (next) {
    plasmaMaster.on({
      channel: 'common'
    }, function (c, respond) {
      expect(c.type).to.eq('c1')
      respond(null, true)
    })
    plasmaChild.emit({
      type: 'c1',
      channel: 'common'
    }, function (err, result) {
      expect(err).to.not.exist
      expect(result).to.eq(true)
      next()
    })
  })
  xit('sends chemical from master to child (with feedback)', function (next) {
    plasmaChild.on({
      channel: 'common'
    }, function (c, respond) {
      expect(c.type).to.eq('c1')
      respond(null, true)
    })
    plasmaMaster.emit({
      type: 'c1',
      channel: 'common'
    }, function (err, result) {
      expect(err).to.not.exist
      expect(result).to.eq(true)
      next()
    })
  })
})
