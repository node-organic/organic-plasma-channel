var net = require('net')
var EventEmitter = require('eventemitter2').EventEmitter2

var Client = module.exports = function (hook) {
  this.hook = hook
  this._connectCount = 0
  this._reconnect = true
  this._gcId = null
  this._eventTypes = {}
  this.socket = null
  this.ready = false
}

Client.prototype.connect = function (cb) {
  this.socket = net.connect(this.hook.options.port, this.hook.options.host)

  this.socket.send = (data) => {
    var lbuffer = new Buffer(4)
    var buffer = new Buffer(JSON.stringify(data))
    lbuffer.writeUInt32BE(buffer.length, 0)
    this.socket.write(lbuffer)
    this.socket.write(buffer)
  }

  // when connection started we sayng hello and push
  // all known event types we have
  this.socket.on('connect', () => {
    this.onClientConnected()
  })

  // any error will terminate connection
  this.socket.on('error', function () {
    this.socket.end()
  })

  // tranlate pushed emit to local one
  this.socket.on('data', this.createDataHandler())

  this.socket.on('close', () => {
    if (this._reconnect) {
      this.reconnect()
    }
  })
}

Client.prototype.createDataHandler = function () {
  var packets = []
  var len = 0
  var elen = 4
  var state = 0
  return (data) => {
    len += data.length
    var edata
    while (len >= elen) {
      if (packets.length) {
        packets.push(data)
        data = Buffer.concat(packets, len)
        packets = []
      }
      edata = data.slice(0, elen)
      len = len - elen
      if (len > 0) {
        data = data.slice(-len)
      }
      switch (state) {
        case 0:
          elen = edata.readUInt32BE(0)
          state = 1
          break
        case 1:
          var d = JSON.parse(edata.toString()).data
          state = 0
          elen = 4
          EventEmitter.prototype.emit.call(this.hook, d.event, d.data)
      }
    }
    if (len) {
      packets.push(data)
    }
  }
}

Client.prototype.onClientConnected = function () {
  // every XX seconds do garbage collect and notify server about
  // event we longer not listening. Realtime notification is not necessary
  // Its ok if for some period we receive events that are not listened
  this._gcId = setInterval(() => {
    Object.keys(this._eventTypes).forEach((type) => {
      var listeners = this.listeners(type)
      if (!listeners || !listeners.length) {
        // no more listener for this event
        // push this to server
        this.socket.send({
          message: 'tinyhook::off',
          data: {
            type: type
          }
        })
        delete this._eventTypes[type]
      }
    })
  }, this.hook.options.gcInterval)

  this.socket.send({
    message: 'tinyhook::hello',
    data: {
      protoVersion: 1,
      name: this.hook.options.name
    }
  })

    // purge known event types
  Object.keys(this._eventTypes).forEach(function (type) {
    this.socket.send({
      message: 'tinyhook::on',
      data: {
        type: type
      }
    })
  })

  // lets use echo to get ready status when all the above is processed
  this.hook.once('hook::ready-internal', () => {
    var readyevent = this.ready ? 'hook::reconnected' : 'hook::ready'
    this.hook.emit(readyevent)
    this.ready = true
  })
  this.socket.send({
    message: 'tinyhook::echo',
    data: {
      event: 'hook::ready-internal'
    }
  })
}

Client.prototype.reconnect = function () {
  this.socket.destroy()
  this.socket = null
  this._connectCount = this._connectCount + 1
  var reconnectFn = () => {
    this.connect((err) => {
      if (err) {
        setTimeout(reconnectFn, 10 * this.connectCount * this.connectCount)
      } else {
        this._connectCount = 0
      }
    })
  }
  reconnectFn()
}

Client.prototype.stop = function (cb) {
  this._reconnect = false
  this.socket.once('close', cb)
  this.socket.end()
  clearInterval(this._gcId)
}

Client.prototype.notifyForEventListener = function (type) {
  if (!this._eventTypes[type]) {
    this.socket.send({
      message: 'tinyhook::on',
      data: {
        type: type
      }
    })
  }
  this._eventTypes[type] = 1
}

Client.prototype.notifyForEvent = function (event, data) {
  this.socket.send({
    message: 'tinyhook::emit',
    data: {
      event: event,
      data: data
    }
  })
}
