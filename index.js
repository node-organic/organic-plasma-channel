var swarm = require('discovery-swarm')
var _ = require('lodash')
var plasmaFeedback = require('organic-plasma-feedback')

module.exports = function (plasma, dna) {
  // decorate plasma with feedback support just in case it is not
  plasma = plasmaFeedback(plasma)
  // create discovery-swarm
  var sw = swarm()
  sw.join(dna.channelName) // can be any id/name/hash
  if (dna.port) {
    sw.listen(dna.port)
  } else {
    dna.port = '[dynamic]' + (Math.ceil(Math.random() * 1000) + 1000).toString()
    sw.listen()
  }
  sw.on('listening', function () {
    if (dna.log) {
      console.log('listening', dna.port)
    }
    if (dna.emitReady) {
      plasma.emit(dna.emitReady)
    }
  })
  sw.on('error', function (err) {
    if (dna.emitErrors) {
      plasma.emit(err)
    } else {
      console.error(dna.port, err)
    }
  })

  sw.on('connection', function (connection, info) {
    if (dna.debug) console.log(dna.port, 'got connection', info)
    // decorate connection with specific chemical boardcast features
    // based on organic-plasma + organic-plasma-feedback
    connection = require('./lib/connection')(connection, dna)
    connection.onChemical({
      channel: dna.channelName
    }, function (c) {
      if (c.$sender_channel === dna.port) {
        if (dna.debug) {
          console.log(dna.port, 'got self-chemical [skipped local plasma emit]')
        }
        return
      }
      if (dna.debug) console.log(dna.port, 'got chemical from a peer', c)
      c.$sender_channel = dna.port // mark chemical so that we do not handle it
      if (dna.debug) console.log(dna.port, 'emit chemical to local plasma')
      plasma.emit(c, function (err, data) {
        if (dna.log) {
          console.log(dna.port, 'got reaction from local plasma and sending back to a peer err', err, 'data', data)
        }
        connection.emitChemical({
          channel: dna.channelName,
          err: err,
          data: data,
          $sender_channel: dna.port,
          $channel_timestamp: c.$channel_timestamp
        })
      })
    })
  })

  plasma.on({
    channel: dna.channelName
  }, function (c, callback) {
    if (c.$sender_channel === dna.port) {
      if (dna.log) console.log(dna.port, 'got chemical emitted to local plasma [skipped boardcast]')
      return
    }
    if (dna.debug) {
      console.log(dna.port, 'broadcast local chemical ', c, 'to peers', sw.connections.length)
    }
    sw.connections.forEach(function (connection) {
      connection = require('./lib/connection')(connection, dna)
      var chemicalToEmit = _.extend(c, {
        $channel_timestamp: (new Date().getTime()) + Math.random(),
        $sender_channel: dna.port
      })
      if (callback) {
        connection.onceChemical({
          channel: dna.channelName,
          $channel_timestamp: chemicalToEmit.$channel_timestamp
        }, function (responseChemical) {
          callback(responseChemical.err, responseChemical.data)
        })
      }
      connection.emitChemical(chemicalToEmit)
    })
  })

  plasma.on('kill', function (c, next) {
    sw.destroy(next)
  })
}
