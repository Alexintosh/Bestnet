// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "@forge-std/Script.sol";
import {Counter} from "../src/Counter.sol";

contract CounterScript is Script {

    Counter c;
    function setUp() public {}

    function run() public {
        vm.startBroadcast();
        c = new Counter(address(this));
        vm.stopBroadcast();
    }
}
