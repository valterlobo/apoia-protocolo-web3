# 4. Arquitetura Técnica

## 4.1 Diagrama Funcional

O protocolo Apoia segue uma arquitetura modular em camadas, onde cada contrato inteligente desempenha um papel específico no ciclo de vida de uma campanha de crowdfunding descentralizado. O fluxo principal é:

```
┌─────────────────────────────────────────────────────────────────┐
│                          Usuário (Apoiador)                     │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  │ 1. Enviar ETH + Tier ID
                  ▼
        ┌─────────────────────┐
        │   Campaign (Escrow) │  ◄─── Contrato criado por CampaignFactory
        └──────────┬──────────┘
                   │
     ┌─────────────┼─────────────┐
     │             │             │
     ▼             ▼             ▼
┌─────────┐ ┌──────────────┐ ┌──────────────────┐
│ Chainlin│ │ TierManager  │ │ AGTToken         │
│ ETH/USD │ │ (ERC-1155)   │ │ (ERC-20 + Votes) │
│ Feed    │ │              │ │                  │
└─────────┘ │ Mint NFT     │ │ Cria Vesting     │
            │ de Recibo    │ │ Schedule         │
            └──────────────┘ └──────────────────┘
                   │                │
                   │                │
                   └────────────────┘
                        │
                        ▼
        ┌──────────────────────────┐
        │   ApoiaDAO (Governança)  │
        │  Aprova/Rejeita Campaign │
        └──────────┬───────────────┘
                   │
        ┌──────────▼──────────────┐
        │ StakingAGT (Lock + APY) │  ◄─── Multiplicadores de Voto
        └────────────────────────_┘
```

**Fluxo Detalhado:**

1. **Contribuição**: Apoiador envia ETH para uma campanha ativa via `Campaign.contribute(tierId)`
2. **Validação de Preço**: `ChainlinkHelper` converte ETH → USD em tempo real via oráculo Chainlink
3. **Emissão Síncrona de NFT**: Ao receber fundos, `TierManager` minta imediatamente um NFT ERC-1155 de recibo
4. **Criação de Vesting**: `AGTToken` cria um schedule de vesting (cashback) com cliff de 30 dias + 90 dias de distribuição
5. **Auditoria DAO**: Após o prazo, `ApoiaDAO` aprova ou rejeita a campanha (baseada em votação com poder derivado do `StakingAGT`)
6. **Execução**: Se aprovada, proponente saca; se rejeitada, apoiadores recebem refund

---

## 4.2 Dicionário de Dados e Funções Principais

### Tabela: Contratos Core e Funções Essenciais

| Contrato | Função | Visibilidade | Tipo | Descrição |
|----------|--------|--------------|------|-----------|
| **Campaign.sol** | `contribute(uint256 tierId)` | External | Payable | Recebe ETH, valida hard cap (via Chainlink), registra contribuição, minta NFT ERC-1155 e cria vesting AGT |
| | `requestWithdrawal()` | External | Non-Payable | Proponente solicita saque após prazo (ativa votação DAO). Requer soft cap atingido |
| | `executeWithdrawal()` | External | Non-Payable | Executa saque (apenas se aprovada). Deduz taxa 5% → Treasury |
| | `claimRefund()` | External | Non-Payable | Apoiador resgata ETH + queima NFT (apenas se campanha falhou/rejeitada) |
| | `approveByDAO()` / `rejectByDAO()` | External | Only DAO | Executa decisão da governança. Muda estado de SUCCEEDED → APPROVED/REJECTED |
| **TierManager.sol** | `createTier(string name, uint256 minAmountUSD, ...)` | External | Non-Payable | Define um tier de recompensa (ex: R$50 = Silver, R$500 = Gold). Requer Campaign caller |
| | `mintTier(address to, uint256 tierId, uint256 aportadoUSD)` | External | Only Campaign | Minta NFT ERC-1155 de recibo. Uma por apoiador por tier |
| | `burnTier(address from, uint256 tierId)` | External | Only Campaign | Queima NFT (no refund). Reduz contador de minted |
| | `getTierMetadata(uint256 tierId)` | External | View | Retorna estrutura Tier (nome, minAmount, maxSupply, metadataURI) |
| **AGTToken.sol** | `createVestingSchedule(address ben, uint256 amt, bool revocable)` | External | Only Minter | Cria schedule com cliff 30d + vesting 90d. Requer 10% bonus cashback |
| | `releaseVestedTokens(uint256 scheduleId)` | External | Non-Payable | Desbloqueia AGT de acordo com vesting. Pode chamar múltiplas vezes |
| | `revokeVestingSchedule(uint256 scheduleId)` | External | Only DAO | Revoga vesting (se isRevocable=true). Retorna saldo à Campaign |
| **StakingAGT.sol** | `stake(uint256 amount, uint256 lockDuration)` | External | Non-Payable | Bloqueia AGT por 3m/6m/12m. Retorna positionId. Multiplicadores: 1.5x / 2x / 3x votação |
| | `unstake(uint256 positionId)` | External | Non-Payable | Resgata AGT + rewards (5% APY). Requer lock expirado |
| | `getVotingPower(address user)` | External | View | Calcula poder de voto = stake × multiplicador da duração. Input para ApoiaDAO |
| **ApoiaDAO.sol** | `createProposal(...)` | External | Only Staker | Cria proposta de votação (ex: aprovar Campaign). Requer votação mínima |
| | `castVote(uint256 propId, uint8 support)` | External | Non-Payable | Vota a favor (1) / contra (0) / abstem (2). Poder = votingPower via StakingAGT |
| | `executeProposal(uint256 propId)` | External | Only Executor | Executa decisão (chama `Campaign.approveByDAO()` ou `rejectByDAO()`) |
| **CampaignFactory.sol** | `createCampaign(...)` | External | Non-Payable | Deploy de novo Campaign + TierManager. Registra em índice global |
| **ChainlinkHelper.sol** | `ethToUsd(uint256 ethAmount, AggregatorV3Interface feed)` | Internal | View | Converte wei → USD com 8 decimais (padrão Chainlink). Valida staleness ≤ 1h |
| | `getLatestPrice(AggregatorV3Interface feed)` | Internal | View | Obtém preço com validações: resposta > 0, round completo, não stale |

