// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {CampaignFactory} from "../src/core/CampaignFactory.sol";

contract RedeployFactoryScript is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        
        address oldFactoryAddress = vm.envOr("FACTORY_ADDRESS", address(0));
        require(oldFactoryAddress != address(0), "FACTORY_ADDRESS missing");

        CampaignFactory oldFactory = CampaignFactory(oldFactoryAddress);
        
        address agt = oldFactory.agtToken();
        address dao = oldFactory.daoContract();
        address payable treasury = oldFactory.treasuryDAO();
        address feed = oldFactory.defaultPriceFeed();

        vm.startBroadcast(pk);
        CampaignFactory newFactory = new CampaignFactory(agt, dao, treasury, feed);
        vm.stopBroadcast();

        console2.log("=== NEW FACTORY DEPLOYED ===");
        console2.log("New Factory Address:", address(newFactory));
        console2.log("Please update FACTORY_ADDRESS in your .env file!");
    }
}
