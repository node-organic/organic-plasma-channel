var EventEmitter = require('eventemitter2').EventEmitter2
var util = require('util')
var _ = require('lodash')
var uuid = require('node-uuid')
var Server = require('./server')
var Client = require('./client')

var Hook = module.exports = function Hook (options) {
  this.options = _.extend({
    name: uuid.v1(),
    host: '127.0.0.1',
    port: 1976,
    gcInterval: 60000,
    eventEmitter: {
      delimiter: '::',
      wildcard: true,
      maxListeners: 100
      // wildcardCache: true
    }
  }, options)

  EventEmitter.call(this, this.options.eventEmitter)

  // semi-private props
  this._client = null
  this._server = null
}
util.inherits(Hook, EventEmitter)

// Function will attempt to start server, if it fails we assume that server already available
// then it start in client mode. So first hook will became super hook, overs its clients
Hook.prototype.start = function (cb) {
  this._server = new Server(this)
  this._server.listen((e) => {
    if (e && (e.code === 'EADDRINUSE' || e.code === 'EADDRNOTAVAIL')) {
      this._server = null
      // if server start fails we attempt to start in client mode
      this._client = new Client(this)
      this._client.connect(cb)
    } else {
      cb(e)
    }
  })
}

Hook.prototype.stop = function (cb) {
  if (this._server) {
    this._server.stop(cb)
  } else if (this._client) {
    this._client.stop(cb)
  } else {
    cb()
  }
}

// hook into core events to dispatch events as required
Hook.prototype.emit = function (event, data, cb) {
  // on client send event to master
  if (this._client) {
    console.log('CLIENT -> SERVER', event, data)
    this._client.notifyForEvent(event, data)
  } else if (this._server) {
    // send to clients event emitted on server (master)
    console.log('SERVER -> CLIENT', event, data)
    EventEmitter.prototype.emit.call(this, this.options.name + '::' + event, data)
  }
  // still preserve local processing
  EventEmitter.prototype.emit.call(this, event, data, cb)
}

Hook.prototype.on = function (type, listener) {
  if (this._client) {
    this._client.notifyForEventListener(type)
  }
  EventEmitter.prototype.on.call(this, type, listener)
}
