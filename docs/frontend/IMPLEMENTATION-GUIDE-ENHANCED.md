# Guia de Implementação - Campaign Details com Tiers Interativos

## 📋 Resumo das Melhorias

Este guia descreve como implementar as melhorias no sistema de detalhes de campanhas on-chain com seleção interativa de Tiers.

**Versão:** 1.0  
**Data:** 26/05/2026  
**Status:** ✅ PRONTO PARA INTEGRAÇÃO

## 🎯 Melhorias Implementadas

### 1. **Armazenamento de Tiers em Memória**
- **Arquivo:** `campaign-details-enhanced.js` (linha 7-9)
- **Benefício:** Permite acesso rápido aos dados dos tiers sem nova consulta
- **Uso:** `currentCampaignTiers` array armazena tiers carregados

```javascript
let currentCampaignAddress = null;
let currentCampaignTiers = [];
let selectedTierId = null;
```

### 2. **Exibição de Endereços de Contratos**
- **Função:** `addContractAddressDisplay()`
- **Benefício:** Mostra links para Etherscan com endereços on-chain
- **Localização:** Acima da seção de Tiers
- **Links:** Campaign Contract + TierManager Contract

```
🔗 Contratos Inteligentes
├─ Contrato da Campanha: 0x1234...5678 [Link Etherscan]
└─ Gerenciador de Tiers: 0xabcd...efgh [Link Etherscan]
```

