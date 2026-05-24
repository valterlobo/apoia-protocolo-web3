# Apoia Protocol — Diagrama de Dependências

```mermaid
graph TD
    subgraph "Infraestrutura Off-Chain"
        CL["Chainlink Price Feeds\n(ETH/USD · USDC/USD)"]
        GRAPH["TheGraph\n(indexação de eventos)"]
        IPFS["IPFS\n(metadados NFTs)"]
    end

    subgraph "Core Contracts"
        FACTORY["CampaignFactory\n(deploy + índice global)"]
        CAMPAIGN["Campaign\n(escrow + lifecycle)"]
        TIER["TierManager\n(ERC-1155 NFTs)"]
        AGT["AGTToken\n(ERC-20 + ERC20Votes + Vesting)"]
        DAO["ApoiaDAO\n(governança + auditoria)"]
        STAKING["StakingAGT\n(lock + multiplicadores)"]
    end

    subgraph "Utilities"
        TREASURY["TreasuryDAO\n(cofre + multisig)"]
        CHAINLINK_HELPER["ChainlinkHelper\n(library)"]
        VESTING_LIB["VestingLib\n(library)"]
        DAO_MATH["DAOMath\n(library)"]
    end

    %% Factory cria Campaign+TierManager
    FACTORY -->|"createCampaign() → deploy"| CAMPAIGN
    FACTORY -->|"createCampaign() → deploy"| TIER

    %% Campaign usa seus vizinhos
    CAMPAIGN -->|"mintTier() / burnTier()"| TIER
    CAMPAIGN -->|"createVestingSchedule()"| AGT
    CAMPAIGN -->|"approveByDAO() / rejectByDAO()"| DAO
    CAMPAIGN -->|"taxa 5 % → ETH"| TREASURY
    CAMPAIGN -->|"ethToUsd()"| CHAINLINK_HELPER

    %% AGT usa libraries
    AGT -->|"computeReleasable()"| VESTING_LIB

    %% DAO usa Staking
    DAO -->|"getVotingPower()"| STAKING
    DAO -->|"executeProposal()"| CAMPAIGN

    %% Staking usa DAOMath
    STAKING -->|"votingPower()"| DAO_MATH
    STAKING -->|"applyFee()"| DAO_MATH

    %% Treasury controlado pela DAO
    DAO -->|"dispatch()"| TREASURY

    %% Price Feeds externos
    CHAINLINK_HELPER -->|"latestRoundData()"| CL
    TIER -->|"latestRoundData()"| CL

    %% Events para indexação
    CAMPAIGN -.->|"Contributed, StatusChanged"| GRAPH
    TIER -.->|"TierMinted, TierBurned"| GRAPH
    AGT -.->|"VestingScheduleCreated, TokensReleased"| GRAPH
    DAO -.->|"ProposalCreated, VoteCast"| GRAPH

    %% Metadados NFTs
    TIER -.->|"uri()"| IPFS
```

## Fluxo de Status da Campanha

```mermaid
stateDiagram-v2
    [*] --> ACTIVE : deploy()

    ACTIVE --> ACTIVE : contribute() [dentro do prazo]
    ACTIVE --> SUCCEEDED : requestWithdrawal() [soft cap atingido + prazo encerrado]
    ACTIVE --> FAILED : requestWithdrawal() [soft cap NÃO atingido]
    ACTIVE --> REJECTED : forceRejectByDAO() [fraude detectada]

    SUCCEEDED --> APPROVED : ApoiaDAO.executeProposal() [approveByDAO]
    SUCCEEDED --> REJECTED : ApoiaDAO.executeProposal() [rejectByDAO]

    APPROVED --> WITHDRAWN : executeWithdrawal()

    FAILED --> [*] : claimRefund() [por cada apoiador]
    REJECTED --> [*] : claimRefund() [por cada apoiador]

    FAILED --> EXPIRED : liquidateExpired() [após 60 dias]
    REJECTED --> EXPIRED : liquidateExpired() [após 60 dias]
    EXPIRED --> [*] : 60% proponente + 40% treasury
```

## Ciclo de Vida de um $AGT (Cashback)

```mermaid
sequenceDiagram
    participant A as Apoiador
    participant C as Campaign
    participant AGT as AGTToken
    participant S as StakingAGT
    participant D as ApoiaDAO

    A->>C: contribute(tierId) + ETH
    C->>AGT: createVestingSchedule(apoiador, amount)
    Note over AGT: Cliff 30d → Linear 90d
    
    A->>AGT: releaseVestedTokens(scheduleId) [após cliff]
    AGT-->>A: tokens liberados proporcionalmente

    A->>S: stake(amount, 12 meses)
    Note over S: Lock 12m → multiplicador 3×

    A->>D: castVote(proposalId, true)
    Note over D: Peso = tokens × 3×

    D->>AGT: grantDAOBonus(apoiador, scheduleId)
    AGT-->>A: +10% de bônus
```

## Dependências de Bibliotecas

| Contrato       | VestingLib | DAOMath | ChainlinkHelper |
|----------------|:----------:|:-------:|:---------------:|
| AGTToken       | ✓          |         |                 |
| Campaign       |            | ✓       | ✓               |
| StakingAGT     |            | ✓       |                 |
| ApoiaDAO       |            | ✓       |                 |
| TierManager    |            |         | ✓               |

## Dependências de Contratos OpenZeppelin

| Contrato        | ERC20 | ERC20Votes | ERC1155 | Ownable | ReentrancyGuard | Pausable |
|-----------------|:-----:|:----------:|:-------:|:-------:|:---------------:|:--------:|
| AGTToken        | ✓     | ✓          |         | ✓       | ✓               |          |
| TierManager     |       |            | ✓       | ✓       |                 |          |
| Campaign        |       |            |         |         | ✓               | ✓        |
| CampaignFactory |       |            |         | ✓       | ✓               |          |
| StakingAGT      |       |            |         | ✓       | ✓               | ✓        |
| ApoiaDAO        |       |            |         | ✓       | ✓               |          |
| TreasuryDAO     |       |            |         | ✓       | ✓               |          |
