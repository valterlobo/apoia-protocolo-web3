// ============================================
// CREATE CAMPAIGN WITH TIERS - COMPLETE SYSTEM
// Sistema completo para criar campanhas com tiers personalizados
// ============================================

/**
 * ESTADO GLOBAL DE CRIAÇÃO DE CAMPANHA
 */
let campaignCreationState = {
    step: 1,
    campaignData: {
        name: '',
        description: '',
        category: '',
        softCapETH: 0,
        hardCapETH: 0,
        startDate: null,
        endDate: null,
        baseURI: 'ipfs://QmDefaultURI/'
    },
    tiers: [],
    isValid: false
};

/**
 * MODELOS DE TIERS PRÉ-CONFIGURADOS
 */
const TIER_TEMPLATES = {
    bronze: { name: '🥉 Bronze', minUSD: 50, bonus: 5, maxSupply: 1000, icon: '🥉' },
    silver: { name: '🥈 Prata', minUSD: 500, bonus: 10, maxSupply: 500, icon: '🥈' },
    gold: { name: '🥇 Ouro', minUSD: 2500, bonus: 15, maxSupply: 100, icon: '🥇' },
    diamond: { name: '💎 Diamante', minUSD: 10000, bonus: 25, maxSupply: 10, icon: '💎' },
    vip: { name: '👑 VIP', minUSD: 50000, bonus: 50, maxSupply: 1, icon: '👑' }
};

const TIER_COLORS = {
    bronze: '#cd7f32',
    silver: '#c0c0c0',
    gold: '#ffd700',
    diamond: '#00d4ff',
    vip: '#ff1493',
    custom1: '#60a5fa',
    custom2: '#8b5cf6',
    custom3: '#10b981',
    custom4: '#f97316',
    custom5: '#ec4899'
};

const CAMPAIGN_FACTORY_WRITE_ABI = [
    "function createCampaign(uint256 softCap, uint256 hardCap, uint64 startTime, uint64 endTime, string calldata baseURI, address priceFeed) external returns (address campaign, address tierMgr)",
    "event CampaignCreated(address indexed campaign, address indexed tierManager, address indexed creator, uint256 timestamp)"
];

const CAMPAIGN_WRITE_ABI = [
    "function createTier(string calldata name, uint256 minAmountUSD, uint256 maxSupply, uint8 priceMode, string calldata metadataURI) external returns (uint256)"
];

// ============================================
// FUNÇÕES DE INICIALIZAÇÃO
// ============================================

/**
 * Inicializa o sistema de criação de campanha
 */
function initiateCampaignCreation() {
    console.log('🚀 Iniciando criação de campanha...');
    
    // Limpar estado anterior
    campaignCreationState = {
        step: 1,
        campaignData: {
            name: '',
            description: '',
            category: '',
            softCapETH: 0,
            hardCapETH: 0,
            startDate: null,
            endDate: null,
            baseURI: 'ipfs://QmDefaultURI/'
        },
        tiers: [],
        isValid: false
    };

    // Usar tiers padrão como base
    addDefaultTiers();
    
    // Atualizar interface
    updateCreateCampaignUI();
    
    // Navegar para tela de criação
    switchScreen('create');
    
    showNotification('📋 Preencha as informações básicas da campanha', 'info');
}

/**
 * Adiciona os tiers padrão (Bronze, Prata, Ouro)
 */