### 3. **Seleção Interativa de Tiers**
- **Função:** `selectTier(tierId)`
- **Comportamento:**
  - Clique em um tier destaca-o
  - Borda verde (#10b981) aparece
  - Background muda para verde translúcido
  - Input de quantidade atualiza com valor mínimo

```
Antes: Tiers como somente-leitura
Depois: Tiers clicáveis com feedback visual
```

### 4. **Barra de Preenchimento de Tiers**
- **Localização:** Dentro de cada card de tier
- **Calcula:** `(minted / maxSupply) * 100%`
- **Cor:** Mesma cor do tier
- **Update:** Recalculado a cada carregamento

```
┌─ Prata 🥈 ─────────────────┐
│ Mínimo: $500 USD           │
│ Supply: 25/50              │
│ ▓▓▓▓▓░░░░░░░░░░░░░░░░░░ 50%│
└────────────────────────────┘
```

### 5. **Indicador de Seleção**
- **Classe:** `.tier-selection-indicator`
- **Exibição:** Mostra "✓ Selecionado" quando tier é selecionado
- **Cor:** Mesma cor do tier selecionado
- **Estado:** Inicialmente hidden, aparece ao selecionar

### 6. **Contribuição com Tier Selecionado**
- **Função:** `contributeToCampaignWithTierSelection()`
- **Validações:**
  - ✓ Wallet conectada
  - ✓ Valor > 0
  - ✓ Tier selecionado
- **Feedback:** Exibe nome do tier, valor e hash da tx

### 7. **Detalhes Expandidos do Tier**
- **Função:** `showTierDetails(tierId)`
- **Informações:**
  - Nome e ícone
  - Valor mínimo (USD)
  - Modo de preço (Fixo/Dinâmico)
  - Supply (minted/max)
  - Percentual de preenchimento
  - Barra visual de progresso

## 🔧 Como Implementar

### Passo 1: Incluir Script de Melhorias

No seu arquivo `apoia-protocol-frontend.html`, adicione antes do fechamento da tag `</body>`:

```html
<!-- Script de melhorias para Campaign Details -->
<script src="campaign-details-enhanced.js"></script>
```

### Passo 2: Atualizar Função de Navegação

Localize a função `viewCampaignDetails()` e substitua por esta versão melhorada:

```javascript
function viewCampaignDetails(campaignId) {
    // Switch to details screen
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-screen="details"]').classList.add('active');
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('details').classList.add('active');

    // Verificar se é uma campanha on-chain
    const onChain = onChainCampaigns.find(c => c.id === campaignId);
    if (onChain && onChain.address) {
        loadOnChainCampaignDetailsEnhanced(onChain.address);  // ← USE VERSÃO MELHORADA
    } else {
        loadCampaignDetailsForId(campaignId);
    }
}
```

### Passo 3: Remover Função Antiga (Opcional)

Se desejar, pode remover a função antiga `loadOnChainCampaignDetails()` e `loadOnChainTiers()`, ou mantê-las como fallback.

## 📊 Estrutura de Dados dos Tiers

```javascript
// Estrutura armazenada em currentCampaignTiers
{
    id: 1,                        // ID único do tier
    name: "Prata",                // Nome do tier
    minAmountUSD: 500,            // Valor mínimo em USD
    maxSupply: 50,                // Supply máximo (0 = ilimitado)
    minted: 25,                   // Já cunhados
    priceMode: 0,                 // 0 = Fixo (USD), 1 = Dinâmico (ETH)
    color: "#fbbf24",             // Cor hexadecimal
    icon: "🥈",                   // Emoji do tier
    fillPercentage: 50            // % preenchido (minted/maxSupply)
}
```

## 🎨 Estilos CSS Recomendados

Se você quiser adicionar CSS customizado, inclua:

```css
/* Tier Cards - Estado Selecionado */
.tier-card {
    cursor: pointer;
    transition: all 0.3s ease;
}

.tier-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.tier-card[data-selected="true"] {
    border: 3px solid #10b981 !important;
    background-color: rgba(16, 185, 129, 0.1) !important;
}

/* Indicador de Seleção */
.tier-selection-indicator {
    animation: slideIn 0.3s ease;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(-5px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
```

## 🧪 Testes de Validação

### Teste 1: Carregamento com Armazenamento
```javascript
// Em console, após carregar campanha:
console.log(currentCampaignTiers);
// Deve retornar array com tiers carregados
```

### Teste 2: Seleção de Tier
```javascript
// Clicar em um tier e verificar:
console.log(selectedTierId);          // Deve mostrar ID do tier
console.log(currentCampaignAddress);  // Deve mostrar endereço
```

### Teste 3: Contribuição
```javascript
// Após selecionar tier e preencher valor:
// Clicar "Contribuir para Campanha"
// Verificar:
// ✓ Wallet conectada
// ✓ Transação enviada
// ✓ Feedback exibe nome do tier
```

### Teste 4: Endereços de Contrato
```javascript
// Verificar se aparecem links para:
// ✓ Campaign Contract (clicável, leva a Etherscan)
// ✓ TierManager Contract (clicável, leva a Etherscan)
```

## 📱 Responsividade

As melhorias são totalmente responsivas:

### Desktop (>768px)
- Tiers exibidos em grid 3 colunas
- Espaçamento otimizado
- Hovers funcionam

### Tablet (768px)
- Tiers em grid 2 colunas
- Cliques funcionam normalmente

### Mobile (<480px)
- Tiers em 1 coluna
- Touch-friendly (sem hover)
- Seleção visual clara

## 🔐 Segurança

### Validações Implementadas
✓ Wallet conectada antes de contribuir  
✓ Valor > 0 validado  
✓ Tier selecionado obrigatório  
✓ Endereços validados pelo ethers.js  
✓ Erro handling com feedback ao usuário  

### Boas Práticas
✓ ABI read-only para consultas  
✓ Sem armazenamento local de chaves privadas  
✓ Transações assináveis antes de executar  
✓ Links Etherscan com target="_blank"  

## 🚀 Roadmap de Melhorias Futuras

### Phase 2.1
- [ ] Modal expandido com detalhes do tier
- [ ] Histórico de contribuições do usuário
- [ ] Gráfico de distribuição de tiers
- [ ] Filtro por preço de tier

### Phase 2.2
- [ ] IPFS metadata para tiers
- [ ] Customização de ícones do tier
- [ ] Animação de progresso de preenchimento
- [ ] Notificação quando tier está cheio

### Phase 2.3
- [ ] The Graph para melhor performance
- [ ] Caching de dados
- [ ] Sincronização automática de tiers
- [ ] Real-time updates com WebSocket

## 📝 Checklist de Integração

- [ ] Script `campaign-details-enhanced.js` criado
- [ ] Script importado no HTML
- [ ] Função `viewCampaignDetails()` atualizada
- [ ] Funções antigas mantidas como fallback ou removidas
- [ ] Testes básicos executados
- [ ] Testes em mobile executados
- [ ] CSS customizado aplicado (se desejado)
- [ ] Documentação compartilhada com time
- [ ] Deployment em Sepolia testnet
- [ ] Feedback de usuários coletado

## 📚 Documentação Relacionada

- [CAMPAIGN-DETAILS-INTEGRATION.md](CAMPAIGN-DETAILS-INTEGRATION.md) - Documentação técnica completa
- [FRONTEND-GUIDE.md](FRONTEND-GUIDE.md) - Guia geral de integração
- [QUICK-START.html](QUICK-START.html) - Exemplos interativos
- [campaign-details-enhanced.js](campaign-details-enhanced.js) - Código-fonte das melhorias

## 💡 Exemplos de Uso

### Exemplo 1: Selecionar Tier e Contribuir
```javascript
// 1. Usuário clica em Explore → campanha on-chain
// 2. Clica em "Ver Detalhes"
// 3. Tela muda para Details
// 4. Tiers são carregados e exibidos
// 5. Usuário clica em "Prata" (tier 2)
// 6. Tier fica destacado em verde
// 7. Input de valor atualiza para $500 USD mínimo
// 8. Usuário digita 0.25 ETH (maior que mínimo)
// 9. Clica "Contribuir para Campanha"
// 10. Wallet abre para assinatura
// 11. Transação confirmada com feedback
```

### Exemplo 2: Visualizar Detalhes do Tier
```javascript
// Código JavaScript para usar showTierDetails():
const tierId = 2;
const tierDetailsHTML = showTierDetails(tierId);
console.log(tierDetailsHTML);

// Resultado:
// <div style="...">
//   <h3>🥈 Prata</h3>
//   Valor Mínimo: $500 USD
//   Modo: Fixo
//   Supply: 25/50
//   Preenchimento: 50%
//   [Barra de progresso]
// </div>
```

## 🆘 Troubleshooting

### Problema: Tiers não aparecem após melhorias
**Solução:** Verificar console para erros, confirmar que `ABI_TIER_MANAGER_READ` está definido

### Problema: Clique em tier não funciona
**Solução:** Confirmar que `selectTier()` está definida no escopo global

### Problema: Contribuição com tier falha
**Solução:** 
1. Verificar se `selectedTierId` está setado
2. Confirmar que valor > minAmountUSD do tier
3. Testar com MetaMask conectada

### Problema: Links Etherscan não funcionam
**Solução:** Verificar que endereços estão no formato correto (checksummed)

## 📞 Suporte

Para questões ou problemas:
1. Consulte [CAMPAIGN-DETAILS-INTEGRATION.md](CAMPAIGN-DETAILS-INTEGRATION.md)
2. Verifique console do navegador (F12)
3. Teste em Sepolia testnet
4. Valide ABIs em contract-abis.json

---

**Última Atualização:** 26/05/2026  
**Versão:** 1.0  
**Pronto para Produção:** ✅ SIM
