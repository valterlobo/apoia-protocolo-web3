# 🎁 GUIA COMPLETO: Criar Campanha com Tiers

**Data:** 26 de Maio de 2026  
**Status:** ✅ IMPLEMENTADO

---

## 📋 Índice

1. [Visão Geral](#-visão-geral)
2. [Como Usar](#-como-usar)
3. [Estrutura de Tiers](#-estrutura-de-tiers)
4. [Exemplos Práticos](#-exemplos-práticos)
5. [Validações](#-validações)
6. [Troubleshooting](#-troubleshooting)

---

## 🎯 Visão Geral

O novo sistema **`create-campaign-with-tiers.js`** permite criar campanhas de crowdfunding descentralizadas com tiers de recompensa personalizados. 

### Características Principais

✅ **Criação interativa** - Interface step-by-step  
✅ **Tiers personalizados** - Defina quantos quiser  
✅ **Validação automática** - Dados validados em tempo real  
✅ **Integração blockchain** - Comunica com smart contracts  
✅ **Templates pré-configurados** - Minimal, Standard, Premium, Elite  
✅ **Suporte a múltiplas moedas** - USD e ETH  
✅ **Bônus de recompensa** - Configure % de bônus por tier  

---

## 🚀 Como Usar

### 1. **Iniciar Criação de Campanha**

```javascript
// Chamar para iniciar o processo
initiateCampaignCreation();
```

Isso vai:
- Limpar o estado anterior
- Carregar tiers padrão (Bronze, Prata, Ouro)
- Navegar para a tela de criação
- Exibir notificação de início

### 2. **Preencher Informações Básicas**

```javascript
// Atualizar campos individuais
updateCampaignField('name', 'Meu Novo App');
updateCampaignField('description', 'Uma descrição detalhada...');
updateCampaignField('category', 'Tecnologia');
updateCampaignField('softCapETH', 1.0);
updateCampaignField('hardCapETH', 5.0);
```

**Campos Obrigatórios:**
| Campo | Tipo | Validação |
|-------|------|-----------|
| `name` | String | Min. 3 caracteres |
| `description` | String | Min. 20 caracteres |
| `category` | String | Seleção obrigatória |
| `softCapETH` | Number | > 0 |
| `hardCapETH` | Number | > softCapETH |
| `startDate` | Date | Futuro, antes do fim |
| `endDate` | Date | Mín. 7 dias após início |

### 3. **Gerenciar Tiers**

#### Usar Template Pré-configurado

```javascript
// Opções: 'minimal', 'standard', 'premium', 'elite'
loadTierTemplate('premium');
```

**Templates Disponíveis:**

| Template | Tiers | Uso |
|----------|-------|-----|
| `minimal` | Bronze, Prata | Campanhas pequenas |
| `standard` | Bronze, Prata, Ouro | Campanhas médias |
| `premium` | Bronze, Prata, Ouro, Diamante | Campanhas grandes |
| `elite` | Bronze, Prata, Ouro, Diamante, VIP | Campanhas exclusivas |

#### Adicionar Tier Customizado

```javascript
// Via interface (usuário preenche form)
openTiersModal();
addTierToList(); // Após preencher campos

// Via código
const newTier = {
    id: 4,
    name: '💰 Patrono',
    minAmountUSD: 5000,
    bonus: 30,
    maxSupply: 50,
    color: '#ff6b6b',
    icon: '💰',
    priceMode: 0 // 0 = fixo USD, 1 = dinâmico ETH
};
campaignCreationState.tiers.push(newTier);
updateCreateCampaignUI();
```

#### Editar Tier Existente

```javascript
// Abre prompt para editar
editTier(0); // Índice do tier

// Campos editáveis:
// - Nome
// - Valor mínimo (USD)
// - Bônus (%)
// - Supply máximo
```

#### Remover Tier

```javascript
removeTier(0); // Índice do tier
```

**Restrições:**
- Mínimo 1 tier obrigatório
- Valores devem ser crescentes
- Último tier não pode ser removido sozinho

---

## 🎁 Estrutura de Tiers

### Tier Padrão

```javascript
{
    id: 1,                          // ID único
    name: '🥉 Bronze',              // Nome com ícone
    minAmountUSD: 50,               // Valor mínimo em USD
    bonus: 5,                       // Bônus em % (AGT token)
    maxSupply: 1000,                // Máximo de slots
    color: '#cd7f32',               // Cor hex
    icon: '🥉',                     // Ícone emoji
    priceMode: 0                    // 0=USD fixo, 1=ETH dinâmico
}
```

### Tiers Pré-configurados

| Nome | Ícone | Min. USD | Bônus | Slots |
|------|-------|----------|-------|-------|
| Bronze | 🥉 | $50 | 5% | 1000 |
| Prata | 🥈 | $500 | 10% | 500 |
| Ouro | 🥇 | $2.500 | 15% | 100 |
| Diamante | 💎 | $10.000 | 25% | 10 |
| VIP | 👑 | $50.000 | 50% | 1 |

---

## 📚 Exemplos Práticos

### Exemplo 1: Campanha de Educação Simples

```javascript
// Iniciar
initiateCampaignCreation();

// Preencher dados
updateCampaignField('name', 'Plataforma de Educação Online');
updateCampaignField('description', 'Desenvolver uma plataforma completa de educação online com certificações reconhecidas internacionalmente, com foco em tecnologia e empreendedorismo.');
updateCampaignField('category', 'Educação');
updateCampaignField('softCapETH', 0.5);
updateCampaignField('hardCapETH', 2.0);

// Usar template standard
loadTierTemplate('standard');

// Criar
createCampaignOnBlockchain();
```

### Exemplo 2: Campanha de Startup VIP

```javascript
initiateCampaignCreation();

updateCampaignField('name', 'StartUp inovadora - Série A');
updateCampaignField('description', 'Solução revolucionária para e-commerce com IA. Buscamos investidores para série A.');
updateCampaignField('category', 'Tecnologia');
updateCampaignField('softCapETH', 5.0);
updateCampaignField('hardCapETH', 20.0);

// Usar template elite
loadTierTemplate('elite');

// Customizar tiers
editTier(0); // Bronze
editTier(1); // Prata
// etc...

createCampaignOnBlockchain();
```

### Exemplo 3: Campanha com Tiers Totalmente Customizados

```javascript
initiateCampaignCreation();

// Limpar tiers padrão
campaignCreationState.tiers = [];

// Adicionar tiers customizados
const customTiers = [
    {
        id: 1,
        name: '🎫 Early Bird',
        minAmountUSD: 25,
        bonus: 50,
        maxSupply: 500,
        color: '#60a5fa',
        icon: '🎫',
        priceMode: 0
    },
    {
        id: 2,
        name: '🌟 Super Fan',
        minAmountUSD: 250,
        bonus: 100,
        maxSupply: 100,
        color: '#fbbf24',
        icon: '🌟',
        priceMode: 0
    },
    {
        id: 3,
        name: '👑 Legendary',
        minAmountUSD: 5000,
        bonus: 500,
        maxSupply: 5,
        color: '#ec4899',
        icon: '👑',
        priceMode: 0
    }
];

campaignCreationState.tiers = customTiers;
updateCreateCampaignUI();

// Preencher outros dados
updateCampaignField('name', 'Projeto Exclusivo');
updateCampaignField('description', 'Acesso exclusivo a conteúdo privado...');
updateCampaignField('category', 'Arte & Cultura');
updateCampaignField('softCapETH', 2.0);
updateCampaignField('hardCapETH', 10.0);

createCampaignOnBlockchain();
```

---

## ✅ Validações

### Validação Automática

O sistema valida automaticamente ao tentar criar:

```javascript
const validation = validateCampaignData();
// Retorna: { isValid: boolean, errors: array }
```

### Regras de Validação

| Campo | Regra |
|-------|-------|
| Nome | Min. 3 caracteres |
| Descrição | Min. 20 caracteres |
| Soft Cap | > 0 ETH |
| Hard Cap | > Soft Cap |
| Datas | Min. 7 dias de intervalo |
| Data Início | Deve ser futura |
| Tiers | Min. 1, valores crescentes |

### Exemplo de Validação

```javascript
const validation = validateCampaignData();

if (!validation.isValid) {
    validation.errors.forEach(error => {
        console.error(error);
        // ❌ Nome da campanha deve ter pelo menos 3 caracteres
        // ❌ Soft Cap deve ser menor que Hard Cap
        // ❌ Você deve configurar pelo menos 1 tier
    });
} else {
    console.log('✅ Todos os dados estão válidos!');
    createCampaignOnBlockchain();
}
```

---

## 📊 Fluxo de Criação

```
┌─────────────────────────────────────┐
│   1. INICIAR CRIAÇÃO               │
│   initiateCampaignCreation()        │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   2. PREENCHER INFORMAÇÕES BÁSICAS  │
│   - Nome, descrição, categoria      │
│   - Soft Cap, Hard Cap              │
│   - Datas início e fim              │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   3. GERENCIAR TIERS               │
│   - Usar template OU                │
│   - Adicionar tiers customizados    │
│   - Editar/remover conforme needed  │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   4. REVISAR & VALIDAR             │
│   getCampaignSummary()              │
│   validateCampaignData()            │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   5. CRIAR NO BLOCKCHAIN           │
│   createCampaignOnBlockchain()      │
│   - Conectar carteira               │
│   - Enviar transação                │
│   - Criar tiers no TierManager      │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   ✅ CAMPANHA CRIADA!              │
│   - Endereço salvo                  │
│   - Tiers configurados              │
│   - Pronta para votação DAO         │
└─────────────────────────────────────┘
```

---

## 🔧 Troubleshooting

### Problema: "Carteira não conectada"

```javascript
// Solução: Conectar MetaMask primeiro
await connectWallet(); // Função do web3-integration.js
```

### Problema: "Transação rejeitada"

**Causas possíveis:**
- Carteira sem ETH suficiente
- Dados inválidos (validar com `validateCampaignData()`)
- Rede incorreta (verificar se está em Sepolia)

```javascript
// Verificar e reconectar
if (!signer) {
    await connectWallet();
}

// Validar dados novamente
const validation = validateCampaignData();
if (!validation.isValid) {
    console.error('Erros:', validation.errors);
    return;
}
```

### Problema: "Erro ao criar tiers"

```javascript
// Verificar endereço do TierManager
console.log('TierManager:', campaignCreationState.tierManagerAddress);

// Validar ABI do TierManager
console.log('ABI disponível?', ABI_TIER_MANAGER_WRITE ? '✅' : '❌');
```

### Problema: "Tiers em ordem incorreta"

```javascript
// Verificar ordem dos tiers
campaignCreationState.tiers.forEach((tier, i) => {
    console.log(`${i}: ${tier.name} - $${tier.minAmountUSD}`);
    // 0: 🥉 Bronze - $50
    // 1: 🥈 Prata - $500
    // 2: 🥇 Ouro - $2500
    // ✅ Crescente!
});

// Se não estiver em ordem, ordenar
campaignCreationState.tiers.sort((a, b) => 
    a.minAmountUSD - b.minAmountUSD
);
```

---

## 🔌 Integração com HTML

### Incluir o script

```html
<!-- Após web3-integration.js -->
<script src="create-campaign-with-tiers.js"></script>
```

### Botões de Acionamento

```html
<!-- Botão para iniciar criação -->
<button onclick="initiateCampaignCreation()">
    ✨ Criar Nova Campanha
</button>

<!-- Botão para personalizar tiers -->
<button onclick="openTiersModal()" id="customizeTiersBtn">
    🎨 Personalizar Tiers
</button>

<!-- Botão para criar -->
<button onclick="createCampaignOnBlockchain()" id="createCampaignBtn">
    🚀 Criar Campanha
</button>
```

### Formulários Necessários

```html
<!-- Informações Básicas -->
<input type="text" id="campaignNameInput" placeholder="Nome">
<textarea id="campaignDescInput" placeholder="Descrição"></textarea>
<select id="categorySelect">
    <option value="Educação">Educação</option>
    <option value="Tecnologia">Tecnologia</option>
    <option value="Saúde">Saúde</option>
    <!-- ... -->
</select>

<!-- Financeiro -->
<input type="number" id="softCapInput" placeholder="Soft Cap (ETH)">
<input type="number" id="hardCapInput" placeholder="Hard Cap (ETH)">

<!-- Datas -->
<input type="datetime-local" id="startDateInput">
<input type="datetime-local" id="endDateInput">

<!-- Tiers -->
<div id="tiersContainer"></div>
<div id="tiersListModal"></div>

<!-- Modal de Tiers -->
<div class="modal" id="tiersModal">
    <input type="text" id="tierNameInput" placeholder="Nome">
    <input type="number" id="tierMinAmountInput" placeholder="Min USD">
    <input type="number" id="tierBonusInput" placeholder="Bônus %">
</div>

<!-- Status -->
<div id="createStatus"></div>
```

---

## 📝 Resumo de Funções

| Função | Descrição | Retorno |
|--------|-----------|---------|
| `initiateCampaignCreation()` | Inicia processo | void |
| `updateCampaignField(field, value)` | Atualiza campo | void |
| `addTierToList()` | Adiciona tier (UI) | void |
| `editTier(index)` | Edita tier | void |
| `removeTier(index)` | Remove tier | void |
| `loadTierTemplate(name)` | Carrega template | void |
| `validateCampaignData()` | Valida dados | {isValid, errors} |
| `getCampaignSummary()` | Retorna resumo | Object |
| `createCampaignOnBlockchain()` | Cria no blockchain | Promise |
| `openTiersModal()` | Abre modal | void |
| `closeTiersModal()` | Fecha modal | void |

---

## 🎯 Próximos Passos

- [ ] Testar em Sepolia testnet
- [ ] Adicionar suporte a upload de imagem de capa
- [ ] Implementar histórico de versões de tiers
- [ ] Adicionar sistema de rascunhos
- [ ] Pré-visualização de campanha

---

**Criado em:** 26 de Maio de 2026  
**Última atualização:** 26 de Maio de 2026  
**Versão:** 1.0.0
