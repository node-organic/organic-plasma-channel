var swarm = require('discovery-swarm')
var _ = require('lodash')

// borrowed from
// https://stackoverflow.com/questions/18391212/is-it-not-possible-to-stringify-an-error-using-json-stringify
function replaceErrors (key, value) {
  if (value instanceof Error) {
    var error = {}
    Object.getOwnPropertyNames(value).forEach(function (key) {
      error[key] = value[key]
    })
    return error
  }
  return value || null
}

module.exports = function (plasma, dna) {
  if (dna.disabled) return
  // create discovery-swarm
  var sw = swarm(dna.swarmOpts || {})
  sw.on('listening', function () {
    if (dna.log) {
      console.log('listening', dna.port)
    }
    if (dna.emitReady && dna.readyOnListening) {
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
  var connectionPool = []
  var bufferedEvents = []
  var ready = false

  sw.on('connection', function (connection, info) {
    if (dna.debug) console.log(dna.port, 'got connection', info)
    // decorate connection with specific chemical boardcast features
    // based on organic-plasma + organic-plasma-feedback
    var chemicalConnection = require('./lib/connection')(connection, dna)
    connectionPool.push(chemicalConnection)
    // emitReady if that's the first connected peer
    if (dna.emitReady && !dna.readyOnListening && !ready && connectionPool.length === 1) {
      ready = true
      plasma.emit(dna.emitReady)
    }
    chemicalConnection.on('close', function () {
      for (var i = 0; i < connectionPool.length; i++) {
        if (connectionPool[i] === chemicalConnection) {
          connectionPool.splice(i, 1)
        }
      }
    })
    chemicalConnection.onChemical({
      channel: dna.channelName
    }, function (c) {
      if (dna.debug) console.log(dna.port, 'got chemical from a peer', c)
      if (dna.debug) console.log(dna.port, 'emit chemical to local plasma')
      c.$sender_channel = dna.port // mark chemical so that we do not handle it
      plasma.emit(c, function (err, data) {
        if (dna.debug) {
          console.log(dna.port, 'got reaction from local plasma and sending back to a peer err', err, 'data', data)
        }
        chemicalConnection.emitChemical({
          channel: dna.channelName,
          err: JSON.stringify(err, replaceErrors),
          data: data,
          $sender_channel: dna.port,
          $channel_timestamp: c.$channel_timestamp
        })
      })
    })
  })
  sw.join(dna.channelName) // can be any id/name/hash
  if (dna.port) {
    sw.listen(dna.port)
  } else {
    dna.port = '[dynamic]' + (Math.ceil(Math.random() * 1000) + 1000).toString()
    sw.listen()
  }

  var emitChemicalToPeer = function (chemicalToEmit, chemicalConnection, callback) {
    if (callback) {
      chemicalConnection.onceChemical({
        channel: dna.channelName,
        $channel_timestamp: chemicalToEmit.$channel_timestamp
      }, function (responseChemical) {
        if (dna.debug) console.log(dna.port, 'CALLBACK FOR', chemicalToEmit, 'WITH', responseChemical)
        callback(JSON.parse(responseChemical.err), responseChemical.data)
      })
    }
    chemicalConnection.emitChemical(chemicalToEmit)
  }

  var bufferPumpTimeoutHandle

  var pumpBufferedEvents = function () {
    if (!connectionPool.length) {
      clearTimeout(bufferPumpTimeoutHandle)
      bufferPumpTimeoutHandle = setTimeout(pumpBufferedEvents, 100)
      return
    }
    if (bufferedEvents.length) {
      bufferedEvents.forEach(function (bufferedEvent) {
        connectionPool.forEach(function (chemicalConnection) {
          emitChemicalToPeer(bufferedEvent.chemicalToEmit, chemicalConnection, bufferedEvent.callback)
        })
      })
      bufferedEvents.length = 0
    }
  }

  plasma.on({
    channel: dna.channelName
  }, function (c, callback) {
    if (c.$sender_channel === dna.port) {
      if (dna.debug) console.log(dna.port, 'got chemical emitted to local plasma [skipped boardcast]')
      return
    }
    if (dna.debug) {
      console.log(dna.port, 'broadcast local chemical ', c, 'to peers', connectionPool.length)
    }
    var chemicalToEmit = _.extend({}, c, {
      $channel_timestamp: (new Date().getTime()) + Math.random(),
      $sender_channel: dna.port
    })
    if (!dna.disableNoPeersEventBuffer && !connectionPool.length) {
      if (dna.log) {
        console.log('no connected peers, buffer event', chemicalToEmit)
      }
      bufferedEvents.push({
        chemicalToEmit,
        callback,
      })
      pumpBufferedEvents()
      return
    }
    connectionPool.forEach(function (chemicalConnection) {
      emitChemicalToPeer(chemicalToEmit, chemicalConnection, callback)
    })
  })

  plasma.on('kill', function (c, next) {
    sw.destroy(function () {
      connectionPool.length = 0
      next()
    })
  })
}
