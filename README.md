# FlightSurety

FlightSurety is a sample application project for Udacity's Blockchain course.

## Install

This repository contains Smart Contract code in Solidity (using Truffle), tests (also using Truffle), dApp scaffolding (using HTML, CSS and JS) and server app scaffolding.

To install, download or clone the repo, then:

`npm install`
`truffle compile`

## Develop Client

To run truffle tests:

`truffle test ./test/flightSurety.js`
`truffle test ./test/oracles.js`

To use the dapp:

`truffle migrate`
`npm run dapp`

To view dapp:

`http://localhost:8000`

## Develop Server

`npm run server`
`truffle test ./test/oracles.js`

## Deploy

To build dapp for prod:
`npm run dapp:prod`

Deploy the contents of the ./dapp folder


## Navigate through the DAPP

To an esier navigation, the page is divided in different sections:
* Airline actions
* Flight actions
* Passenger actions
* Oracle actions
* Logs

Every time an action is performed, a log will be displayed at the bottom "Logs" section. 

## Resources

* [How does Ethereum work anyway?](https://medium.com/@preethikasireddy/how-does-ethereum-work-anyway-22d1df506369)
* [BIP39 Mnemonic Generator](https://iancoleman.io/bip39/)
* [Truffle Framework](http://truffleframework.com/)
* [Ganache Local Blockchain](http://truffleframework.com/ganache/)
* [Remix Solidity IDE](https://remix.ethereum.org/)
* [Solidity Language Reference](http://solidity.readthedocs.io/en/v0.4.24/)
* [Ethereum Blockchain Explorer](https://etherscan.io/)
* [Web3Js Reference](https://github.com/ethereum/wiki/wiki/JavaScript-API)

# Program version numbers

➜  FlightSurety git:(master) ✗ truffle version

- Truffle v5.6.0 (core: 5.6.0)
- Ganache v7.4.3
- Solidity - 0.4.24 (solc-js)
- Node v12.14.1
- Web3.js v1.7.4

# Notes
Run ganache-cli with the following command 
`ganache-cli -l 99999999999999 -a 50`
to generate 50 accounts and with a high gas limit
