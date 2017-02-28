var Plasma = require('organic-plasma')
var OrganicPlasmaChannel = require('../index')

var plasma = require('organic-plasma-feedback')(new Plasma())
OrganicPlasmaChannel(plasma, {
  channelName: 'test'
})

setInterval(function () {
  console.log('EMIT')
  plasma.emit({
    type: 'test',
    channel: 'test',
    data: 'test'
  }, function (err, data) {
    console.log('CALLBACK', err, data)
  })
}, 2000)
