// ============================================
// CAMPAIGN DETAILS ENHANCEMENT SCRIPT
// Melhorias interativas para seleção de Tiers
// ============================================

/**
 * MELHORIA 1: Armazenar Tiers carregados para seleção interativa
 * Adicionar ao escopo global, após as definições de ABI
 */
let currentCampaignAddress = null;
let currentCampaignTiers = [];
let selectedTierId = null;

/**
 * MELHORIA 2: Função aprimorada para carregar detalhes on-chain
 * Substitua a função existente loadOnChainCampaignDetails por esta versão melhorada
 */
async function loadOnChainCampaignDetailsEnhanced(campaignAddress) {
    currentCampaignAddress = campaignAddress;
    document.getElementById('detailsLoading').style.display = 'block';
    document.getElementById('detailsLoading').innerHTML = '<div class="spinner"></div> Carregando dados da blockchain...';
    document.getElementById('detailsContent').style.display = 'none';

    try {
        const rpcProvider = provider || new ethers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/ISqOLUfXDzgFu0-5ronlzwri_xFU4rZf');
        const campContract = new ethers.Contract(campaignAddress, ABI_CAMPAIGN_READ, rpcProvider);

        const [cfg, raised, bal, st] = await Promise.all([
            campContract.config(),
            campContract.totalRaisedUSD(),
            campContract.balance(),
            campContract.status()
        ]);

        const softCapUsd = Number(cfg.softCap) / 1e8;
        const hardCapUsd = Number(cfg.hardCap) / 1e8;
        const raisedUsd = Number(raised) / 1e8;
        const balEth = Number(ethers.formatEther(bal));
        const statusNum = Number(st);
        const progress = hardCapUsd > 0 ? Math.min(100, Math.round((raisedUsd / hardCapUsd) * 100)) : 0;
        const creator = cfg.proponente;
        const tierManagerAddr = cfg.tierManager;

        const startDate = new Date(Number(cfg.startTime) * 1000);
        const endDate = new Date(Number(cfg.endTime) * 1000);
        const now = new Date();
        const diffMs = endDate - now;
        const daysLeft = diffMs > 0 ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : 0;

        // Preencher dados na tela
        document.getElementById('detailsLoading').style.display = 'none';
        document.getElementById('detailsContent').style.display = 'block';

        document.getElementById('campaignTitle').textContent = `Campanha ${campaignAddress.slice(0, 6)}...${campaignAddress.slice(-4)}`;
        document.getElementById('campaignCreator').textContent = `${creator.slice(0, 6)}...${creator.slice(-4)}`;
        document.getElementById('campaignStatus').textContent = STATUS_LABEL[statusNum] || 'Desconhecido';
        document.getElementById('campaignSoftCap').textContent = `$${softCapUsd.toFixed(2)} USD`;
        document.getElementById('campaignHardCap').textContent = `$${hardCapUsd.toFixed(2)} USD`;
        document.getElementById('campaignRaised').textContent = `$${raisedUsd.toFixed(2)} USD (${balEth.toFixed(4)} ETH)`;
        document.getElementById('campaignBackers').textContent = '—';
        document.getElementById('detailsProgress').style.width = `${progress}%`;

        document.getElementById('oraclePrice').textContent = `$${ethPrice.toFixed(0)}`;
        document.getElementById('oracleTimestamp').textContent = new Date().toLocaleString('pt-BR');

        document.getElementById('campaignStart').textContent = startDate.toLocaleDateString('pt-BR') + ' ' + startDate.toLocaleTimeString('pt-BR');
        document.getElementById('campaignEnd').textContent = endDate.toLocaleDateString('pt-BR') + ' ' + endDate.toLocaleTimeString('pt-BR');
        document.getElementById('campaignTimeLeft').textContent = daysLeft > 0 ? `${daysLeft} dias` : 'Encerrada';

        // MELHORIA: Adicionar endereço do contrato à exibição
        addContractAddressDisplay(campaignAddress, tierManagerAddr);

        // Carregar Tiers do TierManager (agora com armazenamento)
        await loadOnChainTiersEnhanced(tierManagerAddr, rpcProvider, softCapUsd, hardCapUsd);

        // Contribute button (on-chain)
        document.getElementById('contributeBtn').onclick = () => contributeToCampaignWithTierSelection(campaignAddress, currentCampaignTiers);

    } catch (err) {
        console.error('Erro ao carregar detalhes on-chain:', err);
        document.getElementById('detailsLoading').innerHTML = `<div style="color:#ef4444;">❌ Erro ao carregar: ${err.message}</div>`;
    }
}

