// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {CampaignFactory} from "../src/core/CampaignFactory.sol";

/// @title CreateCampaignScript
/// @notice Script de foundry para criar uma nova campanha utilizando a CampaignFactory existente.
///
/// Uso:
///   # Certifique-se de configurar a variável FACTORY_ADDRESS no seu .env ou passar diretamente.
///   # Sepolia testnet
///   forge script script/CreateCampaign.s.sol \
///     --rpc-url $SEPOLIA_RPC_URL --broadcast
contract CreateCampaignScript is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);

        // Endereço da Factory deployada (substitua pelo endereço correto)
        // Você pode configurar no .env como FACTORY_ADDRESS ou colocar hardcoded aqui
        address factoryAddress = vm.envOr("FACTORY_ADDRESS", address(0)); 
        
        if (factoryAddress == address(0)) {
            console2.log("Erro: FACTORY_ADDRESS nao definido. Defina no .env ou passe como parametro.");
            return;
        }

        // Parâmetros da Campanha
        uint256 softCap = 1000 * 10 ** 8; // $1,000 USD (considerando feed Chainlink com 8 decimais)
        uint256 hardCap = 10000 * 10 ** 8; // $10,000 USD
        uint64 startTime = uint64(block.timestamp + 1 hours); // Inicia em 1 hora
        uint64 endTime = uint64(block.timestamp + 30 days); // Termina em 30 dias
        string memory baseURI = "https://www.bearish.af/api/metadata/bearish/2699"; // Base URI para NFTs
        address priceFeed = address(0x694AA1769357215DE4FAC081bf1f309aDC325306); // Usa o price feed padrão configurado na Factory

        vm.startBroadcast(pk);

        CampaignFactory factory = CampaignFactory(factoryAddress);

        // Cria a campanha
        (address campaignAddress, address tierManagerAddress) = factory.createCampaign(
            softCap,
            hardCap,
            startTime,
            endTime,
            baseURI,
            priceFeed
        );

        vm.stopBroadcast();

        // Logs
        console2.log("====== CAMPANHA CRIADA ======");
        console2.log("CampaignFactory usada: ", factoryAddress);
        console2.log("Criador:               ", deployer);
        console2.log("Endereco da Campanha:  ", campaignAddress);
        console2.log("Endereco do TierManager:", tierManagerAddress);
        console2.log("=============================");
    }
}
