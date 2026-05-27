
# 🌐 UX/UI e Interface Web3 — APOIA PROTOCOL

A confiança na Web3 é diretamente proporcional à clareza visual. Este repositório centraliza as diretrizes de design, a arquitetura de experiência do usuário (UX/UI) e a implementação do frontend do protocolo, adotando a filosofia **"Clean Dashboard"** e focando no feedback imediato e determinístico de transações e estados da blockchain.

> **Status de Integração:** ✅ **INTEGRADO COM SEPOLIA TESTNET (11155111)** > Todos os smart contracts estão deployados, verificados e funcionais.

---

## 📌 Índice

1. [Estrutura de Arquivos](https://www.google.com/search?q=%23-estrutura-de-arquivos)
2. [Endereços dos Smart Contracts](https://www.google.com/search?q=%23-endere%C3%A7os-dos-smart-contracts)
3. [Filosofia de Design & Diretrizes Mandatórias](https://www.google.com/search?q=%23-filosofia-de-design--diretrizes-mandat%C3%B3rias)
4. [Mapeamento das Telas do Frontend](https://www.google.com/search?q=%23-mapeamento-das-telas-do-frontend)
5. [Guia de Início Rápido (Quick Start)](https://www.google.com/search?q=%23-guia-de-in%C3%ADcio-r%C3%A1pido-quick-start)
6. [Integração e Fluxos Web3 (ethers.js)](https://www.google.com/search?q=%23-integra%C3%A7%C3%A3o-e-fluxos-web3-ethersjs)
7. [Checklist, Segurança e Troubleshooting](https://www.google.com/search?q=%23-checklist-seguran%C3%A7a-e-troubleshooting)
8. [Evolução da Stack Tecnológica](https://www.google.com/search?q=%23-evolu%C3%A7%C3%A3o-da-stack-tecnol%C3%B3gica)

---

## 📁 Estrutura de Arquivos

| Arquivo | Descrição | Status |
| --- | --- | --- |
| **`apoia-protocol-frontend.html`** | Frontend completo com 8 telas, UI interativa e mock data dinâmico. | ✅ Completo |
| **`web3-integration.js`** | Classes baseadas em `ethers.js v6` (`Web3Manager`, `CampaignManager`, etc). | ✅ Completo |
| **`contract-addresses.json`** | JSON centralizado com os endereços dos contratos em Sepolia. | ✅ Novo |
| **`QUICK-START.html`** | Guia rápido interativo com exemplos prontos para copiar e usar. | ✅ Completo |
| **`README.md`** | Documentação principal do repositório. | ✅ Atualizado |

---

## 🔗 Endereços dos Smart Contracts

Todos os contratos abaixo foram publicados e possuem código-fonte verificado:

| Contrato | Endereço em Sepolia | Verificação / Provedor |
| --- | --- | --- |
| **CampaignFactory** | `0xb385a9feeb0e4064bc7e2e4a89b6496e6864e8e7` | ✅ Etherscan |
| **AGTToken** | `0xb9cc185e0aea3486e3915b04286618610a995d3a` | ✅ Etherscan |
| **ApoiaDAO** | `0x5181bc4a74d252e1f10678a7e32ae91c8518061a` | ✅ Etherscan |
| **StakingAGT** | `0x9dbefad6cd0c96b5e64f4b963d1b85bfac02c1ff` | ✅ Etherscan |
| **TreasuryDAO** | `0x4780e8a81112e725741ac70e2d02a3c8ad04bfd5` | ✅ Etherscan |
| **ChainlinkFeed (ETH/USD)** | `0x694AA1769357215DE4FAC081bf1f309aDC325306` | ✅ Chainlink |

---

## 🎨 Filosofia de Design & Diretrizes Mandatórias

Para mitigar a ansiedade natural do usuário ao interagir com contratos inteligentes, a interface é guiada por dois pilares:

1. **Clean Dashboard:** Interfaces minimalistas, livres de ruídos cognitivos, destacando apenas as informações críticas para a tomada de decisão financeira e de governança.
2. **Feedback Imediato de Transações:** Ciclo de vida visual claro para qualquer chamada de função de escrita (*Write functions*):

$$\text{Aguardando Assinatura (Wallet)} \longrightarrow \text{Confirmando (Mempool)} \longrightarrow \text{Sucesso / Falha (On-chain)}$$



### 🛠️ Regras de Exibição e Validação de Dados

* **Home & Explorar:** Cards com *badges* de status explícitos (`Ativo` / `Em Auditoria` / `Reprovado`) e links diretos para o Etherscan.
* **Detalhes da Campanha:** Módulo de aporte com conversão em tempo real via Oráculo Chainlink e verificação de *Timestamp* (evitando *stale data*).
* **Dashboard & Portfólio:** Rastreamento visual de *vesting* do token **$AGT** e exibição de hashes IPFS de relatórios descentralizados.
* **Governança:** Gráficos de barras reativos para acompanhamento do **Quórum Dual** (métrica combinada de tokens e carteiras únicas).
* **Wizard de Criação:** Validação estrita no *client-side* para impedir erros lógicos de input como *Hard Cap* incoerente ou datas retroativas.

---

## 🖥️ Mapeamento das Telas do Frontend

O arquivo `apoia-protocol-frontend.html` funciona de forma autônoma (offline com mock data ou online via MetaMask) e contempla **8 telas funcionais**:

| ID | Tela | Funcionalidades Principais | Componentes Web3 Integrados |
| --- | --- | --- | --- |
| **01** | **Home** | Métricas globais on-chain, ticker do par `ETH/USD` e campanhas em destaque. | Multi-call aggregates, Price Feeds |
| **02** | **Explorar** | Busca em tempo real com filtros por status, categoria e redes. | Indexador local / Subgraph Client |
| **03** | **Detalhes** | Progresso de arrecadação, tiers **ERC-1155**, preview de aporte e leitura do oráculo. | Smart Contract Read, IPFS Gateway |
| **04** | **Dashboard** | Painel administrativo do proponente para gerenciamento de saques pós-meta. | Escrow / Timelock Interactions |
| **05** | **Portfólio** | Galeria de NFTs de apoio, liberação de *vesting* de **$AGT** e painel de *staking*. | ERC-721/1155 Viewer, Vesting Vaults |
| **06** | **Governança** | Listagem de propostas da DAO, votação ponderada e monitoramento de fila do *Timelock*. | Governor Contracts, Voting |
| **07** | **Tesouro** | Composição do fundo da DAO e fluxo histórico de entradas e saídas. | Asset Management, Treasury Tracker |
| **08** | **Criar Campanha** | *Wizard* em 4 etapas para parametrização, validação de limites e simulação de deploy. | Factory Contract Predictor / Gas Est. |

---

## 🚀 Guia de Início Rápido (Quick Start)

### 1. Preparação da Wallet (MetaMask)

1. Abra a MetaMask e acesse a seleção de redes.
2. Adicione ou mude para a rede **Sepolia Testnet**.
* *Chain ID:* `11155111` | *Symbol:* `ETH` | *Explorer:* `https://sepolia.etherscan.io`


3. Obtenha fundos gratuitos em um Faucet oficial: [Sepolia Faucet](https://sepoliafaucet.com) ou [Alchemy Sepolia Faucet](https://www.alchemy.com/faucets/ethereum-sepolia).

### 2. Executando o Frontend

Clone o repositório e inicie um servidor local simples para evitar bloqueios de políticas de CORS pelo navegador:

```bash
# Clone e navegue até a pasta
git clone https://github.com/seu-usuario/seu-repositorio.git
cd seu-repositorio

# Inicie um servidor HTTP local simples
python -m http.server 8000

```

Acesse no seu navegador homologado (Chrome, Brave, Firefox): **`http://localhost:8000/apoia-protocol-frontend.html`**

---

## 🔄 Integração e Fluxos Web3 (`ethers.js`)

Adicione o provedor global no cabeçalho do seu HTML antes de instanciar as classes de gerenciamento:

```html
<script src="https://cdn.jsdelivr.net/npm/ethers@6/dist/ethers.umd.min.js"></script>
<script src="web3-integration.js"></script>

```

### Arquivos de Configuração Estruturados

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

```javascript
class Web3Manager {
    initializeContracts() {
        this.contractAddresses = {
            campaignFactory: '0xb385a9feeb0e4064bc7e2e4a89b6496e6864e8e7',
            agtToken: '0xb9cc185e0aea3486e3915b04286618610a995d3a',
            apoiaDAO: '0x5181bc4a74d252e1f10678a7e32ae91c8518061a',
            stakingAGT: '0x9dbefad6cd0c96b5e64f4b963d1b85bfac02c1ff',
            treasuryDAO: '0x4780e8a81112e725741ac70e2d02a3c8ad04bfd5',
            chainlinkFeed: '0x694AA1769357215DE4FAC081bf1f309aDC325306'
        };
    }
}

```

### Snippets Práticos de Integração

#### Fluxo 1: Criar Campanha

```javascript
const web3 = new Web3Manager();
await web3.connectWallet();

const campaignManager = new CampaignManager(web3);
const tx = await campaignManager.createCampaign(
    "Meu Projeto Web3",
    "Descrição detalhada do ecossistema",
    ethers.parseEther("10"),                    // Soft Cap em wei
    ethers.parseEther("50"),                    // Hard Cap em wei
    Math.floor(Date.now() / 1000) + (86400 * 30) // Deadline (+30 dias)
);
console.log('🚀 Transação enviada:', tx.hash);

```

#### Fluxo 2: Contribuir para Campanha

```javascript
const tx = await campaignManager.contributeToCampaign('0xCampaignAddress...', ethers.parseEther('0.5'));

```

#### Fluxo 3: Staking de AGT

```javascript
const stakingManager = new StakingManager(web3);
const tokenManager = new TokenManager(web3);

// 1. Aprovar gasto de tokens pelo contrato de staking
await tokenManager.approve(web3.contractAddresses.stakingAGT, ethers.parseEther('1000'));
// 2. Executar Stake para 30 dias (Representação Unix/Hex correspondente)
await stakingManager.stake(ethers.parseEther('1000'), 0x62ed4e00);

```

#### Fluxo 4: Governança & Oráculo

```javascript
// Votar na DAO (0 = Contra, 1 = A Favor, 2 = Abstenção)
await daoManager.castVote(proposalId, 1);

// Consultar Oráculo
const oracleData = await oracleManager.getLatestPrice();
console.log(`Preço Atual: $${oracleData.price.toFixed(2)} | Fresh: ${oracleData.isFresh}`);

```

---

## ✅ Checklist, Segurança e Troubleshooting

### Checklist de Prontidão do Frontend

* [x] Conexão dinâmica via `Web3Manager` com validação de rede ativa.
* [x] Integração total com `CampaignFactory` e assinaturas via MetaMask.
* [x] Gerenciamento de allowance para o token de utilidade `AGTToken`.
* [x] Chamadas de leitura (*Read Calls*) protegidas por tratamento de exceção.

### 🔐 Diretrizes Críticas de Segurança

> ❌ **NÃO FAÇA:** Nunca armazene chaves privadas ou mnemônicos no código frontend ou `localStorage`. Não use RPCs públicas sem limite de requisição em produção.
> ✅ **FAÇA:** Implemente uma verificação ativa de rede (`wallet_switchEthereumChain`). Sempre valide o parâmetro de atualização de tempo do Oráculo Chainlink para impedir ataques baseados em dados defasados (*stale data*).

### 🐛 Resolução de Problemas Comuns (Troubleshooting)

* **Erro: `net::ERR_NAME_NOT_RESOLVED` (Ethers CDN fora do ar):** Substitua a chamada do script pelo espelho unpkg/jsdelivr:
```html
<script src="https://cdn.jsdelivr.net/npm/ethers@6/dist/ethers.umd.min.js"></script>

```


* **Erro: `Wrong network` / Operações falhando sem resposta:** Force a troca de rede programaticamente no seu script de inicialização:
```javascript
const chainId = (await web3.provider.getNetwork()).chainId;
if (chainId !== 11155111) {
    await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }] // 11155111 convertido para Hex
    });
}

```



---

## 🛠️ Evolução da Stack Tecnológica

Para transformar este protótipo monolítico funcional em uma aplicação distribuída de nível de produção, recomenda-se migrar a arquitetura atual para o seguinte ecossistema:

* **Framework Base:** Next.js (React) para renderização híbrida e rotas otimizadas.
* **Estilização:** TailwindCSS, preservando os componentes visuais da filosofia *Clean Dashboard*.
* **Conectividade Web3 Avançada:** Wagmi Hooks + Viem (alternativa moderna, leve e performática ao ethers.js).
* **Onboarding Toolkits:** RainbowKit ou ConnectKit para abstrair e facilitar a conexão multi-carteiras dos usuários.
* **Indexação de Dados:** Estruturação de um Subgraph dedicado no The Graph para consultas rápidas de histórico de campanhas e votações da DAO.