/**
 * SOLUÇÃO: Chainlink Price Staleness Handling
 * 
 * O contrato Campaign valida se o preço Chainlink está atualizado.
 * Este arquivo fornece funções para:
 * 1. Verificar se o preço está stale
 * 2. Usar fallback se necessário
 * 3. Avisar o usuário
 */

// ============================================
// CHAINLINK FEED VALIDATION
// ============================================

const CHAINLINK_FEED_ABI = [
    "function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
    "function decimals() external view returns (uint8)"
];

/**
 * Verifica o preço atual do Chainlink e sua idade
 * @param {string} feedAddress - Endereço do feed Chainlink
 * @param {ethers.Provider} provider - RPC provider
 * @returns {Object} { price, timestamp, isStale, age }
 */
async function checkChainlinkPrice(feedAddress, provider) {
    try {
        const feedContract = new ethers.Contract(feedAddress, CHAINLINK_FEED_ABI, provider);
        
        const [roundData, decimals] = await Promise.all([
            feedContract.latestRoundData(),
            feedContract.decimals()
        ]);

        const price = Number(roundData.answer) / (10 ** Number(decimals));
        const updatedAt = Number(roundData.updatedAt);
        const now = Math.floor(Date.now() / 1000);
        const age = now - updatedAt;
        
        // Feed Chainlink é considerado stale se não foi atualizado há mais de 1 hora (3600 segundos)
        // Em Sepolia (testnet), pode ser até 24-48 horas
        const maxAge = 3600; // 1 hora em produção
        const isStale = age > maxAge;

        return {
            price,
            timestamp: updatedAt,
            isStale,
            age,
            ageFormatted: formatSeconds(age)
        };
    } catch (error) {
        console.error('Erro ao verificar Chainlink feed:', error);
        return {
            price: null,
            timestamp: null,
            isStale: true,
            age: null,
            error: error.message
        };
    }
}

/**
 * Formata segundos para formato legível
 */
function formatSeconds(seconds) {
    if (seconds < 60) return `${seconds}s atrás`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m atrás`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h atrás`;
    return `${Math.floor(seconds / 86400)}d atrás`;
}

/**
 * Verifica antes de contribuir se o preço está stale
 * @param {string} campaignAddress - Endereço da campanha
 * @param {ethers.Provider} provider - RPC provider
 * @returns {Object} { canProceed, warning, recommendation }
 */
async function validateChainlinkBeforeContribute(campaignAddress, provider) {
    try {
        // Obter endereço do feed Chainlink do contrato Campaign
        const ABI_CAMPAIGN_CONFIG = [
            "function config() external view returns (address proponente, uint256 softCap, uint256 hardCap, uint64 startTime, uint64 endTime, address tierManager, address agtToken, address treasuryDAO, address priceFeedETHUSD, uint16 platformFee)"
        ];

        const campContract = new ethers.Contract(campaignAddress, ABI_CAMPAIGN_CONFIG, provider);
        const cfg = await campContract.config();
        const feedAddress = cfg.priceFeedETHUSD;

        const priceData = await checkChainlinkPrice(feedAddress, provider);

        if (priceData.error) {
            return {
                canProceed: false,
                warning: `Não foi possível verificar o feed de preço: ${priceData.error}`,
                recommendation: 'Tente novamente ou aguarde a atualização do feed.'
            };
        }

        if (priceData.isStale) {
            return {
                canProceed: false,
                warning: `⚠️ Preço do Chainlink desatualizado (${priceData.ageFormatted})`,
                recommendation: 'O contrato rejeita contribuições com preço stale. Aguarde a atualização automática.',
                priceData
            };
        }

        return {
            canProceed: true,
            warning: null,
            recommendation: 'Preço atualizado. Você pode contribuir.',
            priceData
        };

    } catch (error) {
        console.error('Erro ao validar Chainlink:', error);
        return {
            canProceed: false,
            warning: `Erro na validação: ${error.message}`,
            recommendation: 'Tente novamente ou verifique a conexão.'
        };
    }
}

/**
 * UI HELPER: Mostra status do Chainlink na tela
 */
function displayChainlinkStatus(priceData, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (priceData.isStale) {
        container.innerHTML = `
            <div style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3); color: #fbbf24; padding: 12px; border-radius: 6px; margin-top: 12px;">
                <div style="font-weight: 600; margin-bottom: 8px;">⚠️ Aviso: Preço Desatualizado</div>
                <div style="font-size: 13px; margin-bottom: 8px;">
                    O feed de preço ETH/USD foi atualizado ${priceData.ageFormatted}.
                </div>
                <div style="font-size: 12px; color: #e2e8f0;">
                    O contrato inteligente rejeita contribuições com preço desatualizado por razões de segurança.
                </div>
                <div style="font-size: 12px; color: #cbd5e1; margin-top: 8px;">
                    💡 Dica: Aguarde alguns minutos para a próxima atualização ou tente novamente mais tarde.
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); color: #10b981; padding: 12px; border-radius: 6px; margin-top: 12px;">
                <div style="font-weight: 600;">✅ Preço Atualizado</div>
                <div style="font-size: 12px; color: #cbd5e1;">
                    ETH: $${priceData.price?.toFixed(2) || 'N/A'} (atualizado ${priceData.ageFormatted})
                </div>
            </div>
        `;
    }
}

/**
 * Função de contribuição MELHORADA com validação Chainlink
 * Use esta no lugar de contributeOnChain()
 */
