# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [2.1.0] - 2018-04-20

### Changed

* Changed the default behaviour of `emitReady` on swarm listening
event (can be toggled to old behaviour by `dna.readyOnListening=true`)

### Added

* Buffer and pump back (with a repeat with timeout of 100ms) all
events emitted when there're no connected peers (can be disabled with
`dna.disableNoPeersEventBuffer=true`)

## [2.0.1] - 2017-12-09

### Fixed

- sending feedback from child cell to master without any error or data


## [2.0.0] - 2017-11-26

**The release contains breaking changes towards v1.x.x**
Upgrade path requires providing for `plasma` an instance of organic-plasma v2.x.x as
it has organic plasma feedback included

### Changed

- removed `organic-plasma-feedback` decoration

### Fixed

- chemicals through channel having `err` defined as `Error` type are now
transferred as expected having their `message` and `stack` properties included
- README content