function addDefaultTiers() {
    // Bronze
    campaignCreationState.tiers.push({
        id: 1,
        name: TIER_TEMPLATES.bronze.name,
        minAmountUSD: TIER_TEMPLATES.bronze.minUSD,
        bonus: TIER_TEMPLATES.bronze.bonus,
        maxSupply: TIER_TEMPLATES.bronze.maxSupply,
        color: TIER_COLORS.bronze,
        icon: TIER_TEMPLATES.bronze.icon,
        priceMode: 0 // Fixo em USD
    });

    // Prata
    campaignCreationState.tiers.push({
        id: 2,
        name: TIER_TEMPLATES.silver.name,
        minAmountUSD: TIER_TEMPLATES.silver.minUSD,
        bonus: TIER_TEMPLATES.silver.bonus,
        maxSupply: TIER_TEMPLATES.silver.maxSupply,
        color: TIER_COLORS.silver,
        icon: TIER_TEMPLATES.silver.icon,
        priceMode: 0
    });

    // Ouro
    campaignCreationState.tiers.push({
        id: 3,
        name: TIER_TEMPLATES.gold.name,
        minAmountUSD: TIER_TEMPLATES.gold.minUSD,
        bonus: TIER_TEMPLATES.gold.bonus,
        maxSupply: TIER_TEMPLATES.gold.maxSupply,
        color: TIER_COLORS.gold,
        icon: TIER_TEMPLATES.gold.icon,
        priceMode: 0
    });
}

/**
 * Atualiza a interface de criação de campanha
 */