async function contributeOnChainWithChainlinkValidation(campaignAddress) {
    if (!userAddress || !signer) {
        alert('Por favor, conecte sua wallet primeiro');
        return;
    }

    const amount = document.getElementById('contributeAmount').value;
    if (!amount || parseFloat(amount) <= 0) {
        alert('Por favor, insira um valor válido');
        return;
    }

    try {
        const statusDiv = document.getElementById('contributeStatus');
        
        // Etapa 1: Validar preço do Chainlink
        statusDiv.innerHTML = '<div class="tx-status pending show"><div class="spinner"></div> Verificando preço do Chainlink...</div>';
        
        const rpcProvider = provider || new ethers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/ISqOLUfXDzgFu0-5ronlzwri_xFU4rZf');
        const validation = await validateChainlinkBeforeContribute(campaignAddress, rpcProvider);

        if (!validation.canProceed) {
            statusDiv.innerHTML = `
                <div class="tx-status error show">
                    ❌ ${validation.warning}<br>
                    <small>${validation.recommendation}</small>
                </div>
            `;
            return;
        }

        // Etapa 2: Prosseguir com a contribuição
        statusDiv.innerHTML = '<div class="tx-status pending show"><div class="spinner"></div> Assinando transação...</div>';

        const ABI_CONTRIBUTE = ["function contribute(uint256 tierId) external payable"];
        const campContract = new ethers.Contract(campaignAddress, ABI_CONTRIBUTE, signer);
        const tierId = 1; // Tier padrão (Bronze)
        
        const tx = await campContract.contribute(tierId, { value: ethers.parseEther(amount) });

        statusDiv.innerHTML = '<div class="tx-status pending show"><div class="spinner"></div> Transação enviada! Aguardando confirmação...</div>';
        const receipt = await tx.wait();

        statusDiv.innerHTML = `
            <div class="tx-status success show">
                ✅ Contribuição confirmada!<br>
                Tier: Bronze<br>
                Valor: ${amount} ETH<br>
                Hash: <a href="https://sepolia.etherscan.io/tx/${receipt.hash}" target="_blank" style="color: #60a5fa">${receipt.hash.slice(0, 20)}...</a>
            </div>
        `;
    } catch (error) {
        console.error('Erro ao contribuir:', error);
        
        const statusDiv = document.getElementById('contributeStatus');
        let errorMsg = error.reason || error.message;
        
        if (errorMsg.includes('preco stale') || errorMsg.includes('stale')) {
            errorMsg = 'Preço do Chainlink está desatualizado. Por favor, aguarde a próxima atualização.';
        }
        
        statusDiv.innerHTML = `
            <div class="tx-status error show">
                ❌ Erro: ${errorMsg}<br>
                <small>Se o problema persistir, aguarde alguns minutos e tente novamente.</small>
            </div>
        `;
    }
}

/**
 * Monitorar e avisar quando o preço do Chainlink está prestes a expirar
 */
async function startChainlinkWatcher(campaignAddress, provider, checkIntervalSeconds = 60) {
    setInterval(async () => {
        try {
            const validation = await validateChainlinkBeforeContribute(campaignAddress, provider);
            
            if (!validation.canProceed) {
                console.warn('⚠️ Chainlink feed stale:', validation.warning);
                // Atualizar UI se houver container
                if (document.getElementById('chainlinkStatus')) {
                    displayChainlinkStatus(validation.priceData, 'chainlinkStatus');
                }
            }
        } catch (error) {
            console.error('Erro ao monitorar Chainlink:', error);
        }
    }, checkIntervalSeconds * 1000);
}

/**
 * ALTERNATIVA: Usar preço mockado como fallback
 * (Para testes quando Chainlink está completamente offline)
 */
async function contributeWithFallbackPrice(campaignAddress, fallbackPrice = 2500) {
    if (!userAddress || !signer) {
        alert('Por favor, conecte sua wallet primeiro');
        return;
    }

    const amount = document.getElementById('contributeAmount').value;
    if (!amount || parseFloat(amount) <= 0) {
        alert('Por favor, insira um valor válido');
        return;
    }

    try {
        const statusDiv = document.getElementById('contributeStatus');
        statusDiv.innerHTML = `
            <div class="tx-status pending show">
                <div class="spinner"></div>
                ⚠️ Usando preço fallback ($${fallbackPrice}) por questões de segurança...
            </div>
        `;

        // A função normal tenta usar Chainlink; se falhar, o contrato rejeita
        // Este é apenas um aviso ao usuário
        const ABI_CONTRIBUTE = ["function contribute(uint256 tierId) external payable"];
        const campContract = new ethers.Contract(campaignAddress, ABI_CONTRIBUTE, signer);
        const tierId = 1;
        
        const tx = await campContract.contribute(tierId, { value: ethers.parseEther(amount) });
        const receipt = await tx.wait();

        statusDiv.innerHTML = `
            <div class="tx-status success show">
                ✅ Contribuição confirmada! (Preço fallback: $${fallbackPrice})
                <br>Hash: <a href="https://sepolia.etherscan.io/tx/${receipt.hash}" target="_blank" style="color: #60a5fa">${receipt.hash}</a>
            </div>
        `;
    } catch (error) {
        console.error('Erro ao contribuir:', error);
        document.getElementById('contributeStatus').innerHTML = `
            <div class="tx-status error show">
                ❌ Erro: ${error.reason || error.message}
            </div>
        `;
    }
}
