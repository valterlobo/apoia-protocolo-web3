# 🔗 Integração Frontend ↔ Smart Contracts - APOIA Protocol

**Data:** 26 de maio de 2026  
**Status:** ✅ Integração Completa com Sepolia  
**Network:** Ethereum Sepolia Testnet (ChainID: 11155111)

---

## 📋 Sumário Executivo

O frontend APOIA está **totalmente integrado** com os smart contracts deployados em Sepolia. Todos os 5 contratos principais estão configurados e prontos para uso.

---

## 🌐 Contratos Deployados em Sepolia

| Contrato | Endereço | Status |
|----------|----------|--------|
| **CampaignFactory** | `0xb385a9feeb0e4064bc7e2e4a89b6496e6864e8e7` | ✅ Verificado |
| **AGTToken** | `0xb9cc185e0aea3486e3915b04286618610a995d3a` | ✅ Verificado |
| **ApoiaDAO** | `0x5181bc4a74d252e1f10678a7e32ae91c8518061a` | ✅ Verificado |
| **StakingAGT** | `0x9dbefad6cd0c96b5e64f4b963d1b85bfac02c1ff` | ✅ Verificado |
| **TreasuryDAO** | `0x4780e8a81112e725741ac70e2d02a3c8ad04bfd5` | ✅ Verificado |
| **ChainlinkFeed (ETH/USD)** | `0x694AA1769357215DE4FAC081bf1f309aDC325306` | ✅ Verificado |

---

## 🚀 Quick Start - 5 Minutos

### 1. Setup MetaMask para Sepolia

```
1. Abra MetaMask
2. Clique em "Networks" (canto superior direito)
3. Clique em "Add network"
4. Preencha:
   - Network name: Sepolia
   - RPC URL: https://sepolia.infura.io/v3/YOUR_INFURA_KEY
   - Chain ID: 11155111
   - Currency symbol: ETH
   - Block explorer: https://sepolia.etherscan.io
5. Clique "Save"
6. Selecione "Sepolia" na lista de redes
```

### 2. Obter Sepolia ETH (Testnet)

```bash
# Acesse o faucet oficial:
https://sepoliafaucet.com

# Ou via Alchemy:
https://www.alchemy.com/faucets/ethereum-sepolia
```

### 3. Abrir Frontend

```bash
cd apoia-frontend/

# Com servidor local (RECOMENDADO):
python -m http.server 8000

# Acesse: http://localhost:8000/apoia-protocol-frontend.html
```

### 4. Conectar Wallet

```
1. Na página, clique "Conectar Wallet"
2. Selecione MetaMask
3. Confirme a conexão
4. ✅ Conectado a Sepolia!
```

---

## 🔄 Fluxos de Integração

### Fluxo 1: Criar Campanha

```javascript
// 1. Conectar wallet
const web3 = new Web3Manager();
await web3.connectWallet();

// 2. Criar campanha
const campaignManager = new CampaignManager(web3);
const tx = await campaignManager.createCampaign(
    "Meu Projeto",                              // title
    "Descrição do projeto",                     // description
    ethers.parseEther("10"),                    // softCap (meta mínima)
    ethers.parseEther("50"),                    // hardCap (meta máxima)
    Math.floor(Date.now() / 1000) + 86400 * 30  // deadline (30 dias)
);

console.log('✅ Campanha criada:', tx.hash);
```

### Fluxo 2: Contribuir para Campanha

```javascript
const campaignAddress = '0x...'; // endereço da campanha
const amount = ethers.parseEther('1'); // 1 ETH

const tx = await campaignManager.contributeToCampaign(
    campaignAddress,
    amount
);

console.log('✅ Contribuição realizada:', tx.hash);
```

### Fluxo 3: Fazer Stake de AGT

