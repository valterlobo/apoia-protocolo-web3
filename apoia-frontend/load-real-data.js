/**
 * APOIA Frontend - Carregando Dados Reais dos Smart Contracts
 * 
 * Este arquivo contém exemplos de como substituir dados mock 
 * por dados reais obtidos dos contratos na blockchain.
 */

// ============================================
// SUBSTITUIR MOCK DATA POR DADOS REAIS
// ============================================

/**
 * Exemplo 1: Carregar Campanhas Reais
 * 
 * Antes (Mock):
 * const mockCampaigns = [{ id: 1, title: "...", ... }]
 * 
 * Depois (Real):
 */

async function loadCampaignsFromBlockchain(web3, campaignManager) {
    try {
        console.log('📡 Carregando campanhas reais da blockchain...');
        
        // Obter total de campanhas
        const count = await web3.contracts.campaignFactory.getCampaignCount();
        console.log(`Total de campanhas: ${count}`);
        
        const campaigns = [];
        
        // Iterar e buscar detalhes de cada campanha
        for (let i = 0; i < count; i++) {
            const campaignAddress = await web3.contracts.campaignFactory.getCampaignAt(i);
            const details = await campaignManager.getCampaignDetails(campaignAddress);
            
            campaigns.push({
                id: i + 1,
                address: campaignAddress,
                title: details.title,
                creator: details.creator,
                softCap: parseFloat(details.softCap),
                hardCap: parseFloat(details.hardCap),
                raised: parseFloat(details.raised),
                progress: (parseFloat(details.raised) / parseFloat(details.hardCap)) * 100,
                status: getStatusName(details.status),
                backers: 0 // Seriam obtidos via eventos indexados (The Graph)
            });
            
            console.log(`✅ Campanha ${i + 1} carregada: ${details.title}`);
        }
        
        return campaigns;
    } catch (error) {
        console.error('❌ Erro ao carregar campanhas:', error);
        throw error;
    }
}

function getStatusName(statusCode) {
    const statuses = {
        0: 'pending',
        1: 'active',
        2: 'succeeded',
        3: 'failed'
    };
    return statuses[statusCode] || 'unknown';
}

/**
 * Exemplo 2: Carregar Dados do Usuário
 */

async function loadUserData(web3, tokenManager, stakingManager) {
    try {
        console.log('👤 Carregando dados do usuário...');
        
        const userAddress = web3.userAddress;
        
        // Saldo AGT
        const balance = await tokenManager.getBalance(userAddress);
        console.log(`💎 Saldo AGT: ${balance}`);
        
        // Staking info
        const stakedAmount = await stakingManager.getStakedAmount(userAddress);
        console.log(`💰 AGT Staked: ${stakedAmount}`);
        
        // Multiplicador de votação
        const multiplier = await stakingManager.getVotingMultiplier(userAddress);
        console.log(`🗳️ Multiplicador: ${multiplier}x`);
        
        // Rewards pendentes
        const rewards = await stakingManager.calculateReward(userAddress);
        console.log(`🎁 Rewards: ${rewards} AGT`);
        
        return {
            address: userAddress,
            balance,
            stakedAmount,
            multiplier,
            rewards
        };
    } catch (error) {
        console.error('❌ Erro ao carregar dados do usuário:', error);
        throw error;
    }
}

/**
 * Exemplo 3: Carregar Campanhas do Usuário
 */

async function loadUserCampaigns(web3, campaignManager) {
    try {
        console.log('📋 Carregando campanhas do usuário...');
        
        const userCampaigns = await campaignManager.getCampaignsByUser(web3.userAddress);
        console.log(`Você criou ${userCampaigns.length} campanhas`);
        
        const campaigns = [];
        
        for (const campaignAddress of userCampaigns) {
            const details = await campaignManager.getCampaignDetails(campaignAddress);
            
            campaigns.push({
                address: campaignAddress,
                title: details.title,
                raised: parseFloat(details.raised),
                hardCap: parseFloat(details.hardCap),
                status: getStatusName(details.status)
            });
        }
        
        return campaigns;
    } catch (error) {
        console.error('❌ Erro ao carregar campanhas do usuário:', error);
        throw error;
    }
}

