// contracts/Go_dToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Go_dToken is ERC20 {
    constructor() public ERC20("Go_d for Game", "GO_D") {
        _mint(msg.sender, 10000000000000000000000000);
    }
}
