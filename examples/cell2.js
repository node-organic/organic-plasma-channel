var Plasma = require('organic-plasma')
var OrganicPlasmaChannel = require('../index')

var plasma = require('organic-plasma-feedback')(new Plasma())
OrganicPlasmaChannel(plasma, {
  channelName: 'test'
})

plasma.on({
  type: 'test',
  channel: 'test'
}, function (c, next) {
  console.log('GOT', c)
  next(null, {data: c.data + '1'})
})
