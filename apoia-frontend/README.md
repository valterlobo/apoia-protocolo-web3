
## UX/UI e Interface Web3 — APOIA PROTOCOL

A confiança na Web3 é diretamente proporcional à clareza visual. Este repositório centraliza as diretrizes de design, a arquitetura de experiência do usuário (UX/UI) e a implementação do frontend do protocolo, adotando a filosofia **"Clean Dashboard"** e focando no feedback imediato e determinístico de transações e estados da blockchain.

**🌐 Status de Integração:** ✅ **INTEGRADO COM SEPOLIA**  
Todos os smart contracts estão deployados e funcionando em Sepolia Testnet.

---

###  Índice
- [Arquivos do Frontend](#-arquivos-do-frontend)
- [Status de Integração Blockchain](#-status-de-integração-blockchain)
- [Filosofia de Design & UX](#-filosofia-de-design--ux)
- [Diretrizes de Transparência Mandatórias](#%EF%B8%8F-diretrizes-de-transpar%C3%AAncia-mandat%C3%B3rias)
- [Telas do Frontend (`apoia-protocol-frontend.html`)](#%EF%B8%8F-telas-do-frontend-apoia-protocol-frontendhtml)
- [Como Executar](#-como-executar)
- [Integração com ethers.js](#-integração-com-ethersjs)
- [Stack Tecnológica Sugerida](#%EF%B8%8F-stack-tecnol%C3%B3gica-sugerida)

---

###  📁 Arquivos do Frontend

| Arquivo | Descrição | Status |
|---------|-----------|--------|
| **apoia-protocol-frontend.html** | Frontend completo com 8 telas, UI interativa, mock data | ✅ Completo |
| **web3-integration.js** | Classes ethers.js: Web3Manager, CampaignManager, TokenManager, etc | ✅ Completo |
| **BLOCKCHAIN-INTEGRATION.md** | Guia de integração com Sepolia e smart contracts | ✅ NOVO |
| **contract-addresses.json** | Endereços dos contratos em Sepolia | ✅ NOVO |
| **FRONTEND-GUIDE.md** | Documentação completa com exemplos de integração | ✅ Completo |
| **QUICK-START.html** | Guia rápido com exemplos prontos para colar e usar | ✅ Completo |
| **IMPLEMENTATION-SUMMARY.md** | Resumo da implementação | ✅ Completo |
| **INDEX.md** | Índice completo de todos os arquivos | ✅ Completo |
| **README.md** | Este arquivo | ✅ Este |

---

### 🌐 Status de Integração Blockchain

#### ✅ Smart Contracts Deployados em Sepolia (11155111)

| Contrato | Endereço | Verificado |
|----------|----------|-----------|
| **CampaignFactory** | `0xb385a9feeb0e4064bc7e2e4a89b6496e6864e8e7` | ✅ Etherscan |
| **AGTToken** | `0xb9cc185e0aea3486e3915b04286618610a995d3a` | ✅ Etherscan |
| **ApoiaDAO** | `0x5181bc4a74d252e1f10678a7e32ae91c8518061a` | ✅ Etherscan |
| **StakingAGT** | `0x9dbefad6cd0c96b5e64f4b963d1b85bfac02c1ff` | ✅ Etherscan |
| **TreasuryDAO** | `0x4780e8a81112e725741ac70e2d02a3c8ad04bfd5` | ✅ Etherscan |
| **ChainlinkFeed (ETH/USD)** | `0x694AA1769357215DE4FAC081bf1f309aDC325306` | ✅ Chainlink |

#### ✅ Funcionalidades Integradas

- ✅ Criar campanhas de crowdfunding
- ✅ Contribuir com ETH para campanhas
- ✅ Fazer stake de tokens AGT com rewards
- ✅ Votação na DAO com poder ponderado por stake
- ✅ Oráculo Chainlink para preço ETH/USD
- ✅ Treasury DAO para gestão de fundos
- ✅ NFTs ERC-1155 para tiers

---

### 🚀 Início Rápido (5 Minutos)

#### Opção 1: Apenas Visualizar (Sem Blockchain)

```bash
# Abra no navegador
open apoia-protocol-frontend.html

# Ou com servidor:
python -m http.server 8000
# Acesse: http://localhost:8000/apoia-protocol-frontend.html
```

#### Opção 2: Com Integração Sepolia (Recomendado)

```bash
# 1. Configure MetaMask para Sepolia
# https://sepoliafaucet.com (obtenha ETH testnet)

# 2. Inicie servidor local
cd apoia-frontend/
python -m http.server 8000

# 3. Abra no navegador
# http://localhost:8000/apoia-protocol-frontend.html

# 4. Clique "Conectar Wallet" e comece a testar!
```

---

### 📚 Documentação

| Documento | Propósito |
|-----------|----------|
| **[BLOCKCHAIN-INTEGRATION.md](BLOCKCHAIN-INTEGRATION.md)** | 📖 Guia completo de integração com Sepolia |
| **[FRONTEND-GUIDE.md](FRONTEND-GUIDE.md)** | 📖 Documentação técnica do frontend |
| **[QUICK-START.html](QUICK-START.html)** | 🚀 Exemplos prontos de código |
| **[contract-addresses.json](contract-addresses.json)** | 🔗 Endereços dos contratos |
| **[contract-abis.json](contract-abis.json)** | 📋 ABIs completas dos contratos |
| **[IMPLEMENTATION-SUMMARY.md](IMPLEMENTATION-SUMMARY.md)** | 📊 Resumo da implementação |
| **[INDEX.md](INDEX.md)** | 📑 Índice completo |

---

###  Filosofia de Design & UX

Para mitigar a ansiedade natural do usuário ao interagir com contratos inteligentes, nossa interface é guiada por dois pilares:
1. **Clean Dashboard:** Interfaces minimalistas, livres de ruídos cognitivos, destacando apenas as informações críticas para a tomada de decisão financeira e de governança.
2. **Feedback Imediato de Transações:** Ciclo de vida visual claro para qualquer chamada de função de escrita (Write functions):
   $$\text{Aguardando Assinatura (Wallet)} \longrightarrow \text{Confirmando (Mempool)} \longrightarrow \text{Sucesso / Falha (On-chain)}$$

---

### 🔗 Integração com ethers.js

O frontend utiliza **ethers.js v6** com classes reutilizáveis para interação com smart contracts.

#### Setup

```html
<!-- Incluir ethers.js -->
<script src="https://cdn.ethers.io/v6/ethers.umd.min.js"></script>

<!-- Incluir integração -->
<script src="web3-integration.js"></script>
```

#### Exemplo: Conectar e Contribuir

```javascript
const web3 = new Web3Manager();
await web3.connectWallet();

const campaignManager = new CampaignManager(web3);
await campaignManager.contributeToCampaign(
    '0x1234...5678',  // campaign address
    0.5               // amount in ETH
);
```

#### Classes Disponíveis

- **Web3Manager** - Gerencia conexão com wallet
- **CampaignManager** - Criar/contribuir campanhas
- **TokenManager** - Transferir AGT, criar vesting
- **StakingManager** - Fazer stake, resgatar rewards
- **DAOManager** - Votar, criar propostas
- **OracleManager** - Obter preço Chainlink
- **TierManagerHelper** - Gerenciar NFTs ERC-1155

#### Documentação Completa

Para exemplos detalhados e casos de uso, veja:
- [FRONTEND-GUIDE.md](FRONTEND-GUIDE.md) - Documentação completa
- [QUICK-START.html](QUICK-START.html) - Exemplos prontos para usar

---

### Diretrizes de Transparência Mandatórias

O frontend expõe dados determinísticos e validações rigorosas em nível de aplicação para garantir a máxima segurança:

* **Home & Explorar:** Cards de campanhas equipados com *badges* de status explícitos (`Ativo` / `Em Auditoria` / `Reprovado`) e hiperlinks diretos para o explorador de blocos (Etherscan/Blockscout).
* **Detalhes da Campanha:** Módulo de aporte com exibição em tempo real da cotação de ativos via Oráculo Chainlink e visibilidade transparente do *Timestamp* do oráculo para mitigar riscos de *stale data*.
* **Dashboard & Portfólio:** Visualização e verificação de hashes IPFS contendo relatórios de progresso descentralizados, além do rastreamento visual preciso do estado de *vesting* do token **$AGT**.
* **Governança:** Gráficos de barras reativos e em tempo real para acompanhamento do **Quórum Dual** (métrica combinada de tokens e carteiras únicas).
* **Wizard de Criação de Campanhas:** Sistema de validação semântica estrita no client-side para impedir erros lógicos de input, tais como:
    * Hard Cap
    * Configuração de datas de encerramento retroativas ou inferiores ao tempo mínimo de gestação do bloco.

---

### Telas do Frontend (`apoia-protocol-frontend.html`)

O arquivo autônomo `apoia-protocol-frontend.html` pode ser renderizado diretamente no navegador. Todas as **8 telas funcionam offline** com mock-ups dinâmicos de dados on-chain:

| ID | Tela | Funcionalidades Principais | Componentes Web3 Integrados |
| :---: | :--- | :--- | :--- |
| **01** | **Home** | Métricas globais on-chain, ticker ao vivo do par `ETH/USD` e vitrine de campanhas em destaque. | Multi-call aggregates, Price Feeds |
| **02** | **Explorar** | Mecanismo de busca em tempo real com filtros avançados por status, categoria e rede (Cross-chain). | Indexador local / Subgraph Client |
| **03** | **Detalhes** | Visualização de progresso da arrecadação, tiers de recompensa baseados em **ERC-1155**, preview de aporte e leitura do oráculo Chainlink. | Smart Contract Read, IPFS Gateway |
| **04** | **Dashboard** | Painel administrativo do proponente da campanha com gerenciamento de saques condicionais pós-meta. | Escrow / Timelock Interactions |
| **05** | **Portfólio** | Galeria de NFTs de apoio, cronograma e liberação de *vesting* do **$AGT** e painel de *staking* com multiplicadores de fidelidade. | ERC-721/1155 Viewer, Vesting Vaults |
| **06** | **Governança** | Listagem de propostas da DAO, interface de votação ponderada com quórum duplo e monitoramento de fila do *Timelock*. | Governor Alpha/Bravo, Voting |
| **07** | **Tesouro** | Composição do fundo da DAO, fluxo histórico de entradas e saídas e links para os contratos inteligentes verificados. | Asset Management, Treasury Tracker |
| **08** | **Criar Campanha** | *Wizard* guiado de 4 etapas para parametrização da campanha, validação matemática de *caps*, simulador de oráculo e simulação de *deploy*. | Factory Contract Predictor / Gas Est. |

---

###  Como Executar

Por ser uma interface monolítica e otimizada para testes/demonstração rápidos, o frontend não exige instaladores de pacotes (`npm` / `yarn`).

1. Clone este repositório:

```bash
   git clone [https://github.com/seu-usuario/seu-repositorio.git](https://github.com/seu-usuario/seu-repositorio.git)
```

1. Navegue até o arquivo da interface:

   Bash

   ```
   cd seu-repositorio
   ```

2. Abra o arquivo diretamente no seu navegador homologado (Chrome, Brave, Firefox):

   Bash

   ```
   # No macOS
   open apoia-protocol-frontend.html
   
   # No Linux
   xdg-open apoia-protocol-frontend.html
   ```

### Stack Tecnológica Sugerida

Para a evolução deste protótipo monolítico para ambiente de produção, recomenda-se a seguinte arquitetura:

- **Framework:** Next.js (React) ou Vue 3 para SPA reativa.

- **Estilização:** TailwindCSS (mantendo a filosofia *Clean Dashboard* com modo escuro nativo).

- **Conexão Web3:** Wagmi Hooks + Viem ou Ethers.js para gerenciamento de RPCs.

- **Provedor de Carteiras:** RainbowKit ou Web3Modal para onboarding do usuário.