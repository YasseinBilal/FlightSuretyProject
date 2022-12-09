pragma solidity 0.4.24;

import "./SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    // CONSTANTS
    uint256 public constant MAX_INSURANCE_LIMIT = 1 ether;
    uint256 public constant MINIMUM_FUNDS_FOR_ACTIVE_AIRLINE = 10 ether;
    uint8 private constant MULTI_PARTY_MIN_AIRLINES = 4;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;
    bool private operational = true;

    struct Airline {
        address airlineAddress;
        bool isRegistered;
        string name;
        uint256 funded;
        uint256 votes;
    }

    mapping(address => bool) private authorizedContracts;

    mapping(address => Airline) private airlines;

    struct Passenger {
        address passengerAddress;
        mapping(string => uint256) insuracesBought;
        uint256 credit;
    }

    mapping(address => Passenger) private passengers;
    address[] public passengerAddresses;

    uint256 public airlinesCount;

    /**
    * @dev Constructor
    */
    constructor () public {
        contractOwner = msg.sender;
        authorizedContracts[msg.sender] = true;

        // 	Register first airline
        airlines[msg.sender] = Airline({
                                    airlineAddress: msg.sender,
                                    isRegistered: true,
                                    name: "UdacityAir",
                                    funded: 0,
                                    votes: 0
                                });
        airlinesCount++;
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in
    *      the event there is an issue that needs to be fixed
    */
    modifier requireOperationalContract()
    {
        require(operational, "Contract is currently not operational");
        _;
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /**
    * @dev Modifier that requires the calling App contract has been authorized
    */
    modifier requireAuthorizedCaller()
    {
        require(authorizedContracts[msg.sender] == true, "Caller should be authorized");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/


    function isAuthorized (address contractAddress) external view returns (bool) {
        return(authorizedContracts[contractAddress] == true);
    }

    function authorizeCaller (address contractAddress) external requireContractOwner {
        authorizedContracts[contractAddress] = true;
    }

    function isOperational() public view returns (bool) {
        return operational;
    }

    function setOperatingStatus(bool mode) external requireContractOwner {
        operational = mode;
    }

    function isPassengerAdded(address passengerAddress) internal view returns (bool) {
        for (uint256 i = 0; i < passengerAddresses.length; i++) {
            if (passengerAddresses[i] == passengerAddress) {
                return true;
            }
        }
        return false;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    function registerAirline(address airlineAddress, string airlineName) external
        requireOperationalContract
        requireAuthorizedCaller {

        require(airlineAddress != address(0), "Airline address should be valid");
        require(!airlines[airlineAddress].isRegistered, "Airline is already registered");

        if(airlinesCount < MULTI_PARTY_MIN_AIRLINES){
            airlines[airlineAddress] = Airline({
                                         airlineAddress: airlineAddress,
                                         isRegistered: true,
                                         name: airlineName,
                                         funded: 0,
                                         votes: 1
                                        });
            airlinesCount++;
        } else {
            airlines[airlineAddress].votes++;
            if (airlines[airlineAddress].votes >= airlinesCount.div(2)) {
                airlines[airlineAddress].isRegistered = true;
                airlinesCount++;
            }
        }
    }

   /**
    * @dev Buy insurance for a flight
    *
    */
    function buy (string flightCode) external payable requireOperationalContract {
        require(msg.sender == tx.origin, "Not allowed to be called from contract address");
        require(msg.value > 0, 'A value for insurance should be sent');

        if(!isPassengerAdded(msg.sender)){
            passengerAddresses.push(msg.sender);
        }

        if (passengers[msg.sender].passengerAddress == address(0)) {
            passengers[msg.sender] = Passenger({
                                        passengerAddress: msg.sender,
                                        credit: 0
                                     });
        }

        passengers[msg.sender].insuracesBought[flightCode] = msg.value;

        if (msg.value > MAX_INSURANCE_LIMIT) {
            msg.sender.transfer(msg.value.sub(MAX_INSURANCE_LIMIT));
        }
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees (string flightCode) external requireOperationalContract {
        for (uint256 i = 0; i < passengerAddresses.length; i++) {
            Passenger storage passenger = passengers[passengerAddresses[i]];

            if(passenger.insuracesBought[flightCode] != 0) {
                uint256 currentCredit = passenger.credit;
                uint256 payedInsurance = passenger.insuracesBought[flightCode];
                passenger.insuracesBought[flightCode] = 0;
                passenger.credit = currentCredit + payedInsurance + payedInsurance.div(2);
            }
        }
    }

    function getCurrentPassengerCredit() external view returns (uint256) {
        return passengers[msg.sender].credit;
    }
    
    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function withdraw (address passenger) public requireOperationalContract {
        uint credit = passengers[passenger].credit;
        require(passengers[passenger].credit > 0, "There is no credit to withdraw");
        require(address(this).balance > credit, "Not enough balance in contract to withdraw from");
        passengers[passenger].credit = 0;
        passenger.transfer(credit);
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */
    function fund () public payable requireOperationalContract {
        uint256 currentFund = airlines[msg.sender].funded;
        airlines[msg.sender].funded = currentFund.add(msg.value);
    }

    function isAirlineRegistered (address airline) external view returns (bool) {
        return airlines[airline].airlineAddress == airline;
    }

    function getFlightKey (address airline, string memory flight, uint256 timestamp) internal pure returns(bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    function isAirlineActive ( address airline) public view returns(bool) {
        return(airlines[airline].funded >= MINIMUM_FUNDS_FOR_ACTIVE_AIRLINE);
    }

    function isRegistered ( address airline) public view returns(bool) {
        return airlines[airline].isRegistered;
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() external payable {
        fund();
    }
}

