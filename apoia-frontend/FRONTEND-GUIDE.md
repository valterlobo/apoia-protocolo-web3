## 🎨 APOIA Protocol Frontend - Guia de Implementação

O frontend foi desenvolvido como um **arquivo HTML monolítico** com integração completa com **ethers.js v6** para interação com os smart contracts.

---

## 📁 Estrutura de Arquivos

```
apoia-frontend/
├── apoia-protocol-frontend.html      # Frontend completo (8 telas)
├── web3-integration.js               # Integração ethers.js (classes reutilizáveis)
├── README.md                         # Este arquivo
└── contratos/
    ├── Campaign.abi.json             # ABI do contrato Campaign
    ├── CampaignFactory.abi.json      # ABI do CampaignFactory
    ├── AGTToken.abi.json             # ABI do token AGT
    ├── ApoiaDAO.abi.json             # ABI da DAO
    ├── StakingAGT.abi.json           # ABI do Staking
    └── TierManager.abi.json          # ABI do TierManager
```

---

## 🚀 Como Usar

### 1️⃣ Abrir o Frontend

**Opção A: Navegador Local**
```bash
# Linux
xdg-open apoia-protocol-frontend.html

# macOS
open apoia-protocol-frontend.html

# Windows
start apoia-protocol-frontend.html
```

**Opção B: Servidor Local (recomendado)**
```bash
# Com Python 3
python -m http.server 8000

# Com Node.js
npx http-server
```

Então acesse: `http://localhost:8000/apoia-protocol-frontend.html`

---

### 2️⃣ Estrutura das 8 Telas

| # | Tela | Funcionalidade | Status |
|---|------|----------------|--------|
| 01 | **Home** | Métricas globais, ticker ETH/USD, campanhas em destaque | ✅ Completo |
| 02 | **Explorar** | Busca/filtro de campanhas, listagem completa | ✅ Completo |
| 03 | **Detalhes** | Info detalhada da campanha, oráculo Chainlink, aporte | ✅ Completo |
| 04 | **Dashboard** | Gerenciamento de campanhas do proponente | ✅ Completo |
| 05 | **Portfólio** | NFTs ERC-1155, vesting timeline, staking | ✅ Completo |
| 06 | **Governança** | Propostas DAO, votação, quórum dual | ✅ Completo |
| 07 | **Tesouro** | Composição do fundo, fluxo caixa | ✅ Completo |
| 08 | **Criar** | Wizard 4 etapas para criar campanha | ✅ Completo |

---

## 📚 Guia de Integração Web3

### Setup Básico

```html
<!-- No HTML, inclua ethers.js -->
<script src="https://cdn.ethers.io/v6/ethers.umd.min.js"></script>

<!-- Depois inclua a integração -->
<script src="web3-integration.js"></script>
```

### Exemplo: Conectar Wallet

```javascript
const web3 = new Web3Manager();

document.getElementById('walletBtn').addEventListener('click', async () => {
    try {
        const address = await web3.connectWallet();
        console.log('Conectado em:', address);
        
        // Agora você pode usar os contratos
        const balance = await tokenManager.getBalance();
        console.log('Saldo AGT:', balance);
    } catch (error) {
        console.error('Erro:', error);
    }
});
```

---

## 🔗 Classes Disponíveis

### 1. **Web3Manager** - Gerencia conexão com wallet

```javascript
const web3 = new Web3Manager();

// Conectar wallet
await web3.connectWallet();

// Verificar status
if (web3.isConnected()) {
    console.log('Endereço:', web3.getAddress());
    console.log('Rede:', web3.network.name);
}

// Desconectar
web3.disconnectWallet();
```

---

### 2. **CampaignManager** - Gerencia campanhas

```javascript
const campaignManager = new CampaignManager(web3);

// Criar nova campanha
const receipt = await campaignManager.createCampaign(
    "Novo App Educacional",           // title
    "Descrição da campanha...",        // description
    10,                                // softCap (ETH)
    50,                                // hardCap (ETH)
    Date.now() + (90 * 24 * 60 * 60 * 1000) // deadline
);
console.log('Campanha criada:', receipt.hash);

// Contribuir para campanha
await campaignManager.contributeToCampaign(
    '0x1234...5678',  // endereço da campanha
    0.5               // valor em ETH
);

// Buscar detalhes da campanha
const details = await campaignManager.getCampaignDetails('0x1234...5678');
console.log(details);
// {
//   title: "Novo App Educacional",
//   creator: "0xabcd...efgh",
//   softCap: "10.0",
//   hardCap: "50.0",
//   raised: "22.5",
//   status: 1
// }

// Buscar campanhas do usuário
const campaigns = await campaignManager.getCampaignsByUser(userAddress);

// Executar saque (apenas criador)
await campaignManager.executeWithdrawal('0x1234...5678');
```

---

### 3. **TokenManager** - Gerencia token AGT

