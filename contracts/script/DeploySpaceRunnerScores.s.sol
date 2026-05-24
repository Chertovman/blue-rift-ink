// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {SpaceRunnerScores} from "../src/SpaceRunnerScores.sol";

interface Vm {
    function envUint(string calldata name) external view returns (uint256);
    function startBroadcast(uint256 privateKey) external;
    function stopBroadcast() external;
}

contract DeploySpaceRunnerScores {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function run() external returns (SpaceRunnerScores deployed) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);
        deployed = new SpaceRunnerScores();
        vm.stopBroadcast();
    }
}
