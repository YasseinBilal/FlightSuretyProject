var Test = require('../config/testConfig.js')

contract('Flight Surety Tests', async (accounts) => {
  const ORACLES_COUNT = 20
  let config

  before('setup contract', async () => {
    config = await Test.Config(accounts)
    await config.flightSuretyData.authorizeCaller(
      config.flightSuretyApp.address,
    )
  })

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {
    const status = await config.flightSuretyData.isOperational.call()
    assert.equal(status, true, 'Contract is not operational')
  })

  it(`App contract should be authorized`, async function () {
    const status = await config.flightSuretyData.isAuthorized.call(
      config.flightSuretyApp.address,
    )
    assert.equal(status, true, 'App contract should be authorized')
  })

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {
    // Ensure that access is denied for non-Contract Owner account
    let accessDenied = false
    try {
      await config.flightSuretyData.setOperatingStatus(false, {
        from: config.testAddresses[2],
      })
    } catch (e) {
      accessDenied = true
    }
    assert.equal(accessDenied, true, 'Access not restricted to Contract Owner')
  })

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {
    // Ensure that access is allowed for Contract Owner account
    let accessDenied = false
    try {
      await config.flightSuretyData.setOperatingStatus(false)
    } catch (e) {
      accessDenied = true
    }
    assert.equal(accessDenied, false, 'Access not restricted to Contract Owner')
  })

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {
    await config.flightSuretyData.setOperatingStatus(false)

    let reverted = false
    try {
      await config.flightSurety.setTestingMode(true)
    } catch (e) {
      reverted = true
    }
    assert.equal(
      reverted,
      true,
      'Access not blocked for requireOperationalContract',
    )

    // Set it back for other tests to work
    await config.flightSuretyData.setOperatingStatus(true)
  })

  it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
    // ARRANGE
    let newAirline = accounts[2]

    // ACT
    try {
      await config.flightSuretyApp.registerAirline(newAirline, {
        from: config.firstAirline,
      })
    } catch (e) {}

    const result = await config.flightSuretyData.isAirlineRegistered.call(
      newAirline,
    )

    // ASSERT
    assert.equal(
      result,
      false,
      "Airline should not be able to register another airline if it hasn't provided funding",
    )
  })

  it('When contract is deployed, Contract owner should be registered as an airline', async () => {
    const airlinesCount = await config.flightSuretyData.airlinesCount.call()
    const isAirlineRegistered = await config.flightSuretyData.isAirlineRegistered.call(
      accounts[0],
    )
    assert.equal(
      airlinesCount,
      1,
      'Airlines count should be one after contract is deployed',
    )
    assert.equal(
      isAirlineRegistered,
      true,
      'First airline should be registired when contract is deployed',
    )
  })

  it('(Airline) can register an Airline using registerAirline() directly without need of a consensus', async () => {
    // ARRANGE
    const minFund = await config.flightSuretyData.MINIMUM_FUNDS_FOR_ACTIVE_AIRLINE.call()

    // ACT
    try {
      await config.flightSuretyData.fund({ from: accounts[0], value: minFund })
      await config.flightSuretyApp.registerAirline(
        config.firstAirline,
        'new airline',
        { from: accounts[0] },
      )
    } catch (e) {
      console.log(e)
    }
    let airlinesCount = await config.flightSuretyData.airlinesCount.call()
    let result = await config.flightSuretyData.isAirlineRegistered.call(
      config.firstAirline,
    )

    // ASSERT
    assert.equal(airlinesCount, 2, 'Airlines count should be 2')
    assert.equal(
      result,
      true,
      'Airline should be able to register another airline directly when less than 4 registered',
    )
  })

  it('(Airline) 50% votes needed to register an Airline once there are 4 or more airlines registered', async () => {
    // ACT
    try {
      await config.flightSuretyApp.registerAirline(
        accounts[2],
        'test airline 2',
        { from: accounts[0] },
      )
      await config.flightSuretyApp.registerAirline(
        accounts[3],
        'test airline 3',
        { from: accounts[0] },
      )
      await config.flightSuretyApp.registerAirline(
        accounts[4],
        'test airline 3',
        { from: accounts[0] },
      )
    } catch (e) {
      console.log(e)
    }
    const result = await config.flightSuretyData.isAirlineRegistered.call(
      accounts[4],
    )

    let airlinesCount = await config.flightSuretyData.airlinesCount.call()

    // ASSERT
    assert.equal(result, false, '50% votes is needed to register airline')
    assert.equal(
      airlinesCount,
      4,
      'Registered Airlines should be 4 after registering airlines',
    )
  })

  it('(airline) can register a flight using registerFlight()', async () => {
    // ARRANGE
    const timestamp = Math.floor(Date.now() / 1000)

    // ACT
    try {
      await config.flightSuretyApp.registerFlight(
        'EGY123',
        'Cairo',
        timestamp,
        { from: config.firstAirline },
      )
    } catch (e) {
      console.log(e)
    }

    // ASSERT
    const flightStattus = await config.flightSuretyApp.getFlightStatus.call(
      'EGY123',
      config.firstAirline,
    )
    assert.equal(
      flightStattus,
      0,
      'Flight status should be unknown after registering flight',
    )
  })

  it('20 oracles are registered and persisted in memory with their indexes', async () => {
    // ARRANGE
    const registerationFee = await config.flightSuretyApp.REGISTRATION_FEE.call()

    // ACT
    for (let i = 20; i < ORACLES_COUNT + 20; i++) {
      await config.flightSuretyApp.registerOracle({
        from: accounts[i],
        value: registerationFee,
      })
      const result = await config.flightSuretyApp.getMyIndexes.call({
        from: accounts[i],
      })
      assert.equal(
        result.length,
        3,
        'Oracle should be registered with three indexes',
      )
    }
  })

  it('(Passenger) may pay up to 1 ether for purchasing flight insurance.', async () => {
    // ARRANGE
    const maxInsurancePrice = await config.flightSuretyData.MAX_INSURANCE_LIMIT.call()
    let passenger

    // ACT
    try {
      await config.flightSuretyData.buy('EGY333', {
        from: config.firstPassenger,
        value: maxInsurancePrice,
      })
      passenger = await config.flightSuretyData.passengerAddresses.call(0)
    } catch (e) {
      console.log(e)
    }

    assert.equal(
      passenger,
      config.firstPassenger,
      'Passenger should be added to list of insured passengers',
    )
  })
})
