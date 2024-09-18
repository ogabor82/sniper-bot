// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    constructor(
        string memory name,
        string memory ticker,
        uint256 initialSupply
    ) ERC20(name, ticker) {
        _mint(msg.sender, initialSupply);
    }
}