function updateCreateCampaignUI() {
    const tiersContainer = document.getElementById('tiersContainer');
    if (!tiersContainer) return;

    let html = '';
    campaignCreationState.tiers.forEach((tier, index) => {
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(148, 163, 184, 0.1);">
                <span>${tier.icon} ${tier.name}</span>
                <span style="font-size: 12px; color: #94a3b8;">
                    $${tier.minAmountUSD.toFixed(2)} USD+ | +${tier.bonus}% bonus | ${tier.maxSupply} slots
                </span>
                <button class="btn btn-sm" onclick="editTier(${index})" style="padding: 4px 12px; font-size: 11px;">
                    ✏️ Editar
                </button>
                <button class="btn btn-sm" onclick="removeTier(${index})" style="padding: 4px 12px; font-size: 11px; background: #ef4444; border-color: #ef4444; color: white;">
                    🗑️ Remover
                </button>
            </div>
        `;
    });

    tiersContainer.innerHTML = html || '<div style="color: #94a3b8;">Nenhum tier configurado</div>';
}

// ============================================
// FUNÇÕES DE VALIDAÇÃO
// ============================================

/**
 * Valida os dados da campanha antes da criação
 * @returns {Object} { isValid: boolean, errors: array }
 */
function validateCampaignData() {
    const errors = [];
    const data = campaignCreationState.campaignData;

    // Validar informações básicas
    if (!data.name || data.name.trim().length < 3) {
        errors.push('❌ Nome da campanha deve ter pelo menos 3 caracteres');
    }

    if (!data.description || data.description.trim().length < 20) {
        errors.push('❌ Descrição deve ter pelo menos 20 caracteres');
    }

    if (!data.category || data.category === '') {
        errors.push('❌ Categoria é obrigatória');
    }

    // Validar valores financeiros
    if (!data.softCapETH || data.softCapETH <= 0) {
        errors.push('❌ Soft Cap deve ser maior que 0 ETH');
    }

    if (!data.hardCapETH || data.hardCapETH <= 0) {
        errors.push('❌ Hard Cap deve ser maior que 0 ETH');
    }

    if (data.softCapETH >= data.hardCapETH) {
        errors.push('❌ Soft Cap deve ser menor que Hard Cap');
    }

    // Validar datas
    if (!data.startDate || !data.endDate) {
        errors.push('❌ Data de início e encerramento são obrigatórias');
    }

    if (data.startDate && data.endDate && data.startDate >= data.endDate) {
        errors.push('❌ Data de início deve ser antes do encerramento');
    }

    // Validar que o intervalo mínimo é de 7 dias
    if (data.startDate && data.endDate) {
        const timeDiff = (data.endDate - data.startDate) / (1000 * 60 * 60 * 24);
        if (timeDiff < 7) {
            errors.push('❌ Intervalo mínimo entre datas é de 7 dias');
        }
    }

    // Validar que datas não são retroativas
    if (data.startDate && data.startDate < new Date()) {
        errors.push('❌ Data de início não pode ser retroativa');
    }

    // Validar tiers
    if (campaignCreationState.tiers.length === 0) {
        errors.push('❌ Você deve configurar pelo menos 1 tier');
    }

    // Validar que tiers estão em ordem crescente
    for (let i = 1; i < campaignCreationState.tiers.length; i++) {
        if (campaignCreationState.tiers[i].minAmountUSD <= campaignCreationState.tiers[i - 1].minAmountUSD) {
            errors.push('❌ Os valores mínimos dos tiers devem ser crescentes');
        }
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// ============================================
// FUNÇÕES DE GERENCIAMENTO DE TIERS
// ============================================

/**
 * Abre o modal de personalização de tiers
 */
function openTiersModal() {
    const modal = document.getElementById('tiersModal');
    if (modal) {
        modal.classList.add('active');
        console.log('✅ Modal de tiers aberto');
    }
}

/**
 * Fecha o modal de personalização de tiers
 */
function closeTiersModal() {
    const modal = document.getElementById('tiersModal');
    if (modal) {
        modal.classList.remove('active');
        console.log('✅ Modal de tiers fechado');
    }
}

/**
 * Adiciona um novo tier à lista
 */
function addTierToList() {
    const nameInput = document.getElementById('tierNameInput');
    const minAmountInput = document.getElementById('tierMinAmountInput');
    const bonusInput = document.getElementById('tierBonusInput');

    // Validar inputs
    if (!nameInput.value || !minAmountInput.value) {
        showNotification('⚠️ Preencha todos os campos obrigatórios', 'error');
        return;
    }

    const newTier = {
        id: campaignCreationState.tiers.length + 1,
        name: nameInput.value,
        minAmountUSD: parseFloat(minAmountInput.value),
        bonus: parseFloat(bonusInput.value) || 10,
        maxSupply: 1000, // Padrão
        color: TIER_COLORS[`custom${Math.min(5, campaignCreationState.tiers.length % 5)}`],
        icon: ['🥉', '🥈', '🥇', '💎', '👑'][campaignCreationState.tiers.length % 5],
        priceMode: 0
    };

    // Validar se o valor mínimo é maior que o tier anterior
    if (campaignCreationState.tiers.length > 0) {
        const lastTier = campaignCreationState.tiers[campaignCreationState.tiers.length - 1];
        if (newTier.minAmountUSD <= lastTier.minAmountUSD) {
            showNotification('⚠️ O valor mínimo deve ser maior que o tier anterior', 'error');
            return;
        }
    }

    campaignCreationState.tiers.push(newTier);
    updateCreateCampaignUI();

    // Limpar inputs
    nameInput.value = '';
    minAmountInput.value = '';
    bonusInput.value = '10';

    showNotification(`✅ Tier "${newTier.name}" adicionado com sucesso!`, 'success');
    console.log('📌 Tiers atualizados:', campaignCreationState.tiers);
}

/**
 * Edita um tier existente
 * @param {number} index - Índice do tier na lista
 */
function editTier(index) {
    const tier = campaignCreationState.tiers[index];
    if (!tier) return;

    const newName = prompt(`Editar nome do tier (atual: ${tier.name}):`, tier.name);
    if (!newName) return;

    const newMinUSD = prompt(`Editar valor mínimo em USD (atual: ${tier.minAmountUSD}):`, tier.minAmountUSD);
    if (!newMinUSD) return;

    const newBonus = prompt(`Editar bônus % (atual: ${tier.bonus}):`, tier.bonus);
    if (!newBonus) return;

    const newMaxSupply = prompt(`Editar supply máximo (atual: ${tier.maxSupply}):`, tier.maxSupply);
    if (!newMaxSupply) return;

    // Validar novo valor mínimo
    const minUSDValue = parseFloat(newMinUSD);
    if (index > 0 && minUSDValue <= campaignCreationState.tiers[index - 1].minAmountUSD) {
        showNotification('⚠️ O valor deve ser maior que o tier anterior', 'error');
        return;
    }
    if (index < campaignCreationState.tiers.length - 1 && minUSDValue >= campaignCreationState.tiers[index + 1].minAmountUSD) {
        showNotification('⚠️ O valor deve ser menor que o próximo tier', 'error');
        return;
    }

    campaignCreationState.tiers[index] = {
        ...tier,
        name: newName,
        minAmountUSD: minUSDValue,
        bonus: parseFloat(newBonus),
        maxSupply: parseInt(newMaxSupply)
    };

    updateCreateCampaignUI();
    showNotification(`✅ Tier atualizado com sucesso!`, 'success');
    console.log('📌 Tier editado:', campaignCreationState.tiers[index]);
}

/**
 * Remove um tier da lista
 * @param {number} index - Índice do tier na lista
 */
function removeTier(index) {
    if (campaignCreationState.tiers.length <= 1) {
        showNotification('⚠️ Você deve manter pelo menos 1 tier', 'error');
        return;
    }

    const tierName = campaignCreationState.tiers[index].name;
    if (confirm(`Tem certeza que deseja remover "${tierName}"?`)) {
        campaignCreationState.tiers.splice(index, 1);
        updateCreateCampaignUI();
        showNotification(`✅ Tier removido com sucesso!`, 'success');
        console.log('📌 Tiers atualizados:', campaignCreationState.tiers);
    }
}

/**
 * Carrega tiers pré-configurados
 * @param {string} templateName - Nome do template (bronze, silver, gold, diamond, vip)
 */
function loadTierTemplate(templateName) {
    campaignCreationState.tiers = [];
    
    const templates = {
        minimal: ['bronze', 'silver'],
        standard: ['bronze', 'silver', 'gold'],
        premium: ['bronze', 'silver', 'gold', 'diamond'],
        elite: ['bronze', 'silver', 'gold', 'diamond', 'vip']
    };

    if (!templates[templateName]) {
        showNotification('⚠️ Template inválido', 'error');
        return;
    }

    let tierId = 1;
    templates[templateName].forEach(tierKey => {
        const template = TIER_TEMPLATES[tierKey];
        if (template) {
            campaignCreationState.tiers.push({
                id: tierId++,
                name: template.name,
                minAmountUSD: template.minUSD,
                bonus: template.bonus,
                maxSupply: template.maxSupply,
                color: TIER_COLORS[tierKey],
                icon: template.icon,
                priceMode: 0
            });
        }
    });

    updateCreateCampaignUI();
    showNotification(`✅ Template "${templateName}" carregado com sucesso!`, 'success');
    console.log('📌 Tiers configurados:', campaignCreationState.tiers);
}

// ============================================
// FUNÇÕES DE INTEGRAÇÃO COM BLOCKCHAIN
// ============================================

/**
 * Cria campanha no blockchain com tiers personalizados
 */
async function createCampaignOnBlockchain() {
    console.log('🔄 Iniciando criação de campanha no blockchain...');

    // Validar dados
    const validation = validateCampaignData();
    if (!validation.isValid) {
        validation.errors.forEach(error => {
            console.error(error);
            showNotification(error, 'error');
        });
        return;
    }

    // Mostrar status de processamento
    showCreateStatus('⏳ Conectando à carteira e preparando transação...', 'pending');

    try {
        // Conectar à carteira
        if (!signer) {
            showNotification('⚠️ Carteira não conectada. Conecte o MetaMask.', 'error');
            return;
        }

        const data = campaignCreationState.campaignData;
        const startTime = Math.floor(data.startDate.getTime() / 1000);
        const endTime = Math.floor(data.endDate.getTime() / 1000);

        // Converter ETH para Wei
        const softCapWei = ethers.parseEther(data.softCapETH.toString());
        const hardCapWei = ethers.parseEther(data.hardCapETH.toString());

        // Pegar preço de referência do oracle
        const oraclePrice = ethPrice || 3000; // Fallback
        const priceFeed = CONTRACTS.PRICE_FEED_ETH;

        console.log('📊 Parâmetros da campanha:', {
            softCap: data.softCapETH,
            hardCap: data.hardCapETH,
            startTime,
            endTime,
            tierCount: campaignCreationState.tiers.length,
            priceFeed
        });

        // Criar contrato da factory
        const factoryAbi = typeof ABI_CAMPAIGN_FACTORY_WRITE !== 'undefined' ? ABI_CAMPAIGN_FACTORY_WRITE : CAMPAIGN_FACTORY_WRITE_ABI;
        const factoryContract = new ethers.Contract(
            CONTRACTS.CAMPAIGN_FACTORY,
            factoryAbi,
            signer
        );
        const factoryInterface = factoryContract.interface || new ethers.Interface(factoryAbi);

        // Chamar função createCampaign
        showCreateStatus('⏳ Enviando transação para o blockchain...', 'pending');

        const tx = await factoryContract.createCampaign(
            softCapWei,
            hardCapWei,
            startTime,
            endTime,
            data.baseURI,
            priceFeed
        );

        console.log('✅ Transação enviada:', tx.hash);
        showCreateStatus(`⏳ Esperando confirmação da transação: ${tx.hash.slice(0, 8)}...`, 'pending');

        // Aguardar confirmação
        const receipt = await tx.wait();

        console.log('✅ Transação confirmada:', receipt);
        showCreateStatus('✅ Campanha criada com sucesso!', 'success');

        // Extrair endereço da campanha dos eventos
        let campaignAddress = null;
        let tierManagerAddress = null;

        if (receipt.logs) {
            for (const log of receipt.logs) {
                try {
                    const parsed = factoryInterface.parseLog(log);
                    if (parsed && parsed.name === 'CampaignCreated') {
                        campaignAddress = parsed.args.campaign || parsed.args[0];
                        tierManagerAddress = parsed.args.tierManager || parsed.args[1];
                        break;
                    }
                } catch (e) {
                    // Log não é do factory, continuar
                }
            }
        }

        if (campaignAddress) {
            console.log('🎉 Nova campanha criada:', campaignAddress);
            console.log('📦 TierManager:', tierManagerAddress);

            // Criar tiers no blockchain através do contrato Campaign
            await createTiersOnBlockchain(campaignAddress, campaignCreationState.tiers);

            showNotification(`🎉 Campanha criada com sucesso! Endereço: ${campaignAddress.slice(0, 10)}...`, 'success');
            
            // Limpar estado
            setTimeout(() => {
                switchScreen('home');
                initiateCampaignCreation();
            }, 2000);
        } else {
            console.error('❌ Evento CampaignCreated não encontrado no receipt da transação');
            showNotification('❌ Campanha criada, mas não foi possível localizar o endereço da campanha.', 'error');
        }

    } catch (error) {
        console.error('❌ Erro ao criar campanha:', error);
        showCreateStatus(`❌ Erro: ${error.message}`, 'error');
        showNotification(`❌ Erro ao criar campanha: ${error.message}`, 'error');
    }
}

/**
 * Cria os tiers no contrato Campaign
 * @param {string} campaignAddress - Endereço do contrato Campaign
 * @param {Array} tiers - Array de tiers para criar
 */
async function createTiersOnBlockchain(campaignAddress, tiers) {
    console.log('🔄 Criando tiers no blockchain...');

    try {
        const campaignContract = new ethers.Contract(
            campaignAddress,
            typeof ABI_CAMPAIGN_READ !== 'undefined' ? ABI_CAMPAIGN_READ : CAMPAIGN_WRITE_ABI,
            signer
        );

        for (let i = 0; i < tiers.length; i++) {
            const tier = tiers[i];
            const minAmountUSD = BigInt(Math.floor(tier.minAmountUSD * 1e8));
            const maxSupply = tier.maxSupply || 0;
            const priceMode = tier.priceMode || 0;
            const metadataURI = campaignCreationState.campaignData.baseURI || '';

            console.log(`📦 Criando tier ${i + 1}/${tiers.length}: ${tier.name}`);
            showCreateStatus(`📦 Criando tier ${i + 1}/${tiers.length}: ${tier.name}...`, 'pending');

            const tx = await campaignContract.createTier(
                tier.name,
                minAmountUSD,
                maxSupply,
                priceMode,
                metadataURI
            );

            await tx.wait();
            console.log(`✅ Tier criado: ${tier.name}`);
        }

        console.log('✅ Todos os tiers foram criados com sucesso!');
        showCreateStatus('✅ Todos os tiers foram criados com sucesso!', 'success');

    } catch (error) {
        console.error('❌ Erro ao criar tiers:', error);
        showNotification(`⚠️ Campanha criada, mas houve erro ao criar tiers: ${error.message}`, 'warning');
    }
}

// ============================================
// FUNÇÕES DE INTERFACE DO USUÁRIO
// ============================================

/**
 * Atualiza o status de criação
 * @param {string} message - Mensagem de status
 * @param {string} status - Tipo de status (pending, success, error)
 */
function showCreateStatus(message, status) {
    const statusDiv = document.getElementById('createStatus');
    if (!statusDiv) return;

    statusDiv.classList.add('tx-status', 'show', status);
    statusDiv.innerHTML = '';

    if (status === 'pending') {
        statusDiv.innerHTML = `<div class="spinner"></div> ${message}`;
    } else if (status === 'success') {
        statusDiv.innerHTML = `<span>✅</span> ${message}`;
    } else if (status === 'error') {
        statusDiv.innerHTML = `<span>❌</span> ${message}`;
    }
}

/**
 * Mostra notificação para o usuário
 * @param {string} message - Mensagem a exibir
 * @param {string} type - Tipo (success, error, warning, info)
 */
function showNotification(message, type = 'info') {
    // Se houver um div de notificação, usar ele
    const notificationDiv = document.getElementById('notification');
    if (notificationDiv) {
        notificationDiv.textContent = message;
        notificationDiv.className = `notification notification-${type}`;
        notificationDiv.style.display = 'block';
        setTimeout(() => {
            notificationDiv.style.display = 'none';
        }, 4000);
    } else {
        // Usar console como fallback
        console.log(message);
    }
}

/**
 * Atualiza os dados da campanha no estado
 * @param {string} field - Campo a atualizar
 * @param {any} value - Novo valor
 */
function updateCampaignField(field, value) {
    campaignCreationState.campaignData[field] = value;
    console.log(`📝 Campo "${field}" atualizado para:`, value);
}

/**
 * Obtém o resumo da campanha para revisão
 * @returns {Object} Resumo da campanha
 */
function getCampaignSummary() {
    const data = campaignCreationState.campaignData;
    
    return {
        nome: data.name,
        descricao: data.description,
        categoria: data.category,
        softCap: `${data.softCapETH} ETH`,
        hardCap: `${data.hardCapETH} ETH`,
        inicio: data.startDate?.toLocaleString('pt-BR'),
        fim: data.endDate?.toLocaleString('pt-BR'),
        tiers: campaignCreationState.tiers.length,
        tiersDetalhes: campaignCreationState.tiers.map(t => 
            `${t.icon} ${t.name} (US$${t.minAmountUSD}+, +${t.bonus}% bonus)`
        )
    };
}

/**
 * Exibe o resumo da campanha
 */
function showCampaignSummary() {
    const summary = getCampaignSummary();
    let summaryHTML = '<div style="font-size: 14px; line-height: 1.8;">';
    
    summaryHTML += `<div style="margin-bottom: 16px;"><strong>📋 Resumo da Campanha</strong></div>`;
    summaryHTML += `<div><span style="color: #94a3b8;">Nome:</span> ${summary.nome}</div>`;
    summaryHTML += `<div><span style="color: #94a3b8;">Categoria:</span> ${summary.categoria}</div>`;
    summaryHTML += `<div><span style="color: #94a3b8;">Soft Cap:</span> ${summary.softCap}</div>`;
    summaryHTML += `<div><span style="color: #94a3b8;">Hard Cap:</span> ${summary.hardCap}</div>`;
    summaryHTML += `<div><span style="color: #94a3b8;">Início:</span> ${summary.inicio}</div>`;
    summaryHTML += `<div><span style="color: #94a3b8;">Fim:</span> ${summary.fim}</div>`;
    summaryHTML += `<div style="margin-top: 12px;"><strong>🎁 Tiers (${summary.tiers}):</strong></div>`;
    
    summary.tiersDetalhes.forEach(tier => {
        summaryHTML += `<div style="margin-left: 16px;">• ${tier}</div>`;
    });
    
    summaryHTML += '</div>';

    const statusDiv = document.getElementById('createStatus');
    if (statusDiv) {
        statusDiv.innerHTML = summaryHTML;
        statusDiv.className = '';
        statusDiv.classList.add('tx-status', 'show');
        statusDiv.style.backgroundColor = 'rgba(96, 165, 250, 0.05)';
        statusDiv.style.border = '1px solid rgba(96, 165, 250, 0.3)';
    }
}

// ============================================
// EVENT LISTENERS E INICIALIZAÇÃO
// ============================================

/**
 * Anexa os event listeners quando o documento está pronto
 */
function attachCampaignCreationListeners() {
    // Botão de personalizar tiers
    const customizeTiersBtn = document.getElementById('customizeTiersBtn');
    if (customizeTiersBtn) {
        customizeTiersBtn.addEventListener('click', openTiersModal);
    }

    // Botão de criar campanha
    const createCampaignBtn = document.getElementById('createCampaignBtn');
    if (createCampaignBtn) {
        createCampaignBtn.addEventListener('click', createCampaignOnBlockchain);
    }

    // Campos de entrada de dados
    const campaignNameInput = document.getElementById('campaignNameInput');
    if (campaignNameInput) {
        campaignNameInput.addEventListener('change', (e) => {
            updateCampaignField('name', e.target.value);
        });
    }

    const campaignDescInput = document.getElementById('campaignDescInput');
    if (campaignDescInput) {
        campaignDescInput.addEventListener('change', (e) => {
            updateCampaignField('description', e.target.value);
        });
    }

    const softCapInput = document.getElementById('softCapInput');
    if (softCapInput) {
        softCapInput.addEventListener('change', (e) => {
            updateCampaignField('softCapETH', parseFloat(e.target.value) || 0);
        });
    }

    const hardCapInput = document.getElementById('hardCapInput');
    if (hardCapInput) {
        hardCapInput.addEventListener('change', (e) => {
            updateCampaignField('hardCapETH', parseFloat(e.target.value) || 0);
        });
    }

    const startDateInput = document.getElementById('startDateInput');
    if (startDateInput) {
        startDateInput.addEventListener('change', (e) => {
            updateCampaignField('startDate', new Date(e.target.value));
        });
    }

    const endDateInput = document.getElementById('endDateInput');
    if (endDateInput) {
        endDateInput.addEventListener('change', (e) => {
            updateCampaignField('endDate', new Date(e.target.value));
        });
    }

    const categorySelect = document.getElementById('categorySelect');
    if (categorySelect) {
        categorySelect.addEventListener('change', (e) => {
            updateCampaignField('category', e.target.value);
        });
    }

    console.log('✅ Event listeners anexados com sucesso');
}

// Anexar listeners quando documento está pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachCampaignCreationListeners);
} else {
    attachCampaignCreationListeners();
}

// ============================================
// EXPORT (para uso em módulos)
// ============================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initiateCampaignCreation,
        createCampaignOnBlockchain,
        addTierToList,
        editTier,
        removeTier,
        loadTierTemplate,
        validateCampaignData,
        getCampaignSummary,
        campaignCreationState,
        TIER_TEMPLATES,
        TIER_COLORS
    };
}
