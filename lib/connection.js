var JsonSocket = require('./json-socket')
var plasmaUtils = require('organic-plasma/lib/utils')

module.exports = function (connection, dna) {
  var jsonConnection = new JsonSocket(connection)
  jsonConnection.emitChemical = function (c) {
    if (!jsonConnection) return
    if (dna.debug) console.log(dna.port, 'emitChemical', c)
    jsonConnection.sendMessage(c)
  }
  jsonConnection.onChemical = function (pattern, callback) {
    if (!jsonConnection) return
    jsonConnection.on('message', function (c) {
      if (dna.debug) console.log(dna.port, 'onChemical', c, pattern)
      if (plasmaUtils.deepEqual(pattern, c)) {
        callback(c)
      }
    })
  }
  var onces = []
  var oncesHandler = function (c) {
    if (!jsonConnection) return
    for (var once of onces) {
      if (plasmaUtils.deepEqual(once.pattern, c)) {
        if (dna.debug) console.log(dna.port, 'onceChemical', c, once.pattern)
        once.callback(c)
        onces = onces.filter(o => !plasmaUtils.deepEqual(o.pattern, once.pattern))
        break
      }
    }
  }
  jsonConnection.on('message', oncesHandler)
  jsonConnection.cleanOnces = function (all) {
    if (all) {
      onces.length = 0
      if (jsonConnection && jsonConnection._socket) {
        jsonConnection._socket.destroy()
      }
      jsonConnection = null
    } else {
      var now = new Date().getTime()
      onces = onces.filter(o => o.ts + (299 * 1000) > now)
    }
  }
  jsonConnection.onceChemical = function (pattern, callback) {
    if (!jsonConnection) return
    onces.push({
      pattern,
      callback,
      ts: new Date().getTime(),
    })
  }
  return jsonConnection
}
