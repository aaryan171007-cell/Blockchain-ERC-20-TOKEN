// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AarX {

    //Currency name and symbol
    string public name = "AarXToken";
    string public sym = "ARX";

    //Variable declarations
    uint256 public decimals = 18;
    uint256 public totalsupply = 0;

    //Modifier to check everytime before executing a function whether the contract is destroyed or not 
    bool public destroy = false;
    modifier notdestroyed() {
        require(!destroy, "ERROR: Tokens are destroyed");
        _;
    }

    //I have set the max cap to be 1000 ERC-20 Tokens 
    uint256 public max_cap = 1000 * 10**18; //Ether to wei conversion
    
    //Constructor declaration : This constructor was already invoked when I deployed this contract on Sepolia testnet
    //Thus, my account's address is set to be as the owner
    address public owner;
    constructor(){
        owner = msg.sender;
    }

    //event declaration for the contract features like minting, burning, transfering tokens
    event mint(address indexed to, uint256 amount);
    event transfer(address indexed from, address indexed to, uint256 amount);
    event burn(address indexed from, uint256 amount);

    //Declaring a map to store the wallet's address mapped with their account's balance
    mapping(address => uint256) private balance;

    /******************** Minting Tokens function declarataion **************************/
    function mintWithRewards(uint256 amt) public notdestroyed {

        //Whenever a user mints my tokens he or she will always receive extra 10% of the tokens they have minted as a reward
        //Thus the total would be their minted tokens + the 10% reward
        uint256 total_amt = amt + amt/10;

        //Check whether the total supply is within the max cap limit or not 
        require(totalsupply <= max_cap, "ERROR: Overminted Tokens");

        //Updating the total supply and storing the user's account address in the hash map
        totalsupply += total_amt;
        balance[msg.sender]+=total_amt;

        //Emitting the the require events to complete the function
        emit mint(msg.sender, total_amt);

        //Here, address(0) stands for a NULL address becuase whenever a user mints the tokens, he or she will receive the tokens by the contract itself 
        emit transfer(address(0), msg.sender, total_amt);
    }

    /******************** Transfer Tokens function declaration **************************/
    function transferTokens(address to, uint256 amt) public notdestroyed returns (bool){

        // 2 safety checks to ensure whether a user has enough tokens to transfer and whether the receiver's address is a valid address or not 
        require(balance[msg.sender] >= amt, "ERROR: Not enough funds");
        require(to != address(0), "ERROR: Missing address");
        
        //Updating the amount in both sender's and receiver's accounts
        balance[msg.sender]-=amt;
        balance[to]+=amt;

        //Event call 
        emit transfer(msg.sender, to, amt);
        return true;
    }

    /******************** Burn Tokens function declaration **************************/
    function burnToken(uint256 amt) public notdestroyed {

        //Check to determine whether the user has enough tokens to burn
        require(balance[msg.sender] >= amt, "ERROR: You have no tokens to burn");

        //Updating the user's account with the left amount
        totalsupply-=amt;
        balance[msg.sender]-=amt;

        //Event call
        emit burn(msg.sender, amt);

        //Here again the user will transfer all their burned tokens to the contract itself, that's why the receiver's address is address(0)
        emit transfer(msg.sender, address(0), amt);
    }

    /******************** Show Balance function declaration **************************/
    function showbalance(address account) public view returns (uint256) {
        return balance[account]; //Returns the total balance of the user's account
    }

    /******************** Destroy Contract function declaration *************************/
    function selfDestruct() public notdestroyed {

        //Check whether the person calling the fuction is the owner of the contract or not 
        require(msg.sender == owner, "ERROr: Access denied");
        destroy=true;
    }

}