```javascript
const tokenManager = new TokenManager(web3);

// Verificar saldo
const balance = await tokenManager.getBalance();
console.log('Seu saldo:', balance, 'AGT');

// Transferir tokens
await tokenManager.transfer('0xabcd...efgh', 1000);

// Aprovar spend
await tokenManager.approve(
    stakingAGT.address,  // spender
    50000                // amount
);

// Criar vesting schedule (apenas minter)
await tokenManager.createVestingSchedule(
    '0xabcd...efgh',     // beneficiary
    100000,              // amount
    30 * 24 * 60 * 60,   // cliff (30 dias)
    365 * 24 * 60 * 60   // duration (1 ano)
);

// Liberar vesting do usuário
const released = await tokenManager.releaseVesting('0xabcd...efgh');
```

---

### 4. **StakingManager** - Gerencia staking AGT

```javascript
const stakingManager = new StakingManager(web3);

// Fazer stake
await stakingManager.stake(
    50000,               // amount AGT
    180 * 24 * 60 * 60   // duration (180 dias)
);

// Verificar stake
const stakedAmount = await stakingManager.getStakedAmount();
console.log('Staked:', stakedAmount, 'AGT');

// Obter multiplicador de votação
const multiplier = await stakingManager.getVotingMultiplier();
console.log('Multiplicador:', multiplier, 'x');

// Calcular rewards
const rewards = await stakingManager.calculateReward();
console.log('Rewards pendentes:', rewards, 'AGT');

// Resgatar rewards
await stakingManager.claim();

// Desfazer stake
await stakingManager.unstake();
```

---

### 5. **DAOManager** - Gerencia governança

```javascript
const daoManager = new DAOManager(web3);

// Criar proposta (exemplo: atualizar taxa)
const targets = ['0x1234...5678'];
const values = [0];
const calldatas = ['0x...'];  // encoded function call
const description = 'Aumentar taxa da plataforma para 6%';

const proposalReceipt = await daoManager.propose(
    targets,
    values,
    calldatas,
    description
);

// Votar em proposta (0 = contra, 1 = a favor, 2 = abstenção)
await daoManager.castVote(1, 1); // proposalId 1, a favor

// Verificar estado da proposta
const state = await daoManager.getProposalState(1);
console.log('Estado:', state); // "Pending", "Active", "Succeeded", etc.

// Obter detalhes da proposta
const details = await daoManager.getProposalDetails(1);
console.log(details);
// {
//   description: "Aumentar taxa...",
//   startBlock: 12345,
//   endBlock: 12445,
//   forVotes: "150000.0",
//   againstVotes: "50000.0"
// }
```

---

### 6. **OracleManager** - Integracao Chainlink

```javascript
const oracleManager = new OracleManager(web3);

// Obter preço ETH/USD mais recente
const priceData = await oracleManager.getLatestPrice();
console.log(priceData);
// {
//   price: 2500.5,
//   timestamp: 1684320000,
//   roundId: 18446744073709551234,
//   isFresh: true
// }

// Usar no validação de contribuições
if (priceData.isFresh) {
    console.log('Preço atualizado, seguro para usar');
} else {
    console.warn('Preço stale, aguarde nova atualização');
}
```

---

### 7. **TierManagerHelper** - Gerencia NFTs ERC-1155

```javascript
const tierManager = new TierManagerHelper(web3);

// Obter balanço de NFT (tier)
const bronzeCount = await tierManager.getBalance(userAddress, 0);
const silverCount = await tierManager.getBalance(userAddress, 1);
const goldCount = await tierManager.getBalance(userAddress, 2);

console.log('Bronze:', bronzeCount, 'Silver:', silverCount, 'Gold:', goldCount);

// Obter detalhes de um tier
const tierDetails = await tierManager.getTierDetails(0); // Bronze
console.log(tierDetails);
// {
//   name: "Bronze",
//   minAmount: "0.1",
//   bonus: 100  // 1x multiplicador
// }
```

---

## 💡 Exemplos Práticos

### Exemplo 1: Flow Completo de Contribuição

```javascript
async function contribuirParaCampanha() {
    // 1. Conectar wallet
    const web3 = new Web3Manager();
    await web3.connectWallet();
    
    // 2. Inicializar managers
    const campaignManager = new CampaignManager(web3);
    const oracleManager = new OracleManager(web3);
    
    // 3. Validar preço do oráculo
    const priceData = await oracleManager.getLatestPrice();
    if (!priceData.isFresh) {
        throw new Error('Preço do oráculo stale');
    }
    
    // 4. Contribuir
    const campaignAddress = '0x1234...5678';
    const amount = 1.5; // ETH
    
    const receipt = await campaignManager.contributeToCampaign(
        campaignAddress,
        amount
    );
    
    // 5. Verificar detalhes após contribuição
    const details = await campaignManager.getCampaignDetails(campaignAddress);
    console.log(`
        ✅ Contribuição de ${amount} ETH confirmada!
        Novo total arrecadado: ${details.raised}/${details.hardCap} ETH
        Progresso: ${(details.raised / details.hardCap * 100).toFixed(1)}%
    `);
    
    return receipt;
}
```

---

### Exemplo 2: Stake, Voto e Resgate de Rewards

