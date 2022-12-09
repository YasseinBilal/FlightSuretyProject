import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json'
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json'
import Config from './config.json'
import Web3 from 'web3'

export default class Contract {
  constructor(network, callback) {
    this.owner = null
    const config = Config[network]

    this.appAddress = config.appAddress
    this.airlines = []
    this.passengers = []
    this.accounts = []

    this.web3 = new Web3(new Web3.providers.HttpProvider(config.url))

    this.flightSuretyApp = new this.web3.eth.Contract(
      FlightSuretyApp.abi,
      config.appAddress,
    )
    this.flightSuretyData = new this.web3.eth.Contract(
      FlightSuretyData.abi,
      config.dataAddress,
    )

    this.initialize(callback)
  }

  async initialize(callback) {
    if (window.ethereum) {
      try {
        this.web3 = new Web3(window.ethereum)
        await window.ethereum.enable()
      } catch (err) {
        console.error(err)
      }
    }

    if (typeof this.web3 == 'undefined') {
      this.web3 = new Web3(
        new Web3.providers.HttpProvider('http://127.0.0.1:8545'),
      )
      console.log('Coneecting to ganache network')
    }

    this.web3.eth.getAccounts((err, accts) => {
      this.accounts = accts
      this.owner = accts[0]

      let counter = 1

      // add airlines
      while (this.airlines.length < 5) {
        this.airlines.push(accts[counter++])
      }

      // add passengers
      while (this.passengers.length < 5) {
        this.passengers.push(accts[counter++])
      }

      this.flightSuretyData.methods
        .authorizeCaller(this.appAddress)
        .send({ from: this.owner }, (err) => {
          if (err) {
            console.log(err)
          }
        })

      callback()
    })
  }

  isOperational(callback) {
    let self = this
    self.flightSuretyApp.methods
      .isOperational()
      .call({ from: self.owner }, callback)
  }

  fetchFlightStatus(airline, flight, callback) {
    let self = this
    let payload = {
      airline: airline,
      flight: flight,
      timestamp: Math.floor(Date.now() / 1000),
    }
    self.flightSuretyApp.methods
      .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
      .send({ from: self.accounts[0] }, (error, result) => {
        callback(error, payload)
      })
  }

  getFlightStatus(airline, flight, callback) {
    let self = this
    let payload = {
      airline: airline,
      flight: flight,
    }
    self.flightSuretyApp.methods
      .getFlightStatus(payload.flight, payload.airline)
      .call({ from: self.accounts[0] }, (error, flightStatus) => {
        callback(error, flightStatus)
      })
  }

  async registerAirline(address, name, sender, callback) {
    const self = this

    const payload = {
      airlineAddress: address,
      name: name,
      sender: sender,
    }

    await this.web3.eth.getAccounts((error, accounts) => {
      payload.sender = accounts[0]
    })

    self.flightSuretyApp.methods
      .registerAirline(payload.airlineAddress, payload.name)
      .send(
        { from: payload.sender, gasPrice: 30000000, gas: 4000000 },
        (err) => {
          if (err) {
            callback(err, payload)
          } else {
            self.flightSuretyData.methods
              .isRegistered(payload.airlineAddress)
              .call({ from: payload.sender }, (error, isRegistered) => {
                if (error || isRegistered.toString() === 'false') {
                  payload.message =
                    '4 votes needed at least to register airline'
                  payload.registered = false
                } else {
                  payload.registered = true
                  payload.message = `Registered ${payload.airlineAddress} as ${payload.name}`
                }
                callback(error, payload)
              })
          }
        },
      )
  }

  async registerFlight(flight, destination, callback) {
    let self = this
    let payload = {
      flight: flight,
      destination: destination,
      timestamp: Math.floor(Date.now() / 1000),
    }
    await this.web3.eth.getAccounts((error, accts) => {
      self.accounts = accts
    })
    self.flightSuretyApp.methods
      .registerFlight(payload.flight, payload.destination, payload.timestamp)
      .send(
        { from: self.accounts[0], gas: 5000000, gasPrice: 20000000 },
        (error, result) => {
          callback(error, payload)
        },
      )
  }

  async getCurrentPassengerCredit(callback) {
    const self = this

    await this.web3.eth.getAccounts((error, accounts) => {
      self.accounts = accounts
    })

    self.flightSuretyData.methods
      .getCurrentPassengerCredit()
      .call({ from: self.accounts[0] }, (error, result) => {
        callback(error, result)
      })
  }

  async fund(funds, callback) {
    const self = this
    const fundValue = this.web3.utils.toWei(funds.toString(), 'ether')

    const payload = {
      funds: fundValue,
      active: 'false',
    }

    await this.web3.eth.getAccounts((error, accounts) => {
      payload.funder = accounts[0]
    })
    self.flightSuretyData.methods
      .fund()
      .send({ from: payload.funder, value: fundValue }, (error, result) => {
        if (!error) {
          self.flightSuretyData.methods
            .isAirlineActive(payload.funder)
            .call({ from: payload.funder }, (error, isActive) => {
              if (!error) {
                payload.active = isActive
              }
              callback(error, payload)
            })
        }
      })
  }

  async pay(callback) {
    const self = this
    await this.web3.eth.getAccounts((error, accounts) => {
      self.accounts = accounts
    })
    self.flightSuretyData.methods
      .withdraw(self.accounts[0])
      .send({ from: self.accounts[0] }, (error, result) => {
        callback(error, result)
      })
  }

  async buy(flight, price, callback) {
    const self = this
    const priceInWei = this.web3.utils.toWei(price.toString(), 'ether')

    const payload = {
      flight: flight,
      price: priceInWei,
      passenger: self.accounts[0],
    }

    await this.web3.eth.getAccounts((_, accounts) => {
      payload.passenger = accounts[0]
    })

    self.flightSuretyData.methods.buy(flight).send(
      {
        from: payload.passenger,
        value: priceInWei,
        gas: 400000,
        gasPrice: 1,
      },
      (error) => {
        callback(error, payload)
      },
    )
  }
}