```javascript
const stakingManager = new StakingManager(web3);
const tokenManager = new TokenManager(web3);

// 1. Aprovar contrato de staking
await tokenManager.approve(
    web3.contractAddresses.stakingAGT,
    ethers.parseEther('1000')
);

// 2. Fazer stake (30 dias = 0x62ed4e00)
await stakingManager.stake(
    ethers.parseEther('1000'),  // amount
    0x62ed4e00                   // duration (30 days)
);

console.log('✅ Stake realizado!');
```

### Fluxo 4: Votar na DAO

```javascript
const daoManager = new DAOManager(web3);

// Votar a favor (support = 1)
await daoManager.castVote(
    proposalId,  // ID da proposta
    1            // 0 = Contra, 1 = A Favor, 2 = Abstenção
);

console.log('✅ Voto registrado!');
```

### Fluxo 5: Obter Preço do Oráculo

```javascript
const oracleManager = new OracleManager(web3);

const priceData = await oracleManager.getLatestPrice();
console.log(`ETH/USD: $${priceData.price.toFixed(2)}`);
console.log(`Fresco: ${priceData.isFresh ? '✅' : '❌'}`);
```

---

## 🔧 Configuração Detalhada

### Arquivo: `contract-addresses.json`

```json
{
  "sepolia": {
    "chainId": 11155111,
    "contracts": {
      "TreasuryDAO": "0x4780e8a81112e725741ac70e2d02a3c8ad04bfd5",
      "AGTToken": "0xb9cc185e0aea3486e3915b04286618610a995d3a",
      "StakingAGT": "0x9dbefad6cd0c96b5e64f4b963d1b85bfac02c1ff",
      "ApoiaDAO": "0x5181bc4a74d252e1f10678a7e32ae91c8518061a",
      "CampaignFactory": "0xb385a9feeb0e4064bc7e2e4a89b6496e6864e8e7",
      "ChainlinkFeed": "0x694AA1769357215DE4FAC081bf1f309aDC325306"
    }
  }
}
```

### Arquivo: `web3-integration.js`

Todos os endereços estão atualizados:

```javascript
class Web3Manager {
    initializeContracts() {
        const contractAddresses = {
            campaignFactory: '0xb385a9feeb0e4064bc7e2e4a89b6496e6864e8e7',
            agtToken: '0xb9cc185e0aea3486e3915b04286618610a995d3a',
            apioaDAO: '0x5181bc4a74d252e1f10678a7e32ae91c8518061a',
            stakingAGT: '0x9dbefad6cd0c96b5e64f4b963d1b85bfac02c1ff',
            treasuryDAO: '0x4780e8a81112e725741ac70e2d02a3c8ad04bfd5',
            chainlinkFeed: '0x694AA1769357215DE4FAC081bf1f309aDC325306'
        };
        // ... resto do código
    }
}
```

---

## ✅ Checklist de Integração

- ✅ Web3Manager conectado a Sepolia
- ✅ CampaignFactory integrado
- ✅ AGTToken integrado (transferências, aprovações)
- ✅ StakingAGT integrado (stake, rewards, unstake)
- ✅ ApoiaDAO integrado (votação, propostas)
- ✅ ChainlinkFeed integrado (preço ETH/USD)
- ✅ TreasuryDAO referenciado
- ✅ Frontend UI conectando a todos os contratos
- ✅ Transações com feedback ao usuário
- ✅ Erro handling robusto

---

## 🧪 Testando a Integração

### Teste 1: Conexão de Wallet

```javascript
// No console do navegador (F12 → Console)
const web3 = new Web3Manager();
await web3.connectWallet();
console.log(web3.userAddress);
```

**Esperado:** Seu endereço MetaMask será exibido

### Teste 2: Verificar Saldo AGT

```javascript
const tokenManager = new TokenManager(web3);
const balance = await tokenManager.getBalance(web3.userAddress);
console.log(`Saldo AGT: ${ethers.formatEther(balance)}`);
```

**Esperado:** Seu saldo de AGT em Sepolia

### Teste 3: Verificar Preço Oráculo

