# Apoia Protocol — Smart Contracts

Infraestrutura descentralizada para crowdfunding com governança DAO, NFTs ERC-1155 e tokenomics completa.

## Estrutura do Projeto

```
src/
├── core/
│   ├── AGTToken.sol          ERC-20 com vesting linear (cliff 30d + 90d)
│   ├── ApoiaDAO.sol          Governança com quórum duplo e timelock 2d
│   ├── Campaign.sol          Escrow trustless + lifecycle da campanha
│   ├── CampaignFactory.sol   Fábrica de Campaign + TierManager
│   ├── StakingAGT.sol        Staking com lock (3/6/12m) e multiplicadores
│   └── TierManager.sol       NFTs ERC-1155 de recibo por tier
├── interfaces/               Interfaces públicas dos contratos core
├── libraries/
│   ├── DAOMath.sol           Quórum, taxas, poder de voto
│   └── VestingLib.sol        Cálculo de vesting linear
├── utils/
│   ├── ChainlinkHelper.sol   Wrapper seguro para Price Feeds
│   └── TreasuryDAO.sol       Cofre da DAO + multisig emergência
└── mocks/
    └── MockChainlinkFeed.sol Mock do Chainlink para testes

test/
├── core/
│   ├── Campaign.t.sol        Testes unitários da Campaign
│   └── AGTToken.t.sol        Testes unitários do AGTToken
├── integration/
│   └── FullFlow.t.sol        Fluxo end-to-end completo
└── fuzz/
    └── CampaignFuzz.t.sol    Fuzzing de invariantes críticos

script/
├── DeployApoiaProtocol.s.sol Deploy completo do protocolo
└── CreateExampleCampaign.s.sol Cria campanha de exemplo
```

## Setup

```bash
# 1. Inicializar projeto Foundry
forge init apoia-protocol
cd apoia-protocol

# 2. Instalar dependências
forge install OpenZeppelin/openzeppelin-contracts

forge install smartcontractkit/chainlink-brownie-contracts
forge install foundry-rs/forge-std

# 3. Copiar os arquivos src/, test/, script/ deste repositório

# 4. Compilar
forge build

# 5. Testar
forge test -vvv

# 6. Cobertura
forge coverage

# 7. Gas snapshot
forge snapshot
```

## Deploy

```bash
# Copiar e preencher o arquivo de ambiente
cp .env.example .env
# Editar PRIVATE_KEY, ETH_RPC_URL, ETHERSCAN_API_KEY, etc.

# Deploy local (anvil)
anvil &
forge script script/DeployApoiaProtocol.s.sol \
  --fork-url http://localhost:8545 \
  --broadcast

# Deploy em Sepolia testnet
forge script script/DeployApoiaProtocol.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY

# Deploy em Polygon
forge script script/DeployApoiaProtocol.s.sol \
  --rpc-url $POLYGON_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $POLYGONSCAN_API_KEY
```

## Variáveis de Ambiente

```bash
PRIVATE_KEY=0x...
ETH_RPC_URL=https://mainnet.infura.io/v3/...
POLYGON_RPC_URL=https://polygon-mainnet.infura.io/v3/...
BASE_RPC_URL=https://mainnet.base.org
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/...
ETHERSCAN_API_KEY=...
POLYGONSCAN_API_KEY=...
BASESCAN_API_KEY=...
```

## Testes
```bash
# Executar testes unitários
forge test

# Testes com output verboso
forge test -vvv

# Testar com cobertura
forge coverage

# Comparar gas atual vs benchmark
forge test --gas-snapshot

# Fuzz testing (10k execuções por test)
forge test --fuzz-runs 10000

# Testar apenas um arquivo
forge test test/core/Campaign.t.sol

# Testar apenas uma função específica
forge test test/core/Campaign.t.sol:CampaignTest:testDepositSuccess
```

# Slither

## Instalar slither
sudo apt update

sudo apt install -y slither-analyzer

## Detectar vulnerabilidades
```
slither . --exclude-dependencies

slither . --exclude-informational --filter-paths "lib/" --solc-args "--base-path . --include-path lib"

slither . --detect all

slither . --detect variable-scope

slither . --detect reentrancy-eth

slither .  --exclude-dependencies --exclude-informational

```

## Decisões de Arquitetura

### Imutabilidade (Non-Upgradeable)
Todos os contratos são deployados diretamente, sem proxies UUPS/Transparent/Beacon.
- **Vantagem**: attack surface zero de proxy, auditoria mais simples
- **Custo**: upgrades requerem deploy de nova versão + migração gradual de liquidez
- **Parâmetros ajustáveis**: taxa de plataforma e whitelist são controláveis pela DAO via setters

### CampaignFactory + Campaign Separados
Cada campanha é um contrato independente com seus próprios fundos em custódia.
- Isolamento de risco: falha em uma campanha não afeta outras
- Deploy por Factory garante parâmetros validados

### ERC-1155 vs ERC-721
ERC-1155 escolhido por eficiência de gas em cenários com muitos contribuidores no mesmo tier.
Um tokenId por tier; amount = 1 por apoiador (recibo único não transferível implicitamente).

### Quórum Duplo
Token threshold (4 % do supply) + contagem de wallets únicas (50 mínimo) previne captura por baleias.

### Multiplicadores de Voto por Staking
Incentiva comprometimento de longo prazo com 1.5×/2×/3× para 3/6/12 meses de lock.

## Auditoria

Antes do deploy em mainnet, recomenda-se:
1. Sherlock ou Code4rena para auditoria profissional
2. `forge coverage` deve atingir >90 % em linhas e branches
3. `forge fuzz` com 10.000+ runs para invariantes críticos
4. Verificação em Etherscan via `forge verify-contract`




# OBS 

### TEste apenas do contrato principal Campaign.sol 

```bash
forge test test/core/Campaign.t.sol
```

### Ajustes no contrato slhiter 

- StakingAGT.unstake(uint256) (src/core/StakingAGT.sol#78-91) uses arbitrary from in transferFrom: agtToken.safeTransferFrom(rewardsPool,msg.sender,reward) (src/core/StakingAGT.sol#88)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#arbitrary-from-in-transferfrom


- CampaignFactory.getCampaignsByStatus(uint256).n (src/core/CampaignFactory.sol#141) is a local variable never initialized
CampaignFactory.getCampaignsByStatus(uint256).idx (src/core/CampaignFactory.sol#153) is a local variable never initialized
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#uninitialized-local-variables


- Campaign.contribute(uint256) (src/core/Campaign.sol#136-159) ignores return value by IAGTToken(agtTokenAddr).createVestingSchedule(msg.sender,agtAmt,false) (src/core/Campaign.sol#155)
ChainlinkHelper.getLatestPrice(AggregatorV3Interface) (src/utils/ChainlinkHelper.sol#12-19) ignores return value by (roundId,answer,None,updatedAt,answeredInRound) = feed.latestRoundData() (src/utils/ChainlinkHelper.sol#13)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#unused-return