/**
 * Exemplo 4: Carregar Preço do Oráculo
 */

async function loadOracleData(oracleManager) {
    try {
        console.log('📊 Buscando preço do oráculo...');
        
        const priceData = await oracleManager.getLatestPrice();
        
        console.log(`ETH/USD: $${priceData.price.toFixed(2)}`);
        console.log(`Fresco: ${priceData.isFresh ? '✅' : '❌'}`);
        console.log(`Timestamp: ${new Date(priceData.timestamp * 1000).toLocaleString()}`);
        
        return priceData;
    } catch (error) {
        console.error('❌ Erro ao buscar oráculo:', error);
        throw error;
    }
}

/**
 * Exemplo 5: Carregar Propostas da DAO
 */

async function loadProposals(daoManager) {
    try {
        console.log('🗳️ Carregando propostas da DAO...');
        
        // Simulando propostas (em produção, use The Graph para indexação)
        const proposals = [];
        
        for (let i = 1; i <= 5; i++) {
            try {
                const state = await daoManager.getProposalState(i);
                const details = await daoManager.getProposalDetails(i);
                
                proposals.push({
                    id: i,
                    description: details.description,
                    state,
                    startBlock: details.startBlock,
                    endBlock: details.endBlock,
                    forVotes: parseFloat(details.forVotes),
                    againstVotes: parseFloat(details.againstVotes),
                    approval: (parseFloat(details.forVotes) / 
                               (parseFloat(details.forVotes) + parseFloat(details.againstVotes)) * 100).toFixed(1)
                });
                
                console.log(`✅ Proposta ${i} carregada`);
            } catch (error) {
                // Proposta não existe, continua
            }
        }
        
        return proposals;
    } catch (error) {
        console.error('❌ Erro ao carregar propostas:', error);
        throw error;
    }
}

// ============================================
// INTEGRAR DADOS REAIS NO FRONTEND
// ============================================

/**
 * Função Principal: Substituir Mock Data por Dados Reais
 * 
 * Substitua as funções loadHomeData(), loadExploreData(), etc.
 * do apoia-protocol-frontend.html
 */

