import DOM from './dom'
import Contract from './contract'
import './flightsurety.css'
;(async () => {
  let contract = new Contract('localhost', () => {
    DOM.elid('UdacityAir').value = contract.owner
    DOM.elid('selected-airline-address').value = contract.owner
    DOM.elid('selected-airline-name').value = 'UdacityAir'

    // Read transaction
    contract.isOperational((error, result) => {
      display('DAPP logs', 'Check if contract is operational', [
        { label: 'Operational Status', error: error, value: result },
      ])
    })

    // Register airline
    DOM.elid('register-airline').addEventListener('click', async () => {
      let address = DOM.elid('airline-address').value
      let sender = DOM.elid('selected-airline-address').value
      let name = DOM.elid('airline-name').value

      contract.registerAirline(address, name, sender, (err, result) => {
        display('', 'Added new airline address and name: ', [
          { label: 'Register Airline', error: err, value: result.message },
        ])
        if (err) {
          console.log(err)
        } else if (result.registered == true) {
          addAirlineOption(name, address)
        }
      })
    })

    DOM.elid('submit-oracle').addEventListener('click', async () => {
      let flight = DOM.elid('flight-number').value
      let selectedAirlineAddress = DOM.elid('selected-airline-address').value

      contract.fetchFlightStatus(
        selectedAirlineAddress,
        flight,
        (error, result) => {
          display('', 'Trigger oracles', [
            {
              label: 'Fetch Flight Status',
              error: error,
              value:
                result.flight + ' ' + getTimeFromTimestamp(result.timestamp),
            },
          ])
          let newTime = result.timestamp
          showLoading()
          setTimeout(() => {
            contract.getFlightStatus(
              selectedAirlineAddress,
              flight,
              (error, result) => {
                if (!error) {
                  changeFlightStatus(flight, result, newTime)
                }
              },
            )
            hideLoading()
          }, 2000)
        },
      )
    })

    // User-submitted transaction
    DOM.elid('fund').addEventListener('click', async () => {
      let funds = DOM.elid('funds').value
      contract.fund(funds, (error, result) => {
        display('', `Funds added`, [
          {
            label: 'Funds added to airline: ',
            error: error,
            value: result.funds + ' wei',
          },
        ])
        display('', '', [
          { label: 'Airline is active: ', value: result.active },
        ])
      })
    })

    DOM.elid('register-flight').addEventListener('click', async () => {
      let flight = DOM.elid('new-flight-number').value
      let destination = DOM.elid('new-flight-destination').value

      contract.registerFlight(flight, destination, (error, result) => {
        if (error) {
          console.log(error)
        }
        display('', 'Register new flight', [
          {
            label: 'Info:',
            error: error,
            value:
              'Flight code: ' +
              result.flight +
              ' Destination: ' +
              result.destination,
          },
        ])
        if (!error) {
          flightDisplay(flight, destination, result.address, result.timestamp)
        }
      })
    })

    DOM.elid('buy-insurance').addEventListener('click', () => {
      const insurancePrice = DOM.elid('insurance-price').value
      const flight = DOM.elid('insurance-flight').value

      contract.buy(flight, insurancePrice, (err, result) => {
        if (err) {
          console.log('err', err)
        }
        display('', 'New flight insurance is bought!', [
          {
            label: 'Insurance information',
            error: err,
            value: `Flight ${result.flight}. Paid ${result.price} wei. Passenger ${result.passenger}`,
          },
        ])
      })
    })

    DOM.elid('claim-credit').addEventListener('click', () => {
      contract.pay((err) => {
        if (err) {
          console.log(err)
        } else {
          DOM.elid('credit-ammount').value = '0 ethers'
        }
      })
    })

    DOM.elid('check-credit').addEventListener('click', () => {
      contract.getCurrentPassengerCredit((err, result) => {
        if (err) {
          console.log(err)
          DOM.elid('credit-ammount').value =
            'Something went wrong while getting your credit'
        } else {
          DOM.elid('credit-ammount').value = result + ' wei'
        }
      })
    })

    DOM.elid('airlineDropdownOptions').addEventListener('click', (event) => {
      event.preventDefault()
      DOM.elid('selected-airline-address').value = event.srcElement.value
      DOM.elid('selected-airline-name').value = event.srcElement.innerHTML
    })
  })

  DOM.elid('statusButton').addEventListener('click', async (e) => {
    e.preventDefault()
    let buttonValue = e.srcElement.value
    const response = await fetch(
      `http://localhost:3000/api/status/${buttonValue}`,
    )
    const myJson = await response.json()
    display('', 'Default flights status change submited to server.', [
      { label: 'Server response: ', value: myJson.message },
    ])
  })

  DOM.elid('flights-display').addEventListener('click', async (e) => {
    const flightCode = e.srcElement.innerHTML
    flightCode = flightCode
      .replace('✈ ', '')
      .replace('<b>', '')
      .replace('</b>', '')
    navigator.clipboard.writeText(flightCode).then(
      () => {
        console.log(
          `Copying to clipboard was successful! Copied: ${flightCode}`,
        )
      },
      (error) => {
        console.error('can not copy text: ', error)
      },
    )
  })
})()

