pragma solidity 0.4.24;

// It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/

import "./SafeMath.sol";

contract FlightSuretyDataInterface {
    function isOperational() public view returns(bool);
    function isAirlineActive ( address airline) public view returns(bool);
    function registerAirline(address airlineAddress, string name) external;
    function creditInsurees (string flightCode) external;
}


/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    FlightSuretyDataInterface flightSuretyData;

    address private contractOwner;

    mapping(bytes32 => Flight) private flights;
    mapping(address => address[]) private airlineVoters;

    struct Flight {
        uint8 statusCode;
        uint256 timestamp;
        address airline;
        bool isRegistered;
        string flightCode;
        string destination;
    }

    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;


    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    /**
    * @dev Contract constructor
    *
    */
    constructor (address dataContractAddress) public {
        flightSuretyData = FlightSuretyDataInterface(dataContractAddress);
        contractOwner = msg.sender;
    }

    /****************************************************************************************** */
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/


    modifier requireActiveAirline()
    {
        require(flightSuretyData.isAirlineActive(msg.sender), "Airline is not active");
        _;
    }

    modifier requireNotVotedAirline(address airlineAddress) {
        require(!isAirlineVoted(airlineVoters[airlineAddress]), "This airline you already voted for");
        _;
    }

    modifier requireOperationalContract() {
        require(flightSuretyData.isOperational(), "Not operational contract");
        _;
    }

    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Require contract owner to call");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function isOperational() public view returns(bool) {
        return flightSuretyData.isOperational();
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/


   /**
    * @dev Add an airline to the registration queue
    *
    */
    function registerAirline (address airlineAddress, string memory name) public
        requireOperationalContract
        requireActiveAirline
        requireNotVotedAirline (airlineAddress) {

        flightSuretyData.registerAirline(airlineAddress, name);
        airlineVoters[airlineAddress].push(msg.sender);
    }

    function isAirlineVoted(address[] memory airlines) internal view returns (bool alreadyVoted) {
        for (uint256 i = 0; i < airlines.length; i++) {
            if (airlines[i] == msg.sender) {
                return true;
            }
        }
        return false;
    }

   /**
    * @dev Register a future flight for insuring.
    *
    */
    function registerFlight (string flight, string flightDestination, uint256 flightTimestamp)
         external
         requireOperationalContract
         requireActiveAirline {

        bytes32 key = keccak256(abi.encodePacked(flight, msg.sender));

        require(!flights[key].isRegistered, "Already registered flight");

        flights[key] = Flight({
            statusCode: STATUS_CODE_UNKNOWN,
            timestamp: flightTimestamp,
            airline: msg.sender,
            isRegistered: true,
            flightCode: flight,
            destination: flightDestination
       });
    }

   /**
    * @dev Called after oracle has updated flight status
    *
    */
    function processFlightStatus (address airline, string memory flight, uint256 flightTimestamp, uint8 flightStatusCode)
        internal
        requireOperationalContract {

        bytes32 key = keccak256(abi.encodePacked(flight, airline));

        require(flights[key].isRegistered, "Not registered flight");


        flights[key].statusCode = flightStatusCode;
        flights[key].timestamp = flightTimestamp;

        if (flightStatusCode == STATUS_CODE_LATE_AIRLINE) {
            flightSuretyData.creditInsurees(flight);
        }
    }

    function fetchFlightStatus (address airline, string flight, uint256 flightTimestamp)
        external
        requireOperationalContract {

        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, flightTimestamp));
        uint8 index = getRandomIndex(msg.sender);

        oracleResponses[key] = ResponseInfo({
                                    isOpen: true,
                                    requester: msg.sender
                                });

        emit OracleRequest(index, airline, flight, flightTimestamp);
    }

    // Get flight status
    function getFlightStatus (string flight, address airline) external view returns(uint8) {
        bytes32 key = keccak256(abi.encodePacked(flight, airline));
        return flights[key].statusCode;
    }

// region ORACLE MANAGEMENT

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;


    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester;                              // Account that requested status
        bool isOpen;                                    // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses;          // Mapping key is the status code reported
                                                        // This lets us group responses and identify
                                                        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(address airline, string flight, uint256 timestamp, uint8 status);

    event OracleReport(address airline, string flight, uint256 timestamp, uint8 status);

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(uint8 index, address airline, string flight, uint256 timestamp);


    // Register an oracle with the contract
    function registerOracle () external payable {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({
                                        isRegistered: true,
                                        indexes: indexes
                                    });
    }

    function getMyIndexes () external view returns(uint8[3] memory) {
        require(oracles[msg.sender].isRegistered, "Not registered as an oracle");
        return oracles[msg.sender].indexes;
    }


    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse (uint8 index, address airline, string flight, uint256 timestamp, uint8 statusCode) external {
        require((oracles[msg.sender].indexes[0] == index) || (oracles[msg.sender].indexes[1] == index) || (oracles[msg.sender].indexes[2] == index), "Index does not match oracle request");


        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        require(oracleResponses[key].isOpen, "Flight or timestamp do not match oracle request");
        //if (oracleResponses[key].isOpen) {}
        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES) {

            emit FlightStatusInfo(airline, flight, timestamp, statusCode);

            // Handle flight status as appropriate
            processFlightStatus(airline, flight, timestamp, statusCode);
        }
    }


    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        internal
                        pure
                        returns(bytes32)
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes
                            (
                                address account
                            )
                            internal
                            returns(uint8[3] memory)
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);

        indexes[1] = indexes[0];
        while(indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex
                            (
                                address account
                            )
                            internal
                            returns (uint8)
    {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);

        if (nonce > 250) {
            nonce = 0;  // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

// endregion

}