### Estrutura de Dados Críticas

```solidity
// Campaign.sol
mapping(address => uint256) public contributions;  // ETH por apoiador
mapping(address => uint256) public apoiadorTier;   // Tier escolhido

// AGTToken.sol (Vesting)
struct VestingSchedule {
    uint256 totalAmount;        // Total de AGT a receber
    uint256 releasedAmount;     // Já desbloqueado
    uint64 startTime;           // Início do cliff
    uint32 cliffDuration;       // 30 dias
    uint32 vestingDuration;     // 90 dias (após cliff)
    bool isRevocable;           // Pode ser revogado pela DAO
    bool revoked;               // Foi revogado?
}

// StakingAGT.sol
struct StakePosition {
    uint256 amount;             // Quantidade de AGT bloqueada
    uint64 lockStart;           // Timestamp do depósito
    uint64 lockEnd;             // Timestamp de desbloqueio
    uint64 lockDuration;        // 3m / 6m / 12m
    bool withdrawn;             // Já foi resgatado?
}
```

---

## 4.3 Integração de Oráculos (Chainlink)

### Arquitetura do Oracle

O protocolo Apoia utiliza **Chainlink Price Feeds** para garantir que:
- Metas de campanhas (soft/hard cap) sejam expressas em **USD** (moeda fiduciária, estável)
- Conversão de ETH → USD aconteça **on-chain**, sincronamente, sem intermediários
- O sistema seja **imune à volatilidade** do mercado de criptomoedas

### Fluxo de Integração

```
┌─────────────────────────────────────────────────────────┐
│          Chainlink ETH/USD Price Feed                   │
│  (Atualizado ~1x por hora; redundância multi-node)      │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ latestRoundData()
                       ▼
        ┌──────────────────────────-┐
        │  ChainlinkHelper.sol      │
        │  ┌────────────────────┐   │
        │  │ getLatestPrice()   │   │
        │  └────────┬───────────┘   │
        │           │               │
        │  Validações:              │
        │  • answer > 0             │
        │  • round completo         │
        │  • price stale ≤ 1h       │
        │  • roundId consistente    │
        │           │               │
        │  ┌────────▼───────────┐   │
        │  │ ethToUsd()         │   │
        │  │ (wei → USD 1e8)    │   │
        │  └────────┬───────────┘   │
        └───────────┼───────────────┘
                    │
     ┌──────────────┴──────────────┐
     │                             │
     ▼                             ▼
┌──────────────────┐      ┌──────────────────┐
│ Campaign.sol     │      │ TierManager.sol  │
│                  │      │                  │
│ contribute():    │      │ mintTier():      │
│ • Valida hard cap│      │ • Valida min     │
│ • ETH → USD      │      │   amount USD     │
│ • Registra USD   │      │                  │
└──────────────────┘      └──────────────────┘
```

### Implementação Técnica

**Validações de Segurança:**

