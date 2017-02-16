# organic-plasma-channel

[organic-plasma](https://github.com/outbounder/organic-plasma) decoration providing support for cross-cell peer to peer bi-directional communication based on [discovery-swarm](https://github.com/mafintosh/discovery-swarm)

## install

`npm install organic-plasma-channel`

## setup

Add the following dna per every cell which needs to communicate with a single channel

```
{
  "source": "organic-plasma-channel",
  "port": Number,
  "channelName": String,
  "emitReady": String || false,
  "log": false,
  "debug": false
}
```

### notes

* `port` is *optional* but if provided should be different for different cells on single host
* `emitReady` accepts `false` or `String` values, when String is provided it will be used to emit a chemical of that type when ready and listening for peers

## use

Having cell1 and cell2 both configured to join in `channel1`.

### emit chemicals

```
plasma.emit({
  type: 'myChemical',
  channel: 'channel1'
}, function (err, data) {
  ...
})
```

### listen for chemicals

```
plasma.on({
  type: 'myChemical',
  channel: 'channel1'
}, function listenHandler (c, callback) {
  // do work with c
  callback(err, data)
})
```

### notes

* `callback` is optional and if not needed `listenHandler` should not have second argument `callback`