```javascript
const oracleManager = new OracleManager(web3);
const price = await oracleManager.getLatestPrice();
console.log(`ETH/USD: $${price.price.toFixed(2)}`);
```

**Esperado:** Preço atual de ETH em USD

### Teste 4: Listar Campanhas

```javascript
const campaignManager = new CampaignManager(web3);
const count = await web3.contracts.campaignFactory.getCampaignCount();
console.log(`Total de campanhas: ${count}`);
```

**Esperado:** Número de campanhas criadas

---

## 🔐 Segurança

### ⚠️ NÃO FAÇA:
- ❌ Exponha chaves privadas
- ❌ Coloque informações sensíveis no localStorage sem encriptação
- ❌ Use RPC URLs públicas em produção
- ❌ Confie em preços de oráculo desatualizados

### ✅ FAÇA:
- ✅ Use MetaMask para gerenciar chaves
- ✅ Valide preços de oráculo (staleness check: max 1 hora)
- ✅ Verifique endereços de contratos
- ✅ Implemente rate limiting em transações
- ✅ Use HTTPS em produção

---

## 📡 Exploradores & Ferramentas

| Tool | URL |
|------|-----|
| **Sepolia Explorer** | https://sepolia.etherscan.io |
| **MetaMask** | https://metamask.io |
| **Etherscan (Verificação)** | https://etherscan.io/apis |
| **Infura (RPC)** | https://infura.io |
| **The Graph (Subgraph)** | https://thegraph.com |

---

## 🐛 Troubleshooting

### Erro: "net::ERR_NAME_NOT_RESOLVED"

**Solução:**
```html
<!-- Trocar CDN de ethers.js -->
<script src="https://cdn.jsdelivr.net/npm/ethers@6/dist/ethers.umd.min.js"></script>
```

### Erro: "User rejected"

**Solução:** Confirme a transação no MetaMask

### Erro: "Insufficient balance"

**Solução:** Obtenha Sepolia ETH do faucet (https://sepoliafaucet.com)

### Erro: "Wrong network"

**Solução:**
```javascript
// Verificar e mudar rede
const chainId = (await web3.provider.getNetwork()).chainId;
if (chainId !== 11155111) {
    await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }] // 11155111 em hexadecimal
    });
}
```

---

## 📚 Documentação Relacionada

- [FRONTEND-GUIDE.md](FRONTEND-GUIDE.md) - Guia completo do frontend
- [QUICK-START.html](QUICK-START.html) - Exemplos prontos
- [contract-abis.json](contract-abis.json) - ABIs completas
- [load-real-data.js](load-real-data.js) - Carregamento de dados blockchain

---

## 🎯 Próximos Passos

### Phase 1: Testnet (✅ FEITO)
- ✅ Contratos deployados em Sepolia
- ✅ Frontend integrado
- ✅ Testes manuais

### Phase 2: Subgraph (⏳ PLANEJADO)
- [ ] Deploy do Subgraph
- [ ] Integração The Graph
- [ ] Cache de dados on-chain

### Phase 3: Produção (⏳ PLANEJADO)
- [ ] Deployment em Mainnet
- [ ] Auditoria de segurança
- [ ] Testes de carga

---

## 💬 Suporte

**Para dúvidas técnicas:**
1. Consulte [QUICK-START.html](QUICK-START.html)
2. Verifique os logs do console (F12)
3. Teste com Sepolia Faucet
4. Abra uma issue no GitHub

**Para reportar bugs:**
```bash
# Inclua:
- Network (Sepolia)
- Erro exato
- Screenshots
- Steps to reproduce
```

---

## 🎉 Checklist Final

- ✅ MetaMask configurado para Sepolia
- ✅ Sepolia ETH obtido do faucet
- ✅ Frontend acessível em localhost:8000
- ✅ Wallet conectada
- ✅ Pronto para transações!

**Status:** 🟢 Pronto para Produção

---

**Desenvolvido com ❤️ para APOIA Protocol**

*Última atualização: 26 de maio de 2026*