1. **Price Staleness**: Rejeita preços com mais de 1 hora de idade
   ```solidity
   require(block.timestamp - updatedAt <= MAX_STALENESS, "Chainlink: preco stale");
   ```

2. **Round Completeness**: Garante que o round foi finalizado
   ```solidity
   require(answeredInRound >= roundId, "Chainlink: round obsoleto");
   ```

3. **Positive Price**: Rejeita respostas inválidas (≤ 0)
   ```solidity
   require(answer > 0, "Chainlink: preco invalido");
   ```

4. **Conversão Precisa**: Usa aritmética em Solidity com 18 decimais (wei)
   ```solidity
   ethToUsd(uint256 ethAmount) = (ethAmount * price) / 1e18
   // Exemplo: 1 ETH = 1e18 wei, price = 2500e8 USD
   // Resultado: 2500e8 USD com 8 decimais
   ```

### Pares de Preço Utilizados

| Par | Contrato | Propósito | Rede |
|-----|----------|-----------|------|
| **ETH/USD** | Campaign, TierManager | Conversão de fundos em ETH para metas em USD | Mainnet, Sepolia |
| **USDC/USD** | (Futuro) | Suportar campanhas em USDC | Mainnet, Sepolia |

### Fallback e Mitigação de Risco

- **Sem fallback oracle**: O sistema reverte se o Chainlink estiver indisponível (fail-safe)
- **Pausable**: `Campaign` e `StakingAGT` implementam `Pausable` para pausar fluxos em caso de emergência
- **Imutável**: Sem proxy upgradeável; oracle address é imutável (não pode ser trocado)

---

## 4.4 Justificativa da Escolha dos Padrões ERC

### 4.4.1 ERC-20 (AGTToken)

**Padrão Aplicado:** OpenZeppelin `ERC20` + `ERC20Votes` + `EIP712`

**Razão da Escolha:**

1. **Fungibilidade Completa**: AGT é um token de governança fungível (permutável). Todos os holders possuem direitos iguais sobre a governança.

2. **Compatibilidade com DeFi**: ERC-20 é o padrão mais amplamente suportado em exchanges descentralizadas, lending protocols e ferramentas de tracking.

3. **ERC20Votes (Governança)**: Permite que o token inclua poder de voto sem contrato separado. Cada holder pode delegar seu poder de voto (inclusive para si mesmo) e participar de propostas da ApoiaDAO.

4. **EIP712 (Signatures)**: Suporta permissões via assinatura (approve sem gás) — essencial para UX em aplicações móveis e multi-chain.

5. **Vesting Integrado**: O próprio contrato AGTToken gerencia schedules de vesting, simplificando a distribuição de cashback aos apoiadores.

**Estrutura:**
```solidity
contract AGTToken is ERC20, ERC20Votes, Ownable, ReentrancyGuard {
    - TOTAL_SUPPLY: 100M AGT
    - Distribuição: 40% Rewards | 25% Treasury | 20% Team | 10% Staking | 5% Community
    - Vesting: Cliff 30d + Vesting 90d
}
```

---

### 4.4.2 ERC-1155 (TierManager - NFT de Recibo)

**Padrão Aplicado:** OpenZeppelin `ERC1155`

**Razão da Escolha:**

1. **Eficiência Multi-Token**: ERC-1155 permite que um único contrato gerencie múltiplos tiers de recompensa (ex: Silver, Gold, Platinum). Isso economiza gas em relação a ERC-721 por tier.

2. **Suporta Quantidade (Semi-Fungível)**: Cada apoiador recebe 1 NFT por tier (non-fungible), mas o contrato pode, no futuro, emitir múltiplos tokens do mesmo tier para referências ou proof-of-contribution.

3. **Metadados Descentralizados**: Integração com IPFS para `metadataURI`. Cada tier aponta para um JSON descrevendo benefícios (ex: desconto em futuras campanhas).

4. **Burn Síncrono**: Quando um apoiador pede refund, o NFT é queimado simultaneamente, garantindo que o recibo deixe de ter valor (sinergia com reembolso).

5. **Eventos Auditáveis**: `TierMinted` e `TierBurned` emitem eventos para indexação via The Graph, permitindo rastreamento completo do histórico.

**Estrutura:**
```solidity
contract TierManager is ERC1155, Ownable {
    struct Tier {
        uint256 id;
        string name;              // "Silver", "Gold"
        uint256 minAmountUSD;     // Valor mínimo para qualificar
        uint256 maxSupply;        // 0 = ilimitado
        uint256 minted;           // Contador
        PriceMode priceMode;      // STATIC, DYNAMIC, LOYALTY
        string metadataURI;       // IPFS link
    }
    
    // Somente Campaign pode mintar/queimar
    modifier onlyCampaign()
}
```