/**
 * MELHORIA 3: Função para exibir endereço do contrato
 */
function addContractAddressDisplay(campaignAddress, tierManagerAddr) {
    const detailsSection = document.querySelector('.details-section');
    
    // Remover seção anterior se existir
    const existingContractSection = document.getElementById('contractAddressSection');
    if (existingContractSection) {
        existingContractSection.remove();
    }

    // Criar nova seção
    const contractSection = document.createElement('div');
    contractSection.id = 'contractAddressSection';
    contractSection.className = 'details-section';
    contractSection.style.marginTop = '24px';
    contractSection.style.marginBottom = '24px';
    contractSection.style.backgroundColor = 'rgba(96, 165, 250, 0.05)';
    contractSection.style.padding = '16px';
    contractSection.style.borderRadius = '8px';
    contractSection.style.borderLeft = '3px solid #60a5fa';

    contractSection.innerHTML = `
        <div class="details-title" style="margin-bottom: 12px; font-size: 16px;">🔗 Contratos Inteligentes</div>
        <div class="details-item">
            <span class="details-label">Contrato da Campanha</span>
            <span class="details-value" style="font-size: 11px; word-break: break-all;">
                <a href="https://sepolia.etherscan.io/address/${campaignAddress}" target="_blank" style="color: #60a5fa; text-decoration: underline;">
                    ${campaignAddress}
                </a>
            </span>
        </div>
        <div class="details-item">
            <span class="details-label">Gerenciador de Tiers</span>
            <span class="details-value" style="font-size: 11px; word-break: break-all;">
                <a href="https://sepolia.etherscan.io/address/${tierManagerAddr}" target="_blank" style="color: #60a5fa; text-decoration: underline;">
                    ${tierManagerAddr}
                </a>
            </span>
        </div>
    `;

    const tiersContainer = document.getElementById('tiersDetailContainer');
    tiersContainer.parentElement.insertBefore(contractSection, tiersContainer);
}

/**
 * MELHORIA 4: Função aprimorada para carregar Tiers com armazenamento
 */
