import Config from './config.json'
import Web3 from 'web3'
import express from 'express'
import cors from 'cors'

import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json'
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json'

const localhostConfig = Config.localhost

const web3 = new Web3(
  new Web3.providers.WebsocketProvider(
    localhostConfig.url.replace('http', 'ws'),
  ),
)
const app = express()
app.use(cors())

web3.eth.defaultAccount = web3.eth.accounts[0]

const flightSuretyApp = new web3.eth.Contract(
  FlightSuretyApp.abi,
  localhostConfig.appAddress,
)
const flightSuretyData = new web3.eth.Contract(
  FlightSuretyData.abi,
  localhostConfig.dataAddress,
)

let oracleAccounts = []
let oraclesIndexies = []

const ORACLES_COUNT = 25
const FIRST_ORACLE_INDEX = 20

let currentStatus = STATUS_CODE_ON_TIME

const STATUS_CODE_UNKNOWN = 0
const STATUS_CODE_ON_TIME = 10
const STATUS_CODE_LATE_AIRLINE = 20
const STATUS_CODE_LATE_WEATHER = 30
const STATUS_CODE_LATE_TECHNICAL = 40
const STATUS_CODE_LATE_OTHER = 50

flightSuretyApp.events.OracleRequest(
  {
    fromBlock: 'latest',
  },
  function (err, event) {
    const index = event.returnValues.index
    let idx = 0
    oraclesIndexies.forEach((indexes) => {
      const oracle = oracleAccounts[idx]
      if (indexes[0] == index || indexes[1] == index || indexes[2] == index) {
        submitOracleResponse(
          oracle,
          index,
          event.returnValues.airline,
          event.returnValues.flight,
          event.returnValues.timestamp,
        )
      }
      idx++
    })
  },
)

flightSuretyData.events.allEvents({ fromBlock: 'latest' }, function (
  error,
  event,
) {
  error ? console.log('error', error) : console.log('event', event)
})

function submitOracleResponse(oracle, index, airline, flight, timestamp) {
  flightSuretyApp.methods
    .submitOracleResponse(index, airline, flight, timestamp, currentStatus)
    .send({ from: oracle, gas: 400000, gasPrice: 30000000 })

  if (currentStatus == STATUS_CODE_LATE_AIRLINE) {
    flightSuretyData.methods.creditInsurees(flight).call({ from: oracle })
  }
}

function getOracleAccounts() {
  return new Promise((resolve, reject) => {
    web3.eth
      .getAccounts()
      .then((accountList) => {
        // We start at account 20 so we have first ones useable for airline and passengers.
        oracleAccounts = accountList.slice(FIRST_ORACLE_INDEX, FIRST_ORACLE_INDEX + ORACLES_COUNT)
      })
      .catch((err) => {
        reject(err)
      })
      .then(() => {
        resolve(oracleAccounts)
      })
  })
}

function initializeOracles(accounts) {
  return new Promise((resolve, reject) => {
    flightSuretyApp.methods
      .REGISTRATION_FEE()
      .call()
      .then((registrationFee) => {
        for (let i = 0; i < ORACLES_COUNT; i++) {
          flightSuretyApp.methods
            .registerOracle()
            .send({
              from: accounts[i],
              value: registrationFee,
              gas: 4000000,
              gasPrice: 30000000,
            })
            .then(() => {
              flightSuretyApp.methods
                .getMyIndexes()
                .call({
                  from: accounts[i],
                })
                .then((index) => {
                  oraclesIndexies.push(index)
                })
                .catch((e) => {
                  reject(e)
                })
            })
            .catch((e) => {
              reject(e)
            })
        }
        resolve(oraclesIndexies)
      })
      .catch((e) => {
        reject(e)
      })
  })
}

getOracleAccounts().then((oracleAccounts) => {
  initializeOracles(oracleAccounts).catch((err) => {
    console.log(err.message)
  })
})

app.get('/api', (req, res) => {
  res.send({
    message: 'An API for use with your Dapp!',
  })
})

app.get('/api/status/:status', (req, res) => {
  const status = req.params.status
  let message = 'Status changed, '

  switch (status) {
    case '10':
      currentStatus = STATUS_CODE_ON_TIME
      message = message.concat('ON TIME')
      break
    case '20':
      currentStatus = STATUS_CODE_LATE_AIRLINE
      message = message.concat('LATE AIRLINE')
      break
    case '30':
      currentStatus = STATUS_CODE_LATE_WEATHER
      message = message.concat('LATE WEATHER')
      break
    case '40':
      currentStatus = STATUS_CODE_LATE_TECHNICAL
      message = message.concat('LATE TECHNICAL')
      break
    case '50':
      currentStatus = STATUS_CODE_LATE_OTHER
      message = message.concat('LATE OTHER')
      break
    default:
      currentStatus = STATUS_CODE_UNKNOWN
      message = message.concat('UNKNOWN')
      break
  }
  res.send({
    message: message,
  })
})

export default app