function display(title, description, results) {
  const displayDiv = DOM.elid('display-wrapper')
  const section = DOM.section()

  if (title != '') {
    section.appendChild(DOM.h2(title))
  }

  section.appendChild(DOM.h5(description))

  results.map((result) => {
    let row = section.appendChild(DOM.div({ className: 'row' }))
    row.appendChild(DOM.div({ className: 'col-sm-4 field' }, result.label))
    row.appendChild(
      DOM.div(
        { className: 'col-sm-8 field-value' },
        result.error ? String(result.error) : String(result.value),
      ),
    )
    section.appendChild(row)
  })
  displayDiv.append(section)
}

function addAirlineOption(airlineName, hash) {
  var dropdown = DOM.elid('airlineDropdownOptions')

  let newOption = DOM.button(
    { className: 'dropdown-item', value: hash, type: 'button' },
    airlineName,
  )
  dropdown.appendChild(newOption)
}

function changeFlightStatus(flight, status, newTime) {
  const row = DOM.elid(flight)
  const cell3 = row.insertCell(2)
  const cell4 = row.insertCell(3)
  let statusText = ''

  row.deleteCell(3)
  row.deleteCell(2)

  switch (status) {
    case '10':
      statusText = 'ON TIME'
      cell3.style = 'color:white'
      cell4.style = 'color:green'
      break
    case '20':
      statusText = 'LATE AIRLINE'
      cell3.style = 'color:red'
      cell4.style = 'color:red'
      break
    case '30':
      statusText = 'LATE WEATHER'
      cell3.style = 'color:red'
      cell4.style = 'color:yellow'
      break
    case '40':
      statusText = 'LATE TECHNICAL'
      cell3.style = 'color:red'
      cell4.style = 'color:yellow'
      break
    case '50':
      statusText = 'LATE OTHER'
      cell3.style = 'color:red'
      cell4.style = 'color:yellow'
      break
    default:
      statusText = 'UNKNOWN'
      cell3.style = 'color:white'
      cell4.style = 'color:white'
      break
  }
  cell3.innerHTML = getTimeFromTimestamp(newTime)
  cell4.innerHTML = statusText
}

function getTimeFromTimestamp(timestamp) {
  return new Date(timestamp * 1000).toLocaleTimeString('es-ES').slice(0, -3)
}

let flightCount = 0

function flightDisplay(flight, destination, airlineName, time) {
  const table = DOM.elid('flights-display')
  flightCount++

  const row = table.insertRow(flightCount)
  row.id = flight

  var cell1 = row.insertCell(0)
  var cell2 = row.insertCell(1)
  var cell3 = row.insertCell(2)
  var cell4 = row.insertCell(3)

  var date = new Date(+time)

  cell1.innerHTML = '<b>✈ ' + flight + '</b>'
  cell1.setAttribute('data-toggle', 'tooltip')
  cell1.setAttribute('data-placement', 'top')
  cell1.title = 'Click on flight code to copy'
  cell2.innerHTML = destination.toUpperCase()
  cell3.innerHTML = date.getHours() + ':' + date.getMinutes()
  cell4.innerHTML = 'ON TIME'
  cell4.style = 'color:green'
}

function showLoading() {
  document.getElementById('oracles-spinner').hidden = false
  document.getElementById('submit-oracle').disabled = true
}

function hideLoading() {
  document.getElementById('oracles-spinner').hidden = true
  document.getElementById('submit-oracle').disabled = false
}