async function updateFrontendWithRealData(web3) {
    try {
        // Inicializar managers
        const campaignManager = new CampaignManager(web3);
        const tokenManager = new TokenManager(web3);
        const stakingManager = new StakingManager(web3);
        const daoManager = new DAOManager(web3);
        const oracleManager = new OracleManager(web3);
        
        // Home Screen
        console.log('🔄 Atualizando Home...');
        const campaigns = await loadCampaignsFromBlockchain(web3, campaignManager);
        const priceData = await loadOracleData(oracleManager);
        
        const totalRaised = campaigns.reduce((sum, c) => sum + c.raised, 0);
        const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
        
        document.getElementById('totalRaised').textContent = `${totalRaised.toFixed(1)} ETH`;
        document.getElementById('activeCampaigns').textContent = activeCampaigns;
        document.getElementById('ethPrice').textContent = `$${priceData.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
        
        // Renderizar cards das campanhas
        const homeCards = document.getElementById('homeCards');
        homeCards.innerHTML = '';
        campaigns.slice(0, 3).forEach(campaign => {
            homeCards.innerHTML += renderCampaignCard(campaign);
        });
        
        // Dashboard Screen
        if (web3.isConnected()) {
            console.log('🔄 Atualizando Dashboard...');
            const userData = await loadUserData(web3, tokenManager, stakingManager);
            const userCampaigns = await loadUserCampaigns(web3, campaignManager);
            
            document.getElementById('dashTotalRaised').textContent = 
                `${userCampaigns.reduce((sum, c) => sum + c.raised, 0).toFixed(1)} ETH`;
            document.getElementById('dashCampaignCount').textContent = userCampaigns.length;
            
            // Renderizar campanhas do usuário
            const dashboardCards = document.getElementById('dashboardCards');
            dashboardCards.innerHTML = '';
            userCampaigns.forEach(campaign => {
                dashboardCards.innerHTML += renderCampaignCard(campaign);
            });
        }
        
        // Governance Screen
        console.log('🔄 Atualizando Governança...');
        const proposals = await loadProposals(daoManager);
        
        const proposalCards = document.getElementById('proposalCards');
        proposalCards.innerHTML = '';
        proposals.forEach(proposal => {
            proposalCards.innerHTML += renderProposalCard(proposal);
        });
        
        console.log('✅ Frontend atualizado com dados reais!');
        
    } catch (error) {
        console.error('❌ Erro ao atualizar frontend:', error);
        // Fallback para mock data em caso de erro
        console.log('⏮️ Usando dados mock como fallback');
    }
}

/**
 * Renderizar Card de Campanha (Real)
 */

function renderCampaignCard(campaign) {
    const statusBadge = {
        'active': '<span class="badge active">Ativo</span>',
        'pending': '<span class="badge pending">Pendente</span>',
        'succeeded': '<span class="badge active">Sucesso</span>',
        'failed': '<span class="badge rejected">Falhou</span>'
    };
    
    const progress = Math.min(100, campaign.progress);
    
    return `
        <div class="card" onclick="viewCampaignDetails('${campaign.address}')">
            <div class="card-header">
                <div class="card-title">${campaign.title}</div>
                ${statusBadge[campaign.status] || '<span class="badge">-</span>'}
            </div>
            <div class="card-body">
                <div class="card-stat">
                    <span class="stat-label">Arrecadado</span>
                    <span class="stat-value">${campaign.raised.toFixed(2)} / ${campaign.hardCap.toFixed(2)} ETH</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="card-stat">
                    <span class="stat-label">Progresso</span>
                    <span class="stat-value">${progress.toFixed(1)}%</span>
                </div>
            </div>
            <div class="card-footer">
                <button class="btn btn-primary">Ver Detalhes</button>
            </div>
        </div>
    `;
}

/**
 * Renderizar Card de Proposta (Real)
 */

function renderProposalCard(proposal) {
    return `
        <div class="card">
            <div class="card-header">
                <div class="card-title">Proposta #${proposal.id}: ${proposal.description.substring(0, 40)}...</div>
                <span class="badge active">${proposal.state}</span>
            </div>
            <div class="card-body">
                <div class="card-stat">
                    <span class="stat-label">Votos A Favor</span>
                    <span class="stat-value">${proposal.approval}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${proposal.approval}%"></div>
                </div>
                <div class="card-stat">
                    <span class="stat-label">Total de Votos</span>
                    <span class="stat-value">${(proposal.forVotes + proposal.againstVotes).toFixed(0)}</span>
                </div>
            </div>
            <div class="card-footer">
                <button class="btn btn-primary">Votar A Favor</button>
                <button class="btn btn-secondary">Votar Contra</button>
            </div>
        </div>
    `;
}

/**
 * Atualizar Dados Periodicamente (Polling)
 */

function startDataPolling(web3, intervalMs = 30000) {
    console.log(`⏰ Iniciando polling a cada ${intervalMs}ms`);
    
    setInterval(async () => {
        try {
            await updateFrontendWithRealData(web3);
        } catch (error) {
            console.warn('⚠️ Erro no polling:', error.message);
        }
    }, intervalMs);
}

/**
 * Atualizar Dados via The Graph (Recomendado para Produção)
 */

async function loadDataFromSubgraph(subgraphUrl) {
    try {
        console.log('📡 Buscando dados do Subgraph...');
        
        const query = `
            {
              campaigns(first: 10, orderBy: createdAt, orderDirection: desc) {
                id
                title
                creator
                softCap
                hardCap
                raised
                status
              }
              proposals(first: 10) {
                id
                description
                state
                forVotes
                againstVotes
              }
            }
        `;
        
        const response = await fetch(subgraphUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });
        
        const data = await response.json();
        console.log('✅ Dados do Subgraph recebidos:', data);
        
        return data;
    } catch (error) {
        console.error('❌ Erro ao carregar do Subgraph:', error);
        throw error;
    }
}

// ============================================
// EXPORT
// ============================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadCampaignsFromBlockchain,
        loadUserData,
        loadUserCampaigns,
        loadOracleData,
        loadProposals,
        updateFrontendWithRealData,
        startDataPolling,
        loadDataFromSubgraph
    };
}
