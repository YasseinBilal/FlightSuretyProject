module.exports = {
  networks: {
    development: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*',
      gas: 0xfffffffffff, // <-- Use this high gas value
      gasPrice: 0x01, // <-- Use this low gas price
      accounts: 60,
    },
  },
  compilers: {
    solc: {
      version: '0.4.24',
    },
  },
}
