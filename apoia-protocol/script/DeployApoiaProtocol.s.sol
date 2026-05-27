// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {AGTToken} from "../src/core/AGTToken.sol";
import {StakingAGT} from "../src/core/StakingAGT.sol";
import {ApoiaDAO} from "../src/core/ApoiaDAO.sol";
import {CampaignFactory} from "../src/core/CampaignFactory.sol";
import {TreasuryDAO} from "../src/utils/TreasuryDAO.sol";

/// @title DeployApoiaProtocol
/// @notice Script de deploy completo do Apoia Protocol via Foundry.
///
/// Uso:
///   # Local (anvil)
///   anvil &
///   forge script script/DeployApoiaProtocol.s.sol --fork-url http://localhost:8545 --broadcast
///
///   # Sepolia testnet
///   forge script script/DeployApoiaProtocol.s.sol \
///     --rpc-url $SEPOLIA_RPC_URL --broadcast --verify \
///     --etherscan-api-key $ETHERSCAN_API_KEY
///
///   # Polygon mainnet
///   forge script script/DeployApoiaProtocol.s.sol \
///     --rpc-url $POLYGON_RPC_URL --broadcast --verify \
///     --etherscan-api-key $POLYGONSCAN_API_KEY
contract DeployApoiaProtocol is Script {
    // ── Chainlink ETH/USD feeds ──────────────────────────────────────────────
    // Substituir pelo feed correto da rede alvo:
    //   Mainnet:  0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419
    //   Sepolia:  0x694AA1769357215DE4FAC081bf1f309aDC325306
    //   Polygon:  0xF9680D99D6C9589e2a93a78A04A279e509205945
    //   Base:     0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70
    address constant PRICE_FEED = 0x694AA1769357215DE4FAC081bf1f309aDC325306;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        address deployer = vm.addr(pk);

        // Endereços de carteiras — substituir antes do deploy em produção
        address teamWallet = vm.envOr("TEAM_WALLET", deployer);
        address communityWal = vm.envOr("COMMUNITY_WALLET", deployer);

        // Membros do multisig para emergências nos primeiros 6 meses
        address[5] memory multisig = [deployer, deployer, deployer, deployer, deployer];

        vm.startBroadcast(pk);

        // 1 ── TreasuryDAO (precisa existir antes do AGT para receber 25 %)
        //       Passa address(0) como DAO: será atualizado após deploy da ApoiaDAO
        TreasuryDAO treasury = new TreasuryDAO(multisig, address(0));

        // 2 ── AGTToken (supply fixo de 100 M, imutável)
        //       deployer age como rewardsPool e stakingPool temporariamente
        AGTToken agt = new AGTToken(
            deployer, // rewardsPool  (40 %)
            address(treasury), // DAO treasury  (25 %)
            teamWallet, // equipe        (20 %)
            deployer, // stakingPool   (10 %)
            communityWal // comunidade    ( 5 %)
        );

        // 3 ── StakingAGT
        StakingAGT staking = new StakingAGT(
            address(agt),
            deployer /* rewardsPool */
        );

        // 4 ── ApoiaDAO
        ApoiaDAO dao = new ApoiaDAO(address(agt), address(staking));

        // 5 ── CampaignFactory
        CampaignFactory factory =
            new CampaignFactory(address(agt), address(dao), payable(address(treasury)), PRICE_FEED);

        // 6 ── Configurações pós-deploy
        agt.setDAOContract(address(dao));
        // factory.transferOwnership(address(dao)); // descomente após DAO ativa

        vm.stopBroadcast();

        // 7 ── Log dos endereços deployados
        console2.log("====== APOIA PROTOCOL DEPLOY ======");
        console2.log("Chain ID:      ", block.chainid);
        console2.log("Deployer:      ", deployer);
        console2.log("-----------------------------------");
        console2.log("AGTToken:      ", address(agt));
        console2.log("StakingAGT:    ", address(staking));
        console2.log("ApoiaDAO:      ", address(dao));
        console2.log("TreasuryDAO:   ", address(treasury));
        console2.log("CampaignFactory:", address(factory));
        console2.log("PriceFeed ETH/USD:", PRICE_FEED);
        console2.log("===================================");
    }
}
