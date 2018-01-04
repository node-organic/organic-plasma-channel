var JsonSocket = require('./json-socket')
var plasmaUtils = require('organic-plasma/lib/utils')

module.exports = function (connection, dna) {
  var jsonConnection = new JsonSocket(connection)
  jsonConnection.emitChemical = function (c) {
    if (dna.debug) console.log(dna.port, 'emitChemical', c)
    jsonConnection.sendMessage(c)
  }
  jsonConnection.onChemical = function (pattern, callback) {
    jsonConnection.on('message', function (c) {
      if (dna.debug) console.log(dna.port, 'onChemical', c, pattern)
      if (plasmaUtils.deepEqual(pattern, c)) {
        callback(c)
      }
    })
  }
  jsonConnection.onceChemical = function (pattern, callback) {
    var callbackCalled = false
    var handler = function (c) {
      if (dna.debug) console.log(dna.port, 'onceChemical', c, pattern)
      if (plasmaUtils.deepEqual(pattern, c) && !callbackCalled) {
        callbackCalled = true
        callback(c)
        jsonConnection.removeListener('message', handler)
      }
    }

    jsonConnection.on('message', handler)
  }
  return jsonConnection
}