```javascript
async function stakingFlow() {
    const web3 = new Web3Manager();
    await web3.connectWallet();
    
    const tokenManager = new TokenManager(web3);
    const stakingManager = new StakingManager(web3);
    const daoManager = new DAOManager(web3);
    
    // 1. Aprovar tokens para staking
    await tokenManager.approve(STAKING_ADDRESS, 50000);
    
    // 2. Fazer stake por 180 dias
    await stakingManager.stake(50000, 180 * 24 * 60 * 60);
    console.log('✅ 50,000 AGT em stake');
    
    // 3. Verificar multiplicador de votação
    const multiplier = await stakingManager.getVotingMultiplier();
    console.log(`🗳️ Seu poder de voto: ${multiplier}x`);
    
    // 4. Votar em proposta
    await daoManager.castVote(1, 1); // proposalId 1, a favor
    console.log('✅ Voto computado');
    
    // 5. Após vesting, resgatar rewards
    const rewards = await stakingManager.calculateReward();
    console.log(`💎 Rewards disponíveis: ${rewards} AGT`);
    
    await stakingManager.claim();
    console.log('✅ Rewards resgatados!');
}
```

---

### Exemplo 3: Criar Campanha

```javascript
async function criarCampanha() {
    const web3 = new Web3Manager();
    await web3.connectWallet();
    
    const campaignManager = new CampaignManager(web3);
    
    const title = "Plataforma de Educação Descentralizada";
    const description = `
        Uma nova plataforma que utiliza blockchain para validar 
        certificados educacionais com segurança e transparência.
    `;
    const softCap = 10;  // ETH
    const hardCap = 50;  // ETH
    const deadline = Date.now() + (90 * 24 * 60 * 60 * 1000); // 90 dias
    
    try {
        const receipt = await campaignManager.createCampaign(
            title,
            description,
            softCap,
            hardCap,
            deadline
        );
        
        console.log(`✅ Campanha criada com sucesso!`);
        console.log(`📍 Hash: ${receipt.hash}`);
        console.log(`⏳ Aguardando aprovação da DAO...`);
        
    } catch (error) {
        console.error('❌ Erro ao criar campanha:', error.message);
    }
}
```

---

## 🔐 Considerações de Segurança

### ✅ Implementadas

- ✅ Validação de oracle staleness (Chainlink 1h timeout)
- ✅ ReentrancyGuard em transfers e withdrawals
- ✅ Verificação de zero address
- ✅ Overflow/underflow protection (Solidity 0.8.20+)
- ✅ CEI pattern (Checks-Effects-Interactions)

### ⚠️ Recomendações

- **Nunca exponha chaves privadas** no frontend
- **Use MetaMask/WalletConnect** para assinatura de transações
- **Valide inputs** antes de enviar para blockchain
- **Teste em testnet primeiro** (Sepolia/Goerli)
- **Use multisig** para funções administrativas

---

## 🧪 Testando Localmente

### Com Mock Data

O frontend inclui dados mock que funcionam **offline**. Para testes rápidos:

```bash
# Abra o arquivo diretamente no navegador
open apoia-protocol-frontend.html

# Explore as 8 telas
# Clique em "Conectar Wallet" (mock)
```

### Com Testnet Real

1. **Configure endereços dos contratos** em `web3-integration.js`:

```javascript
const contractAddresses = {
    campaignFactory: '0x...', // Seu endereço em Sepolia
    agtToken: '0x...',
    apoiaDAO: '0x...',
    // ... etc
};
```

2. **Use MetaMask** conectado a Sepolia/Goerli

3. **Obtenha Sepolia ETH** em: https://sepoliafaucet.com

---

## 📊 Monitor de Transações

Todas as transações incluem **status real-time**:

```
Aguardando Assinatura (Wallet)
↓ (usuário assina)
Confirmando (Mempool) - ⏳ ~15 seg
↓ (minerado)
Sucesso / Falha (On-chain) - ✅/❌
```

---

## 🚨 Troubleshooting

### Problema: "MetaMask não está instalado"

**Solução**: Instale MetaMask em https://metamask.io

---

### Problema: "Erro ao buscar preço do oráculo"

**Solução**: Verifique se o endereço do Chainlink Feed está correto para a rede

---

### Problema: "Transação falhou com 'preco stale'"

**Solução**: Aguarde o Chainlink atualizar o preço (máx 1h) ou ajuste MAX_STALENESS

---

## 📝 Próximas Melhorias (Phase 2)

- [ ] Integração The Graph (subgraph)
- [ ] IPFS para armazenamento de metadados
- [ ] Circuit breaker para limites de transação
- [ ] Modo escuro aprimorado
- [ ] Mobile app (React Native)
- [ ] Fallback oracle (Pyth Network)

---

## 📞 Suporte

Para dúvidas sobre a integração:

1. Consulte [Smart Contracts Documentation](../ARCHITECTURE.md)
2. Veja [Auditoria Completa](../docs/RELATORIO_AUDITORIA_COMPLETO.md)
3. Teste exemplos de web3-integration.js

---

**Desenvolvido com ❤️ para APOIA Protocol v1.0**
