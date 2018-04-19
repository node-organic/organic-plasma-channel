# organic-plasma-channel

[organic-plasma v2.0](https://github.com/outbounder/organic-plasma) based organelle providing support for cross-cell peer to peer bi-directional communication based on [discovery-swarm](https://github.com/mafintosh/discovery-swarm)

## install

`npm install organic-plasma-channel`

## setup

Add the following dna per every cell which needs to communicate through a channel

```
{
  "source": "organic-plasma-channel",
  "port": Number,
  "channelName": String,
  "swarmOpts": {
    "utp": false,
    "tcp": true,
    "dns": true,
    "dht": false
  },
  "emitReady": String || false,
  "readyOnListening": false,
  "disableNoPeersEventBuffer": false,
  "log": false,
  "debug": false,
  "disabled": false
}
```

### notes

* `port` is *optional* but if provided should be different for different cells on single host
* `emitReady` accepts `false` or `String` values, when String is provided it will be used to emit a chemical of that type when ready and listening for peers
* `swarmOpts` is *optional* and if present will be passed as-is to [`discovery-swarm`'s constructor](https://github.com/mafintosh/discovery-swarm#var-sw--swarmopts)
* `readyOnListening` - default is `false` - emits ready on first connected peer; `true` - old behavior, emits ready on swarm listening event
* `disableNoPeersEventBuffer` - default is `false` - all events emitted to the channel will be buffered and pumped back when there is at least one connected peer; `true` - old behavior, no buffering
## use

Having cell1 and cell2 both configured to join in `channel1`.

### emit chemical and receive first callback from cells

```
plasma.emit({
  type: 'myChemical',
  channel: 'channel1'
}, function callback (err, data) {
  ...
})
```

### emit chemical and receive every callback from all cells who respond

```
plasma.emit({
  type: 'myChemical',
  channel: 'channel1'
}, function callback (err, data) {
  ...
})
```

### listen for chemicals and respond with callback

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

* `callback` is optional
