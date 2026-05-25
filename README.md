# Apoia Protocol Web3 🚀

[![Foundry](https://img.shields.io/badge/Built%20with-Foundry-blue)](https://book.getfoundry.sh/)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.20-red)](https://solidity.readthedocs.io/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Web3](https://img.shields.io/badge/Web3-Enabled-9cf)](https://web3.foundation/)

> **Infraestrutura descentralizada para crowdfunding com governança DAO, NFTs ERC-1155 e tokenomics completa**

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Características](#-características)
- [Arquitetura](#-arquitetura)
- [Instalação](#-instalação)
- [Como Usar](#-como-usar)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Testes](#-testes)
- [Segurança](#-segurança)
- [Documentação](#-documentação)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

## 🎯 Visão Geral

**Apoia Protocol** é uma plataforma Web3 que permite crowdfunding descentralizado com:

- **Governança DAO**: Votação e aprovação de campanhas através de votação comunitária
- **Tokenomics Completa**: Token AGT com vesting, staking e multiplicadores
- **NFTs ERC-1155**: Recibos tokenizados por tier de contribuição
- **Escrow Trustless**: Contratos garantem a segurança dos fundos
- **Price Feeds Chainlink**: Cotações de preços em tempo real
- **Multisig Treasury**: Cofre da DAO com controle distribuído

## ✨ Características

### 🔐 Segurança
- Contratos auditados e seguindo best practices
- Proteção contra reentrância
- Validações rigorosas de permissões
- Timelock 2 dias para executar propostas

### 💰 Tokenomics
- **AGT Token**: ERC-20 com votação integrada (ERC20Votes)
- **Vesting Linear**: Cliff de 30 dias + 90 dias de distribuição
- **Staking com Lock**: Períodos de 3, 6 e 12 meses com multiplicadores
- **Governança**: Quórum duplo e votação ponderada

### 🎁 NFTs
- **ERC-1155**: Recibos tokenizados por tier
- **Metadados IPFS**: Armazenamento descentralizado
- **Tier Manager**: Gerenciamento automático de tiers

### 🔄 Fluxo de Campanha
```
ACTIVE → SUCCEEDED/FAILED → APPROVED/REJECTED → WITHDRAWN
```

## 🏗️ Arquitetura

```
Apoia Protocol
├── Core Contracts
│   ├── AGTToken.sol          → ERC-20 + Votação + Vesting
│   ├── ApoiaDAO.sol          → Governança com Timelock
│   ├── Campaign.sol          → Escrow e Lifecycle
│   ├── CampaignFactory.sol   → Factory Pattern
│   ├── StakingAGT.sol        → Staking com Lock
│   └── TierManager.sol       → NFTs ERC-1155
├── Libraries
│   ├── DAOMath.sol           → Cálculos de governança
│   └── VestingLib.sol        → Matemática de vesting
├── Utils
│   ├── ChainlinkHelper.sol   → Price Feeds
│   └── TreasuryDAO.sol       → Cofre da DAO
└── Integrations
    └── Chainlink Price Feeds → Cotações em tempo real
```

## 📦 Instalação

### Pré-requisitos

- [Foundry](https://book.getfoundry.sh/getting-started/installation) instalado
- [Git](https://git-scm.com/) instalado
- Node.js 16+ (opcional, para frontend)

### Setup

```bash
# 1. Clonar o repositório
git clone https://github.com/seu-usuario/apoia-protocolo-web3.git
cd apoia-protocolo-web3

# 2. Navegar para o diretório de contratos
cd apoia-protocol

# 3. Instalar dependências do Solidity
forge install

# 4. Compilar contratos
forge build

# 5. Rodar testes
forge test
```

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz de `apoia-protocol/`:

```bash
# RPC URLs
ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY

# Chaves privadas (apenas para desenvolvimento/teste)
PRIVATE_KEY=0x...

# Etherscan (para verificação de contratos)
ETHERSCAN_API_KEY=YOUR_KEY
```

## 🚀 Como Usar

### Deploy Local

```bash
# 1. Iniciar Anvil (fork local)
anvil

# 2. Em outro terminal, fazer deploy
forge script script/DeployApoiaProtocol.s.sol \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476c6b8d6c1f02d45b19e67ebf3 \
  --broadcast
```

### Criar uma Campanha

```bash
# Deploy de exemplo de campanha
forge script script/CreateExampleCampaign.s.sol \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476c6b8d6c1f02d45b19e67ebf3 \
  --broadcast
```

### Contribuir para uma Campanha

Via Foundry ou usando uma biblioteca Web3 como ethers.js:

```javascript
// Exemplo com ethers.js
const campaign = new ethers.Contract(campaignAddress, ABI, signer);
const tx = await campaign.contribute({ value: ethers.utils.parseEther("1.0") });
await tx.wait();
```

## 📂 Estrutura do Projeto

```
apoia-protocolo-web3/
├── README.md                          ← Este arquivo
├── apoia-frontend/                    ← Frontend Web3
│   ├── apoia-protocol.html
│   └── README.md
├── apoia-protocol/                    ← Contratos Solidity
│   ├── foundry.toml                   ← Configuração Foundry
│   ├── package.json
│   ├── remappings.txt                 ← Remapeamentos de imports
│   ├── src/
│   │   ├── core/                      ← Contratos principais
│   │   │   ├── AGTToken.sol
│   │   │   ├── ApoiaDAO.sol
│   │   │   ├── Campaign.sol
│   │   │   ├── CampaignFactory.sol
│   │   │   ├── StakingAGT.sol
│   │   │   └── TierManager.sol
│   │   ├── interfaces/                ← Interfaces públicas
│   │   │   ├── IAGTToken.sol
│   │   │   ├── IApoiaProtocol.sol
│   │   │   ├── ICampaign.sol
│   │   │   ├── ITierManager.sol
│   │   │   └── chainlink/
│   │   ├── libraries/                 ← Bibliotecas reutilizáveis
│   │   │   ├── DAOMath.sol
│   │   │   └── VestingLib.sol
│   │   ├── utils/                     ← Utilitários
│   │   │   ├── ChainlinkHelper.sol
│   │   │   └── TreasuryDAO.sol
│   │   └── mocks/                     ← Contratos para testes
│   │       └── MockChainlinkFeed.sol
│   ├── test/
│   │   ├── core/                      ← Testes unitários
│   │   │   ├── AGTToken.t.sol
│   │   │   └── Campaign.t.sol
│   │   ├── integration/               ← Testes de integração
│   │   │   └── FullFlow.t.sol
│   │   └── fuzz/                      ← Fuzzing de invariantes
│   │       └── CampaignFuzz.t.sol
│   ├── script/                        ← Scripts de deployment
│   │   ├── DeployApoiaProtocol.s.sol
│   │   └── CreateExampleCampaign.s.sol
│   ├── lib/                           ← Dependências externas
│   │   ├── openzeppelin-contracts/
│   │   ├── forge-std/
│   │   └── chainlink-brownie-contracts/
│   └── cache/
├── docs/                              ← Documentação técnica
│   ├── RELATORIO_AUDITORIA_COMPLETO.md
│   ├── 04_ARQUITETURA_TECNICA.md
│   ├── 05_VALIDACAO_TESTES_AUDITORIA.md
│   └── RelatorioTecnico.md
└── README.md
```

## 🧪 Testes

### Rodar Todos os Testes

```bash
cd apoia-protocol
forge test
```

### Rodar Testes com Cobertura

```bash
forge coverage
```

### Rodar Testes Específicos

```bash
# Testes unitários
forge test --match "testUnitario"

# Testes de integração
forge test --path test/integration/

# Fuzzing
forge test --path test/fuzz/ -vv
```

### Testes Disponíveis

- **Unit Tests** (`test/core/`): Testes de funcionalidade individual
- **Integration Tests** (`test/integration/`): Fluxo end-to-end completo
- **Fuzz Tests** (`test/fuzz/`): Invariantes críticos e edge cases

## 🔒 Segurança

### Auditoria
- Relatório completo de auditoria em [docs/RELATORIO_AUDITORIA_COMPLETO.md](docs/RELATORIO_AUDITORIA_COMPLETO.md)

### Checklist de Segurança
- ✅ Proteção contra reentrância (Checks-Effects-Interactions)
- ✅ Validações de entrada rigorosas
- ✅ Uso de bibliotecas auditadas (OpenZeppelin)
- ✅ Testes unitários e de integração
- ✅ Fuzzing de invariantes críticas
- ✅ Timelock para propostas executadas

### Como Reportar Vulnerabilidades

Se encontrar uma vulnerabilidade de segurança, **não a divulgue publicamente**. Entre em contato via:
- 📧 security@apoiaprotocol.dev (substitua pelo e-mail correto)
- 🔐 GPG key: [adicione a chave GPG se disponível]

## 📚 Documentação

Documentação técnica completa disponível em `docs/`:

- [Arquitetura Técnica](docs/04_ARQUITETURA_TECNICA.md) - Visão geral da arquitetura
- [Validação e Testes](docs/05_VALIDACAO_TESTES_AUDITORIA.md) - Estratégia de testes
- [Relatório de Auditoria](docs/RELATORIO_AUDITORIA_COMPLETO.md) - Resultados da auditoria
- [Relatório Técnico](docs/RelatorioTecnico.md) - Especificação técnica detalhada

### Diagrama de Dependências

```
CampaignFactory → Campaign → TierManager (NFTs)
                          → AGTToken (Vesting)
                          → ApoiaDAO (Governança)
                          → TreasuryDAO (Cofre)

StakingAGT → ApoiaDAO (Votação)
           → DAOMath (Cálculos)

AGTToken → VestingLib (Matemática)
        → ApoiaDAO (Votação)
```

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor siga o processo abaixo:

### 1. Fork e Clone

```bash
git clone https://github.com/seu-usuario/apoia-protocolo-web3.git
cd apoia-protocolo-web3
git checkout -b feature/sua-feature
```

### 2. Faça suas Alterações

```bash
# Crie novos contratos ou modifique os existentes
cd apoia-protocol
forge build
forge test
```

### 3. Commit e Push

```bash
git add .
git commit -m "feat: descrição clara da sua mudança"
git push origin feature/sua-feature
```

### 4. Pull Request

Abra um Pull Request com descrição clara do que foi modificado e por quê.

### Padrões de Código

- **Solidity**: Seguir estilo OpenZeppelin
- **Nomes**: `camelCase` para funções, `UPPER_CASE` para constantes
- **Comentários**: NatSpec para todas as funções públicas
- **Tests**: Cobertura mínima de 80%

## 📋 Roadmap

- [ ] Deploy em Ethereum Mainnet
- [ ] Deploy em Polygon
- [ ] Interface Web3 completa
- [ ] Suporte a múltiplas stablecoins
- [ ] Governança avançada (quadratic voting)
- [ ] Integração com DeFi protocols

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja [LICENSE](LICENSE) para detalhes.

## 👥 Autores

- **Apoia Protocol Team** - Desenvolvimento inicial
- Contribuidores: [adicione nomes de contribuidores]

## 🙏 Agradecimentos

- [OpenZeppelin](https://openzeppelin.com/) - Bibliotecas de contratos auditados
- [Foundry](https://book.getfoundry.sh/) - Framework de testes e desenvolvimento
- [Chainlink](https://chain.link/) - Price Feeds e oráculos descentralizados
- Community - Feedback e sugestões

## 📞 Contato e Suporte

- 🌐 Website: [adicione URL]
- 💬 Discord: [adicione link do Discord]
- 🐦 Twitter: [@apoiaprotocol](https://twitter.com/apoiaprotocol)
- 📧 Email: info@apoiaprotocol.dev

---

**Construído com ❤️ para descentralizar o crowdfunding**
