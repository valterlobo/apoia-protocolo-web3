# ⚡ Campaign Details - Quick Reference Card

## 🎯 Situação Atual

✅ **Funcionalidade:** Já implementada e funcionando  
📱 **Localização:** `apoia-protocol-frontend.html` (linhas 1620-1750)  
🔗 **Contrato:** Carrega via endereço de contrato on-chain  
🎨 **UI Status:** Completa, pronta para melhorias UX  

## 🚀 Início Rápido

### Usar Funcionalidade Atual (Sem Mudanças)
```html
<!-- Nada a fazer - já funciona! -->
1. Abrir frontend
2. Ir em Explore
3. Clicar em campanha on-chain
4. Detalhes carregam automaticamente
```

### Implementar Melhorias (5 minutos)
```html
<!-- Passo 1: Adicionar script -->
<script src="campaign-details-enhanced.js"></script>

<!-- Passo 2: Atualizar função viewCampaignDetails -->
if (onChain && onChain.address) {
    loadOnChainCampaignDetailsEnhanced(onChain.address);
}

<!-- Pronto! ✅ -->
```

## 📊 Fluxo de Carregamento

```
Click Campaign
      ↓
viewCampaignDetails(id)
      ↓
Is On-Chain? 
  ├─ YES → loadOnChainCampaignDetailsEnhanced(address)
  │         ├─ Conecta RPC
  │         ├─ Carrega config, raised, balance, status
  │         ├─ Exibe dados
  │         ├─ Chama loadOnChainTiersEnhanced()
  │         └─ Tiers aparecem com interação
  │
  └─ NO → loadCampaignDetailsForId(id)
           └─ Usa mock data
```

## 🎨 Componentes Principais

### 1. Campaign Details Screen
```
Título │ Status
Criador│ Caps
       │ Progresso
       │ Oracle Price
───────┴─────────────────
🔗 Contratos (NEW)
───────────────────────────
🎁 Tiers (INTERATIVO)
   🥉 Bronze (clicável)
   🥈 Prata ✓ (selecionado)
   🥇 Ouro (clicável)
───────────────────────────
📅 Datas
───────────────────────────
💰 Contribuição
   Valor: [Input]
   [Botão Contribuir]
```

### 2. Dados Carregados

| Fonte | Método | Retorno |
|-------|--------|---------|
| Campaign.config() | Tuple | softCap, hardCap, startTime, endTime, tierManager, ... |
| Campaign.totalRaisedUSD() | uint256 | Arrecadação em USD (8 decimais) |
| Campaign.balance() | uint256 | Saldo em ETH (wei) |
| Campaign.status() | uint8 | 0-5 (estado atual) |
| TierManager.getTierMetadata(id) | Tuple | name, minAmountUSD, maxSupply, minted, priceMode, ... |

### 3. Variáveis Globais

```javascript
currentCampaignAddress    // Endereço da campanha selecionada
currentCampaignTiers      // Array de tiers carregados
selectedTierId            // ID do tier selecionado
```

## 🔗 ABIs Utilizados

### Campaign (Read-Only)
```solidity
function config() external view returns (
    address proponente,
    uint256 softCap,
    uint256 hardCap,
    uint64 startTime,
    uint64 endTime,
    address tierManager,
    address agtToken,
    address treasuryDAO,
    address priceFeedETHUSD,
    uint16 platformFee
)

function totalRaisedUSD() external view returns (uint256)
function balance() external view returns (uint256)
function status() external view returns (uint8)
```

### TierManager (Read-Only)
```solidity
function totalTiers() external view returns (uint256)
function getTierMetadata(uint256 tierId) external view returns (
    uint256 id,
    string name,
    uint256 minAmountUSD,
    uint256 maxSupply,
    uint256 minted,
    uint8 priceMode,
    string metadataURI
)
```

## 🧪 Testes Rápidos

### Teste 1: Carregar Detalhes
```javascript
// Console
console.log(currentCampaignAddress);
console.log(currentCampaignTiers);
// Deve mostrar dados carregados
```

### Teste 2: Selecionar Tier
```javascript
selectTier(2);  // Seleciona tier 2
console.log(selectedTierId);  // Mostra 2
```

### Teste 3: Contribuir
```javascript
// 1. Selecionar tier
selectTier(2);

// 2. Preencher valor
document.getElementById('contributeAmount').value = '0.5';

// 3. Clicar botão
document.getElementById('contributeBtn').click();
```

## 📁 Arquivos Importantes

| Arquivo | Linhas | Propósito |
|---------|--------|----------|
| apoia-protocol-frontend.html | 1620-1750 | Implementação atual |
| campaign-details-enhanced.js | 350+ | Melhorias UX |
| contract-abis.json | - | ABIs para read calls |
| CAMPAIGN-DETAILS-INTEGRATION.md | 900+ | Docs técnica |
| IMPLEMENTATION-GUIDE-ENHANCED.md | 500+ | Guia passo-a-passo |

## 🐛 Troubleshooting Rápido

| Problema | Causa | Solução |
|----------|-------|---------|
| Tiers não aparecem | RPC offline | Verificar `rpcProvider` |
| Clique não funciona | Script não carregado | Importar `campaign-details-enhanced.js` |
| Erro "Invalid address" | Contrato não existe | Verificar endereço em Etherscan |
| Contribuição falha | Tier não selecionado | Clicar em um tier antes |
| Oracle price zerado | Chainlink feed offline | Verificar status feed |

## 🔐 Segurança

✅ Read-only ABIs (sem mutações)
✅ Validações de input
✅ Error handling
✅ Try-catch em async calls
✅ Sem armazenamento de chaves
✅ Links Etherscan com target="_blank"

## 📈 Performance

| Operação | Tempo | Notas |
|----------|-------|-------|
| Carregar campanha | 500-1000ms | Parallelizado com Promise.all |
| Carregar tiers | 500-1500ms | Depende de quantidade |
| Total | 1-2s | Aceitável para UX |

## 💡 Dicas

1. **Use `Promise.all()` para paralelizar** chamadas ao blockchain
2. **Valide sempre** o valor mínimo vs seleção de tier
3. **Mostre spinner** enquanto carrega dados
4. **Trate erros** com mensagens user-friendly
5. **Teste em mobile** antes de deployar

## 🎯 Checklist de Deployment

- [ ] Script `campaign-details-enhanced.js` incluído
- [ ] Função `viewCampaignDetails` atualizada
- [ ] ABIs verificadas em `contract-abis.json`
- [ ] RPC URL configurada para Sepolia
- [ ] MetaMask testado com campanha real
- [ ] Tiers carregam e selecionam
- [ ] Contribuição funciona end-to-end
- [ ] Mobile responsivo testado
- [ ] Feedback de usuário coletado

## 📚 Referências

| Recurso | Link |
|---------|------|
| ethers.js Docs | https://docs.ethers.org/v6/ |
| Sepolia Testnet | https://sepolia.etherscan.io |
| OpenZeppelin Contracts | https://docs.openzeppelin.com/ |
| Solidity Docs | https://docs.soliditylang.org/ |

## 🚀 Próximas Melhorias

- [ ] The Graph para performance
- [ ] Modal com detalhes do tier
- [ ] Histórico de contribuições
- [ ] Real-time updates
- [ ] IPFS metadata

## 📞 Contato & Suporte

Para questões:
1. Consulte `CAMPAIGN-DETAILS-INTEGRATION.md`
2. Verifique console (F12)
3. Teste em Sepolia
4. Valide ABIs

---

**Última Atualização:** 26/05/2026  
**Versão:** 1.0  
**Status:** ✅ PRONTO
