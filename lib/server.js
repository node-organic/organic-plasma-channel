var net = require('net')
var EventEmitter = require('eventemitter2').EventEmitter2

var Server = module.exports = function (hook) {
  this.hook = hook
}

Server.prototype.listen = function (cb) {
  this._server = net.createServer()

  this._server.on('connection', this.acceptSocket.bind(this))

  this._server.on('error', (e) => {
    this._server = null
    // here cb can be null, if we start listening and error happens after that
    if (cb) {
      cb(e)
    }
  })

  this._server.on('close', (e) => {
    this._server = null
  })

  this._server.on('listening', () => {
    cb()
    // set callback to null, so we wan't ping it one more time in error handler
    cb = null
    EventEmitter.prototype.emit.call(this.hook, 'hook::ready')
  })

  this._server.listen(this.hook.options.port, this.hook.options.host)
}

Server.prototype.acceptSocket = function (socket) {
  var client = this.createClient(socket)
  var packets = []
  var len = 0
  var elen = 4
  var state = 0
  // FIXME: ignore errors, close will happens in anyway?
  socket.on('error', function (err) { console.error(err) })
  socket.on('close', () => {
    this.hook.off('**', client.pushEmitHandler)
  })
  socket.on('data', function (data) {
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
          var d = JSON.parse(edata.toString())
          state = 0
          elen = 4
          client.handleMessage(d)
      }
    }
    if (len) {
      packets.push(data)
    }
  })
}

Server.prototype.createClient = function (socket) {
  var client = {
    hook: this.hook,
    name: 'hook',
    socket: socket,
    send: function (data) {
      var lbuffer = new Buffer(4)
      var buffer = new Buffer(JSON.stringify(data))
      lbuffer.writeUInt32BE(buffer.length, 0)
      socket.write(lbuffer)
      socket.write(buffer)
    },
    pushEmitHandler: function (data) {
      client.send({
        message: 'tinyhook::pushemit',
        data: {
          event: this.event,
          data: data
        }
      })
    },
    handleMessage: function (msg) {
      var d = msg.data
      switch (msg.message) {
        case 'tinyhook::hello':
          this.name = d.name
          break
        case 'tinyhook::on':
          this.hook.on(d.type, this.pushEmitHandler)
          break
        case 'tinyhook::echo':
          this.send({
            message: 'tinyhook::pushemit',
            data: {
              event: d.event,
              data: d.data
            }
          })
          break
        case 'tinyhook::off':
          this.hook.off(d.type, this.pushEmitHandler)
          break
        case 'tinyhook::emit':
          EventEmitter.prototype.emit.call(this.hook, this.name + '::' + d.event, d.data)
          break
      }
    }
  }
  return client
}

Server.prototype.stop = function (cb) {
  this._server.on('close', cb)
  this._server.close()
}
