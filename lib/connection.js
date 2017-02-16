var JsonSocket = require('json-socket')
var plasmaUtils = require('organic-plasma/lib/utils')

module.exports = function (connection, dna) {
  connection = new JsonSocket(connection)
  connection.emitChemical = function (c) {
    if (dna.debug) console.log('emitChemical', c)
    connection.sendMessage(c)
  }
  connection.onChemical = function (pattern, callback) {
    connection.on('message', function (c) {
      if (dna.debug) console.log('onChemical', c, pattern)
      if (plasmaUtils.deepEqual(pattern, c)) {
        callback(c)
      }
    })
  }
  connection.onceChemical = function (pattern, callback) {
    var handler = function (c) {
      if (dna.debug) console.log('onceChemical', c, pattern)
      if (plasmaUtils.deepEqual(pattern, c)) {
        callback(c)
      }
      connection.removeEventListener('message', handler)
    }
    connection.on('message', handler)
  }
  return connection
}
