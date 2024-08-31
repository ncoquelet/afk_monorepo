// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import {CairoLib} from "kakarot-lib/CairoLib.sol";

using CairoLib for uint256;

contract LaunchpadPumpDualVM {
    /// @dev The address of the cairo contract to call
    uint256 immutable starknetLaunchpad;

   /// @dev The cairo function selector to call - `create_token`
    uint256 constant FUNCTION_SELECTOR_CREATE_TOKEN = uint256(keccak256("create_token")) % 2 ** 250;

   /// @dev The cairo function selector to call - `create_and_launch_token`
    uint256 constant FUNCTION_SELECTOR_CREATE_TOKEN_AND_LAUNCH= uint256(keccak256("create_and_launch_token")) % 2 ** 250;


    /// @dev The cairo function selector to call - `launch_token`
    uint256 constant FUNCTION_SELECTOR_LAUNCH_TOKEN = uint256(keccak256("launch_token")) % 2 ** 250;


    /// @dev The cairo function selector to call - `get_coin_launch`
    uint256 constant FUNCTION_SELECTOR_GET_LAUNCH = uint256(keccak256("get_coin_launch")) % 2 ** 250;

   /// @dev The cairo function selector to call - `buy_coin_by_quote_amount`
    uint256 constant FUNCTION_SELECTOR_BUY_COIN = uint256(keccak256("buy_coin_by_quote_amount")) % 2 ** 250;

   /// @dev The cairo function selector to call - `sell_coin`
    uint256 constant FUNCTION_SELECTOR_SELL_COIN = uint256(keccak256("sell_coin")) % 2 ** 250;

    struct SharesTokenUser {
     address owner;
        address token_address;
        uint256 price;
        uint256 amount_owned;
        uint256 amount_buy;
        uint256 amount_sell;
        uint256 total_paid;
        uint64 created_at;
    }

    struct TokenLaunch {
        address owner;
        address token_address;
        uint256 price;
        uint256 available_supply;
        uint256 total_supply;
        uint256 initial_key_price;
        uint256 liquidity_raised;
        uint256 token_holded;
        bool is_liquidity_launch;
        uint256 slop;
        uint64 created_at;
    }

    struct Token {
        address owner;
        address token_address;
        bytes symbol;
        bytes name;
        uint256 total_supply;
        uint256 initial_supply;
        uint64 created_at;
        
    }


    constructor(uint256 _starknetLaunchpad) {
        starknetLaunchpad = _starknetLaunchpad;
    }

    function getLaunchPump(uint256 tokenAddress) public {

        uint256[] memory tokenAddressCalldata = new uint256[](1);
        tokenAddressCalldata[0] = uint256(uint160(tokenAddress));
        uint256 tokenStarknetAddress =
            abi.decode(starknetLaunchpad.staticcallCairo("compute_starknet_address", tokenAddressCalldata), (uint256));

        // call launch that sent struct
        // todo how do it?
    }


    /** */
    function createToken(address recipient,
     bytes calldata symbol,
        bytes calldata name,
       uint256 initialSupply,
        bytes calldata contractAddressSalt
    ) public {

        uint256[] memory recipientAddressCalldata = new uint256[](1);
        recipientAddressCalldata[0] = uint256(uint160(recipient));
        uint256 recipientStarknetAddress =
            abi.decode(starknetLaunchpad.staticcallCairo("compute_starknet_address", recipientAddressCalldata), (uint256));

        uint128 amountLow = uint128(initialSupply);
        uint128 amountHigh = uint128(initialSupply >> 128);

        uint256[] memory createTokenCallData = new uint256[](6);
        createTokenCallData[0] = recipientStarknetAddress;
        // Decode the first 32 bytes (a uint256 is 32 bytes)
        uint256 symbolResult = abi.decode(symbol, (uint256));
        uint256 nameResult = abi.decode(name, (uint256));
        uint256 contractAddressSaltResult = abi.decode(contractAddressSalt, (uint256));

        createTokenCallData[1] = uint(symbolResult);
        createTokenCallData[2] = uint(nameResult);
        createTokenCallData[3] = uint256(amountLow);
        createTokenCallData[4] = uint256(amountHigh);
        createTokenCallData[5] = uint256(contractAddressSaltResult);

        starknetLaunchpad.callCairo(FUNCTION_SELECTOR_CREATE_TOKEN, createTokenCallData);

    }


    function createAndLaunchToken(
        address recipient,
         bytes calldata symbol,
         bytes calldata name,
        uint256 initialSupply,
         bytes calldata contractAddressSalt
        ) public {


    }

    function buyToken() public {

    }

    function sellToken() public {

    }
    
}