**Fluxo Vesting vs. NFT:**

| Aspecto | ERC-20 (AGT Vesting) | ERC-1155 (NFT Recibo) |
|--------|----------------------|----------------------|
| **Propósito** | Cashback de governança | Comprovante de contribuição |
| **Quantidade** | N tokens (fungível) | 1 NFT por tier (não-fungível) |
| **Transferência** | Pode transferir AGT | NFT pode ser mantido (sem venda, por enquanto) |
| **Desbloqueio** | Cliff + Vesting linear | Imediato (mas AGT só após cliff) |
| **Utilidade** | Votação + Staking | Proof-of-contribution + Descontos futuros |

---

### 4.4.3 Padrões de Segurança Complementares

#### **ReentrancyGuard**

Aplicado em: `Campaign`, `AGTToken`, `StakingAGT`

**Razão**: Todas as funções que transferem ETH ou tokens utilizam o padrão **checks-effects-interactions** (CEI) com `nonReentrant` para prevenir ataques de reentrada.

#### **Pausable**

Aplicado em: `Campaign`, `StakingAGT`

**Razão**: Caso de emergência (bug de oracle, fraude detectada), o contrato pode ser pausado para bloquear novas transações sem quebrar o sistema.

#### **Ownable**

Aplicado em: Todos os contratos core

**Razão**: Permite que o time Apoia execute funções administrativas (atualizar oracle, pausar, etc.) durante a fase inicial. Planejamento futuro: transferir ownership para DAO governança.

---

### 4.4.4 Ausência de Padrões Alternativos e Justificativa

| Padrão | Por que NÃO usar | |
|--------|-----------------|--|
| **ERC-721** (NFT único) | Cada apoiador pode ter múltiplos tiers numa única campanha. ERC-721 exige token separado por item. ERC-1155 é mais eficiente. | ✓ |
| **ERC-1363** (Approved + Call) | Não é necessário; Campaign realiza approve manualmente em AGTToken. | ✓ |
| **Proxy UUPS** | Codebase é imutável por design. Não há necessidade de upgradeability; reduz surface de ataque. | ✓ |
| **Snapshot voting** | AGTToken usa ERC20Votes com block-based snapshots (integrado via OpenZeppelin). Suficiente para governança. | ✓ |

---

## 4.5 Resumo da Arquitetura

```
┌────────────────────────────────────────────────────────────┐
│                    APOIA PROTOCOL STACK                    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  GOVERNANCE LAYER                                          │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │   ApoiaDAO       │  │   StakingAGT     │                │
│  │  (Votação)       │  │ (Lock + 1.5x-3x) │                │
│  └──────────────────┘  └──────────────────┘                │
│                 △                                          │
│                 │ voting_power(user)                       │
│                 │                                          │
│  CORE LAYER                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Campaign    │  │ TierManager  │  │  AGTToken    │      │
│  │  (Escrow)    │  │ (ERC-1155)   │  │(ERC20+Votes) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         △                △                   △             │
│         │ ethToUsd()     │ mintTier()        │             │
│         │                │                   │             │
│  UTILITY LAYER                               │             │
│  ┌──────────────────┐          ┌─────────────▼──────┐      │
│  │ ChainlinkHelper  │          │  VestingLib        │      │
│  │ (Oracle Reader)  │          │  (Computation)     │      │
│  └──────────────────┘          └────────────────────┘      │
│                                                            │
│  EXTERNAL DEPENDENCIES                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Chainlink ETH/USD | IPFS (Metadata) | TheGraph     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Características Principais:**

✅ **Imutável**: Sem proxy upgradeável  
✅ **Non-custodial**: Escrow trustless (Campaign)  
✅ **Auditável**: Eventos em cada operação crítica  
✅ **Resiliente**: Múltiplas validações, ReentrancyGuard, Pausable  
✅ **On-Chain Governance**: DAO decide aprovação/rejeição  
✅ **Oracle-Driven**: Preços reais via Chainlink, não mockados  

---

## Referências

- **ARCHITECTURE.md**: Diagrama de dependências e fluxo de status
- **Contratos**: `apoia-protocol/src/core/`, `apoia-protocol/src/utils/`, `apoia-protocol/src/libraries/`
- **Interfaces**: `apoia-protocol/src/interfaces/`
- **OpenZeppelin**: ERC20, ERC1155, ReentrancyGuard, Ownable
- **Chainlink**: Price Feeds Mainnet, Sepolia