async function loadOnChainTiersEnhanced(tierManagerAddr, rpcProvider, softCapUsd, hardCapUsd) {
    const tiersContainer = document.getElementById('tiersDetailContainer');
    tiersContainer.innerHTML = '<div style="text-align:center; padding:12px; color:#94a3b8;"><div class="spinner"></div> Carregando tiers...</div>';

    try {
        const tmContract = new ethers.Contract(tierManagerAddr, ABI_TIER_MANAGER_READ, rpcProvider);
        const total = Number(await tmContract.totalTiers());

        if (total === 0) {
            tiersContainer.innerHTML = '<div style="text-align:center; padding:20px; color:#94a3b8;">Nenhum tier criado ainda.</div>';
            currentCampaignTiers = [];
            return;
        }

        const tierColors = ['#60a5fa', '#fbbf24', '#d97706', '#10b981', '#8b5cf6', '#ef4444'];
        const tierIcons = ['🥉', '🥈', '🥇', '💎', '👑', '🌟'];
        let html = '';
        currentCampaignTiers = [];

        for (let i = 1; i <= total; i++) {
            try {
                const tier = await tmContract.getTierMetadata(i);
                const minUsd = Number(tier.minAmountUSD) / 1e8;
                const color = tierColors[(i - 1) % tierColors.length];
                const icon = tierIcons[(i - 1) % tierIcons.length];
                const supplyText = Number(tier.maxSupply) === 0 ? 'Ilimitado' : `${Number(tier.minted)}/${Number(tier.maxSupply)}`;
                const priceMode = Number(tier.priceMode) === 0 ? 'Fixo (USD)' : 'Dinâmico (ETH)';
                
                // MELHORIA: Calcular percentual de preenchimento do tier
                const fillPercentage = Number(tier.maxSupply) === 0 
                    ? 0 
                    : Math.round((Number(tier.minted) / Number(tier.maxSupply)) * 100);

                // Armazenar tier para referência posterior
                currentCampaignTiers.push({
                    id: Number(tier.id),
                    name: tier.name,
                    minAmountUSD: minUsd,
                    maxSupply: Number(tier.maxSupply),
                    minted: Number(tier.minted),
                    priceMode: Number(tier.priceMode),
                    color: color,
                    icon: icon,
                    fillPercentage: fillPercentage
                });

                html += `
                    <div style="background: rgba(${hexToRgb(color)}, 0.05); padding: 16px; border-radius: 8px; border-left: 3px solid ${color}; cursor: pointer; transition: all 0.3s ease;" 
                         class="tier-card" 
                         data-tier-id="${Number(tier.id)}"
                         onclick="selectTier(${Number(tier.id)})">
                        <div style="font-weight: 600; margin-bottom: 8px; font-size: 16px;">${icon} ${tier.name}</div>
                        <div style="font-size: 12px; color: #94a3b8; margin-bottom: 4px;">Mínimo: $${minUsd.toFixed(2)} USD</div>
                        <div style="font-size: 12px; color: #94a3b8; margin-bottom: 8px;">Supply: ${supplyText}</div>
                        
                        <!-- MELHORIA: Barra de preenchimento do tier -->
                        <div style="width: 100%; height: 6px; background: rgba(148, 163, 184, 0.2); border-radius: 3px; overflow: hidden; margin-bottom: 8px;">
                            <div style="height: 100%; background: ${color}; width: ${fillPercentage}%;"></div>
                        </div>
                        
                        <div style="font-size: 12px; color: #94a3b8; margin-bottom: 4px;">Modo: ${priceMode}</div>
                        <div style="font-size: 11px; color: #60a5fa; margin-top: 6px;">Tier ID: ${Number(tier.id)} | ${fillPercentage}% preenchido</div>
                        
                        <!-- MELHORIA: Indicador de seleção -->
                        <div style="margin-top: 12px; padding: 8px; background: rgba(${hexToRgb(color)}, 0.1); border-radius: 4px; text-align: center; display: none;" class="tier-selection-indicator">
                            <div style="font-size: 14px; font-weight: 600; color: ${color};">✓ Selecionado</div>
                        </div>
                    </div>
                `;
            } catch (tierErr) {
                console.warn(`Erro ao ler tier ${i}:`, tierErr);
            }
        }

        tiersContainer.innerHTML = html || '<div style="text-align:center; padding:20px; color:#94a3b8;">Nenhum tier encontrado.</div>';
    } catch (err) {
        console.error('Erro ao carregar tiers:', err);
        tiersContainer.innerHTML = '<div style="color:#ef4444;">❌ Erro ao carregar tiers</div>';
    }
}

/**
 * MELHORIA 5: Função para seleção interativa de Tier
 */
function selectTier(tierId) {
    // Remover seleção anterior
    document.querySelectorAll('.tier-card').forEach(card => {
        card.style.border = '3px solid transparent';
        card.style.backgroundColor = '';
        card.querySelector('.tier-selection-indicator').style.display = 'none';
    });

    // Aplicar nova seleção
    const selectedCard = document.querySelector(`[data-tier-id="${tierId}"]`);
    if (selectedCard) {
        selectedCard.style.border = `3px solid #10b981`;
        selectedCard.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
        selectedCard.querySelector('.tier-selection-indicator').style.display = 'block';
    }

    selectedTierId = tierId;
    
    // Atualizar input de contribuição com o valor mínimo do tier
    const selectedTier = currentCampaignTiers.find(t => t.id === tierId);
    if (selectedTier) {
        const minEth = selectedTier.minAmountUSD / (ethPrice || 2500);
        document.getElementById('contributeAmount').placeholder = `Mínimo: ${minEth.toFixed(4)} ETH`;
        document.getElementById('contributeAmount').value = minEth.toFixed(4);
    }
}

/**
 * MELHORIA 6: Função de contribuição com seleção de Tier
 */
