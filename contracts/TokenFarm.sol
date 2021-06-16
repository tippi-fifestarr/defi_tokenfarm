//what it needs to do: 
//0. work
//1. staking
//2. rewarding  (issue?)
//3. unstake
//4. allow addresses?

pragma solidity ^0.6.6;

//import the interface IERC20 allows us to easily interact with ERC20
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";

contract TokenFarm is Ownable{
    string public name = "Go_d Token Farm";
    IERC20 public go_dToken;
    address[] public stakers;
    //allow tokens, push in there
    // mapping(address => bool) public allowedTokens;
    address[] allowedTokens;
    //^ upgrade this to mapping but just go with it for now
    //stakingBalance is the "ledger" of approved tokens mapped to a mapping
    //token address => mapping of user addresses -> amounts
    mapping(address => mapping(address => uint256)) public stakingBalance;
    mapping(address => uint256) public uniqueTokensStaked;
    mapping(address => address) public tokenPriceFeedMapping;
    
    constructor(address _go_dTokenAddress) public {
        //allows us to say "hey this is an erc20"
        go_dToken = IERC20(_go_dTokenAddress);
    }

    //how to let the users stake (without rewards)
    function stakeTokens(uint256 _amount, address token) public {
        //stake a certain amout of a token
        require(_amount > 0, "amount cannot be zero");
        //think about do we want them to stake any and all tokens?
        //how to assess value?  need price feed
        //create new function tokenIsAllowed
        if (isTokenAllowed(token)) {
            //unlock this
            updateUniqueTokensStake(msg.sender, token);
            //here the contract is actually doing the transferring, approve that this contract can do
            //send from user to THIS CONTRACT, because the user owns the tokens and the contract moves
            IERC20(token).transferFrom(msg.sender, address(this), _amount);
            //keep track (add the new amount)
            stakingBalance[token][msg.sender] = stakingBalance[token][msg.sender] + _amount;
            //only update if a unique token has been staked
            //if first token
            if (uniqueTokensStaked[msg.sender] == 1){
                stakers.push(msg.sender);
            } 
        }
    }
    //this is a dangerous function!!! why?
    function updateUniqueTokensStake(address user, address token) internal {
        if(stakingBalance[token][user] <= 0){
            uniqueTokensStaked[user] = uniqueTokensStaked[user] + 1;
        }
    }

    function isTokenAllowed(address token) public returns(bool){
        //we need a mapping or array, loop around it
        for(
            uint256 allowedTokensIndex = 0;
            allowedTokensIndex < allowedTokens.length;
            allowedTokensIndex++) {
                if (allowedTokens[allowedTokensIndex] == token){
                    return true;
                }
            }
            return false;
    }
    //need a token manager, such as governance DAO or onlyOwner
    function addAllowedTokens(address token) public onlyOwner {
        allowedTokens.push(token);
        // allowedTokens[token] = true;
    }

    function unstakeTokens(address token) public {
        uint256 balance = stakingBalance[token][msg.sender];
        require(balance > 0, "Staking balance cannot be zero!");
        //notice transfer vs transferFrom
        //we use transfer when the contract owns the tokens AND is moving the tokens
        IERC20(token).transfer(msg.sender, balance);
        stakingBalance[token][msg.sender] = 0;
        uniqueTokensStaked[msg.sender] = uniqueTokensStaked[msg.sender] - 1;
    }

    //liquidity farming stuff!
    function issueTokens() public onlyOwner {
        //we want an idea of who the stakers are
        for (
            uint256 stakersIndex = 0;
            stakersIndex < stakers.length;
            stakersIndex++){
                address recipient = stakers[stakersIndex];
                go_dToken.transfer(recipient, getUserTotalValue(recipient));
            }
    }

    function getUserTotalValue(address user) public view returns(uint256){
        uint256 totalValue = 0;
        if (uniqueTokensStaked[user] > 0){
        //loop through all the tokens they have staked and get the ethereum value
            //a mapping would be suck
            for(
                uint256 allowedTokensIndex=0;
                allowedTokensIndex < allowedTokens.length;
                allowedTokensIndex++
            ){
                //get the value of the user and the tokens 
                totalValue = 
                    totalValue + 
                    getUserStakingBalanceEthValue(
                        user,
                        allowedTokens[allowedTokensIndex]
                );
            }
        }
    }

    function getUserStakingBalanceEthValue(address user, address token) public view returns (uint256){
        if(uniqueTokensStaked[user] <= 0){
            return 0;
        } //you don't any tokens, bub, beat it! https://youtu.be/Zuyfy9wz5Ww?list=PLVP9aGDn-X0Shwzuvw12srE-O6WKsGvY_&t=3529 
        return (stakingBalance[token][user] * getTokenEthPrice(token)) / (10**18); //divide by precision
    }

    function setPriceFeedContract(address token, address priceFeed) public onlyOwner {
        tokenPriceFeedMapping[token] = priceFeed;
    }

    function getTokenEthPrice(address token) public view returns(uint256){
        address priceFeedAddress = tokenPriceFeedMapping[token];
        //https://docs.chain.link/docs/get-the-latest-price/
        AggregatorV3Interface priceFeed = AggregatorV3Interface (priceFeedAddress);
         (
            uint80 roundID, 
            int price,
            uint startedAt,
            uint timeStamp,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        return uint256(price);
    }
}