async function contributeToCampaignWithTierSelection(campaignAddress, tiers) {
    if (!userAddress || !signer) {
        alert('Por favor, conecte sua wallet primeiro');
        return;
    }

    const amount = document.getElementById('contributeAmount').value;
    if (!amount || parseFloat(amount) <= 0) {
        alert('Por favor, insira um valor válido');
        return;
    }

    if (!selectedTierId) {
        alert('Por favor, selecione um Tier antes de contribuir');
        return;
    }

    try {
        const statusDiv = document.getElementById('contributeStatus');
        statusDiv.innerHTML = '<div class="tx-status pending show"><div class="spinner"></div> Assinando transação...</div>';

        const ABI_CONTRIBUTE = ["function contribute(uint256 tierId) external payable"];
        const campContract = new ethers.Contract(campaignAddress, ABI_CONTRIBUTE, signer);
        
        const tx = await campContract.contribute(selectedTierId, { value: ethers.parseEther(amount) });

        statusDiv.innerHTML = '<div class="tx-status pending show"><div class="spinner"></div> Transação enviada! Aguardando confirmação...</div>';
        const receipt = await tx.wait();

        statusDiv.innerHTML = `
            <div class="tx-status success show">
                ✅ Contribuição confirmada!<br>
                Tier: ${currentCampaignTiers.find(t => t.id === selectedTierId)?.name}<br>
                Valor: ${amount} ETH<br>
                Hash: <a href="https://sepolia.etherscan.io/tx/${receipt.hash}" target="_blank" style="color: #60a5fa">${receipt.hash.slice(0, 10)}...</a>
            </div>
        `;
    } catch (error) {
        console.error('Erro ao contribuir:', error);
        document.getElementById('contributeStatus').innerHTML = `
            <div class="tx-status error show">❌ Erro: ${error.reason || error.message}</div>
        `;
    }
}

/**
 * MELHORIA 7: Função auxiliar para converter hex para RGB
 * (já existe, mas incluída aqui para referência)
 */
function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
}

/**
 * MELHORIA 8: Função para mostrar informações detalhadas do Tier
 * (Pode ser usada em um modal ou expandível)
 */
function showTierDetails(tierId) {
    const tier = currentCampaignTiers.find(t => t.id === tierId);
    if (!tier) return;

    const detailsHTML = `
        <div style="background: rgba(${hexToRgb(tier.color)}, 0.1); padding: 20px; border-radius: 8px; border-left: 4px solid ${tier.color}; margin: 16px 0;">
            <h3 style="margin-bottom: 16px; font-size: 18px; font-weight: 700;">
                ${tier.icon} ${tier.name}
            </h3>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div>
                    <div style="font-size: 12px; color: #94a3b8; margin-bottom: 4px;">Valor Mínimo</div>
                    <div style="font-size: 18px; font-weight: 600; color: ${tier.color};">$${tier.minAmountUSD.toFixed(2)} USD</div>
                </div>
                <div>
                    <div style="font-size: 12px; color: #94a3b8; margin-bottom: 4px;">Modo de Preço</div>
                    <div style="font-size: 16px; font-weight: 600; color: #e2e8f0;">${tier.priceMode === 0 ? 'Fixo' : 'Dinâmico'}</div>
                </div>
                <div>
                    <div style="font-size: 12px; color: #94a3b8; margin-bottom: 4px;">Supply</div>
                    <div style="font-size: 16px; font-weight: 600; color: #e2e8f0;">
                        ${tier.minted}/${tier.maxSupply === 0 ? '∞' : tier.maxSupply}
                    </div>
                </div>
                <div>
                    <div style="font-size: 12px; color: #94a3b8; margin-bottom: 4px;">Preenchimento</div>
                    <div style="font-size: 16px; font-weight: 600; color: ${tier.color};">${tier.fillPercentage}%</div>
                </div>
            </div>
            
            <div style="background: rgba(148, 163, 184, 0.1); padding: 12px; border-radius: 6px;">
                <div style="font-size: 12px; color: #94a3b8; margin-bottom: 4px;">Progresso de Preenchimento</div>
                <div style="width: 100%; height: 8px; background: rgba(148, 163, 184, 0.2); border-radius: 4px; overflow: hidden;">
                    <div style="height: 100%; background: ${tier.color}; width: ${tier.fillPercentage}%; transition: width 0.3s ease;"></div>
                </div>
            </div>
        </div>
    `;

    return detailsHTML;
}

/**
 * Usar na função viewCampaignDetails para chamar versão melhorada:
 * 
 * function viewCampaignDetails(campaignId) {
 *     document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
 *     document.querySelector('[data-screen="details"]').classList.add('active');
 *     document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
 *     document.getElementById('details').classList.add('active');
 * 
 *     const onChain = onChainCampaigns.find(c => c.id === campaignId);
 *     if (onChain && onChain.address) {
 *         loadOnChainCampaignDetailsEnhanced(onChain.address);  // ← USE VERSÃO MELHORADA
 *     } else {
 *         loadCampaignDetailsForId(campaignId);
 *     }
 * }
 */
