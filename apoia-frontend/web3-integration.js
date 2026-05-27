/**
 * APOIA Protocol - Web3 Integration with ethers.js
 * Integração completa com os smart contracts
 */

// ============================================
// SMART CONTRACT ABIs
// ============================================

const ABI_CAMPAIGN = [
    "function contribute(uint256 tierId) external payable",
    "function getDetails() external view returns (string memory title, address creator, uint256 softCap, uint256 hardCap, uint256 raised, uint8 status)",
    "function executeWithdrawal() external nonReentrant",
    "function claimRefund(uint256 tokenId) external",
    "function pause() external onlyOwner",
    "function unpause() external onlyOwner",
    "event Contributed(indexed address contributor, uint256 amount, uint256 usdValue, uint256 tierId)",
    "event Withdrawal(indexed address creator, uint256 amount, uint256 timestamp)",
    "event CampaignStatusChanged(uint8 newStatus, uint256 timestamp)"
];

const ABI_CAMPAIGN_FACTORY = [
    "function createCampaign(string memory _title, string memory _description, uint256 _softCap, uint256 _hardCap, uint256 _deadline) external returns (address)",
    "function getCampaignCount() external view returns (uint256)",
    "function getCampaignAt(uint256 index) external view returns (address)",
    "function getCampaignsByCreator(address creator) external view returns (address[])",
    "event CampaignCreated(indexed address campaignAddress, indexed address creator, string title, uint256 timestamp)"
];

const ABI_AGT_TOKEN = [
    "function mint(address to, uint256 amount) external onlyMinter",
    "function burn(uint256 amount) external",
    "function createVestingSchedule(address beneficiary, uint256 amount, uint256 cliff, uint256 duration) external onlyMinter",
    "function releaseVesting(address beneficiary) external returns (uint256)",
    "function revokeVesting(address beneficiary) external onlyOwner",
    "function balanceOf(address account) external view returns (uint256)",
    "function transfer(address recipient, uint256 amount) external returns (bool)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "event VestingScheduleCreated(indexed address beneficiary, uint256 amount, uint256 cliff, uint256 duration)",
    "event VestingReleased(indexed address beneficiary, uint256 amount)"
];

const ABI_APOIA_DAO = [
    "function propose(address[] memory targets, uint[] memory values, bytes[] memory calldatas, string memory description) external returns (uint)",
    "function castVote(uint proposalId, uint8 support) external",
    "function execute(address[] memory targets, uint[] memory values, bytes[] memory calldatas, bytes32 descriptionHash) external payable",
    "function getProposalState(uint proposalId) external view returns (uint8)",
    "function getProposalDetails(uint proposalId) external view returns (string memory description, uint startBlock, uint endBlock, uint forVotes, uint againstVotes)",
    "event ProposalCreated(indexed uint id, indexed address proposer, string description, uint startBlock, uint endBlock)",
    "event VoteCast(indexed address voter, uint proposalId, uint8 support, uint weight)"
];

const ABI_STAKING_AGT = [
    "function stake(uint256 amount, uint256 duration) external",
    "function unstake() external",
    "function claim() external returns (uint256)",
    "function getStakedAmount(address staker) external view returns (uint256)",
    "function getVotingMultiplier(address staker) external view returns (uint256)",
    "function calculateReward(address staker) external view returns (uint256)",
    "event Staked(indexed address staker, uint256 amount, uint256 duration)",
    "event Unstaked(indexed address staker, uint256 amount)",
    "event RewardClaimed(indexed address staker, uint256 amount)"
];

const ABI_TIER_MANAGER = [
    "function mintTierNFT(address to, uint256 tier, uint256 amount) external",
    "function burnTierNFT(address from, uint256 tier, uint256 amount) external",
    "function balanceOf(address account, uint256 id) external view returns (uint256)",
    "function getTierDetails(uint256 tier) external view returns (string memory name, uint256 minAmount, uint256 bonus)",
    "event TierMinted(indexed address to, uint256 tier, uint256 amount)",
    "event TierBurned(indexed address from, uint256 tier, uint256 amount)"
];

const ABI_CHAINLINK_FEED = [
    "function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)"
];

// ============================================
// WEB3 CONNECTION MANAGER
// ============================================

class Web3Manager {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.userAddress = null;
        this.network = null;
        this.contracts = {};
    }

    async connectWallet() {
        try {
            if (!window.ethereum) {
                throw new Error('MetaMask não está instalado');
            }

            const provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            this.provider = provider;
            this.userAddress = accounts[0];
            this.signer = await provider.getSigner();
            this.network = await provider.getNetwork();

            console.log('✅ Conectado:', this.userAddress);
            console.log('🌐 Rede:', this.network.name);

            this.initializeContracts();
            return this.userAddress;
        } catch (error) {
            console.error('❌ Erro ao conectar wallet:', error);
            throw error;
        }
    }

    disconnectWallet() {
        this.provider = null;
        this.signer = null;
        this.userAddress = null;
        this.contracts = {};
    }

    initializeContracts() {
        // Endereços dos contratos deployados em Sepolia (11155111)
        const contractAddresses = {
            campaignFactory: '0xb385a9feeb0e4064bc7e2e4a89b6496e6864e8e7',  // ✅ Sepolia
            agtToken: '0xb9cc185e0aea3486e3915b04286618610a995d3a',         // ✅ Sepolia
            apioaDAO: '0x5181bc4a74d252e1f10678a7e32ae91c8518061a',        // ✅ Sepolia
            stakingAGT: '0x9dbefad6cd0c96b5e64f4b963d1b85bfac02c1ff',       // ✅ Sepolia
            treasuryDAO: '0x4780e8a81112e725741ac70e2d02a3c8ad04bfd5',     // ✅ Sepolia
            chainlinkFeed: '0x694AA1769357215DE4FAC081bf1f309aDC325306'     // ✅ Sepolia ETH/USD
        };

        this.contracts = {
            campaignFactory: new ethers.Contract(
                contractAddresses.campaignFactory,
                ABI_CAMPAIGN_FACTORY,
                this.signer || this.provider
            ),
            agtToken: new ethers.Contract(
                contractAddresses.agtToken,
                ABI_AGT_TOKEN,
                this.signer || this.provider
            ),
            apoiaDAO: new ethers.Contract(
                contractAddresses.apioaDAO,
                ABI_APOIA_DAO,
                this.signer || this.provider
            ),
            stakingAGT: new ethers.Contract(
                contractAddresses.stakingAGT,
                ABI_STAKING_AGT,
                this.signer || this.provider
            ),
            chainlinkFeed: new ethers.Contract(
                contractAddresses.chainlinkFeed,
                ABI_CHAINLINK_FEED,
                this.signer || this.provider
            )
        };
        
        // Guardar endereços para referência
        this.contractAddresses = contractAddresses;
    }

    isConnected() {
        return this.userAddress !== null;
    }

    getAddress() {
        return this.userAddress;
    }
}

// ============================================
// CAMPAIGN MANAGER
// ============================================

class CampaignManager {
    constructor(web3Manager) {
        this.web3 = web3Manager;
        this.campaignTiers = []; // Armazenar tiers temporariamente
    }

    async createCampaign(title, description, softCap, hardCap, deadline, tiers = []) {
        if (!this.web3.isConnected()) {
            throw new Error('Wallet não conectado');
        }

        try {
            console.log('📝 Criando campanha:', { title, softCap, hardCap, tiersCount: tiers.length });

            const tx = await this.web3.contracts.campaignFactory.createCampaign(
                title,
                description,
                ethers.parseEther(softCap.toString()),
                ethers.parseEther(hardCap.toString()),
                Math.floor(deadline / 1000)
            );

            const receipt = await tx.wait();
            console.log('✅ Campanha criada:', receipt.hash);

            // Armazenar tiers para essa campanha (será associado via evento)
            this.campaignTiers = tiers;

            return receipt;
        } catch (error) {
            console.error('❌ Erro ao criar campanha:', error);
            throw error;
        }
    }

    // Adicionar tier à campanha (armazenar localmente antes de criar)
    addCampaignTier(tierId, name, minAmount, bonus = 0) {
        this.campaignTiers.push({
            id: tierId,
            name: name,
            minAmount: ethers.parseEther(minAmount.toString()),
            bonus: bonus
        });
        console.log('✅ Tier adicionado:', name);
        return this.campaignTiers;
    }

    // Limpar tiers temporários
    clearCampaignTiers() {
        this.campaignTiers = [];
        console.log('🗑️ Tiers limpos');
    }

    // Obter tiers da campanha atual
    getCampaignTiers() {
        return this.campaignTiers;
    }

    async contributeToCampaign(campaignAddress, amount, tierId = 0) {
        if (!this.web3.isConnected()) {
            throw new Error('Wallet não conectado');
        }

        try {
            console.log('💰 Contribuindo:', { campaign: campaignAddress, amount, tier: tierId });

            const campaign = new ethers.Contract(
                campaignAddress,
                ABI_CAMPAIGN,
                this.web3.signer
            );

            // Chamar contribute com tierId
            const tx = await campaign.contribute(tierId, {
                value: ethers.parseEther(amount.toString())
            });

            const receipt = await tx.wait();
            console.log('✅ Contribuição confirmada:', receipt.hash);

            return receipt;
        } catch (error) {
            console.error('❌ Erro ao contribuir:', error);
            throw error;
        }
    }

    async getCampaignDetails(campaignAddress) {
        try {
            const campaign = new ethers.Contract(
                campaignAddress,
                ABI_CAMPAIGN,
                this.web3.provider || this.web3.signer
            );

            const details = await campaign.getDetails();
            return {
                title: details[0],
                creator: details[1],
                softCap: ethers.formatEther(details[2]),
                hardCap: ethers.formatEther(details[3]),
                raised: ethers.formatEther(details[4]),
                status: details[5]
            };
        } catch (error) {
            console.error('❌ Erro ao buscar detalhes:', error);
            throw error;
        }
    }

    async getCampaignsByUser(userAddress) {
        try {
            const campaigns = await this.web3.contracts.campaignFactory.getCampaignsByCreator(userAddress);
            return campaigns;
        } catch (error) {
            console.error('❌ Erro ao buscar campanhas do usuário:', error);
            throw error;
        }
    }

    async executeWithdrawal(campaignAddress) {
        if (!this.web3.isConnected()) {
            throw new Error('Wallet não conectado');
        }

        try {
            console.log('💸 Executando saque:', campaignAddress);

            const campaign = new ethers.Contract(
                campaignAddress,
                ABI_CAMPAIGN,
                this.web3.signer
            );

            const tx = await campaign.executeWithdrawal();
            const receipt = await tx.wait();
            console.log('✅ Saque confirmado:', receipt.hash);

            return receipt;
        } catch (error) {
            console.error('❌ Erro ao executar saque:', error);
            throw error;
        }
    }
}

// ============================================
// TOKEN MANAGER (AGT)
// ============================================

class TokenManager {
    constructor(web3Manager) {
        this.web3 = web3Manager;
    }

    async getBalance(address = null) {
        try {
            const targetAddress = address || this.web3.userAddress;
            const balance = await this.web3.contracts.agtToken.balanceOf(targetAddress);
            return ethers.formatEther(balance);
        } catch (error) {
            console.error('❌ Erro ao buscar saldo:', error);
            throw error;
        }
    }

    async transfer(recipient, amount) {
        if (!this.web3.isConnected()) {
            throw new Error('Wallet não conectado');
        }

        try {
            console.log('📤 Transferindo AGT:', { recipient, amount });

            const tx = await this.web3.contracts.agtToken.transfer(
                recipient,
                ethers.parseEther(amount.toString())
            );

            const receipt = await tx.wait();
            console.log('✅ Transferência confirmada:', receipt.hash);

            return receipt;
        } catch (error) {
            console.error('❌ Erro ao transferir:', error);
            throw error;
        }
    }

    async approve(spender, amount) {
        if (!this.web3.isConnected()) {
            throw new Error('Wallet não conectado');
        }

        try {
            console.log('✅ Aprovando AGT:', { spender, amount });

            const tx = await this.web3.contracts.agtToken.approve(
                spender,
                ethers.parseEther(amount.toString())
            );

            const receipt = await tx.wait();
            console.log('✅ Aprovação confirmada:', receipt.hash);

            return receipt;
        } catch (error) {
            console.error('❌ Erro ao aprovar:', error);
            throw error;
        }
    }

    async createVestingSchedule(beneficiary, amount, cliff, duration) {
        if (!this.web3.isConnected()) {
            throw new Error('Wallet não conectado');
        }

        try {
            console.log('⏰ Criando vesting:', { beneficiary, amount, cliff, duration });

            const tx = await this.web3.contracts.agtToken.createVestingSchedule(
                beneficiary,
                ethers.parseEther(amount.toString()),
                cliff,
                duration
            );

            const receipt = await tx.wait();
            console.log('✅ Vesting criado:', receipt.hash);

            return receipt;
        } catch (error) {
            console.error('❌ Erro ao criar vesting:', error);
            throw error;
        }
    }

    async releaseVesting(beneficiary) {
        if (!this.web3.isConnected()) {
            throw new Error('Wallet não conectado');
        }

        try {
            console.log('🎁 Liberando vesting:', beneficiary);

            const tx = await this.web3.contracts.agtToken.releaseVesting(beneficiary);
            const receipt = await tx.wait();
            console.log('✅ Vesting liberado:', receipt.hash);

            return receipt;
        } catch (error) {
            console.error('❌ Erro ao liberar vesting:', error);
            throw error;
        }
    }
}

// ============================================
// STAKING MANAGER
// ============================================

class StakingManager {
    constructor(web3Manager) {
        this.web3 = web3Manager;
    }

    async stake(amount, duration) {
        if (!this.web3.isConnected()) {
            throw new Error('Wallet não conectado');
        }

        try {
            console.log('💎 Fazendo stake:', { amount, duration });

            // Primeiro, aprovar o contrato
            await this.web3.contracts.agtToken.approve(
                this.web3.contracts.stakingAGT.target,
                ethers.parseEther(amount.toString())
            );

            const tx = await this.web3.contracts.stakingAGT.stake(
                ethers.parseEther(amount.toString()),
                duration
            );

            const receipt = await tx.wait();
            console.log('✅ Stake confirmado:', receipt.hash);

            return receipt;
        } catch (error) {
            console.error('❌ Erro ao fazer stake:', error);
            throw error;
        }
    }

    async unstake() {
        if (!this.web3.isConnected()) {
            throw new Error('Wallet não conectado');
        }

        try {
            console.log('🔓 Desfazendo stake...');

            const tx = await this.web3.contracts.stakingAGT.unstake();
            const receipt = await tx.wait();
            console.log('✅ Unstake confirmado:', receipt.hash);

            return receipt;
        } catch (error) {
            console.error('❌ Erro ao desfazer stake:', error);
            throw error;
        }
    }

    async claim() {
        if (!this.web3.isConnected()) {
            throw new Error('Wallet não conectado');
        }

        try {
            console.log('🎯 Resgatando rewards...');

            const tx = await this.web3.contracts.stakingAGT.claim();
            const receipt = await tx.wait();
            console.log('✅ Rewards resgatados:', receipt.hash);

            return receipt;
        } catch (error) {
            console.error('❌ Erro ao resgatar rewards:', error);
            throw error;
        }
    }

    async getStakedAmount(address = null) {
        try {
            const targetAddress = address || this.web3.userAddress;
            const amount = await this.web3.contracts.stakingAGT.getStakedAmount(targetAddress);
            return ethers.formatEther(amount);
        } catch (error) {
            console.error('❌ Erro ao buscar stake:', error);
            throw error;
        }
    }

    async getVotingMultiplier(address = null) {
        try {
            const targetAddress = address || this.web3.userAddress;
            const multiplier = await this.web3.contracts.stakingAGT.getVotingMultiplier(targetAddress);
            return Number(multiplier);
        } catch (error) {
            console.error('❌ Erro ao buscar multiplicador:', error);
            throw error;
        }
    }

    async calculateReward(address = null) {
        try {
            const targetAddress = address || this.web3.userAddress;
            const reward = await this.web3.contracts.stakingAGT.calculateReward(targetAddress);
            return ethers.formatEther(reward);
        } catch (error) {
            console.error('❌ Erro ao calcular rewards:', error);
            throw error;
        }
    }
}

// ============================================
// DAO MANAGER
// ============================================

class DAOManager {
    constructor(web3Manager) {
        this.web3 = web3Manager;
    }

    async propose(targets, values, calldatas, description) {
        if (!this.web3.isConnected()) {
            throw new Error('Wallet não conectado');
        }

        try {
            console.log('📝 Criando proposta...');

            const tx = await this.web3.contracts.apoiaDAO.propose(
                targets,
                values,
                calldatas,
                description
            );

            const receipt = await tx.wait();
            console.log('✅ Proposta criada:', receipt.hash);

            return receipt;
        } catch (error) {
            console.error('❌ Erro ao criar proposta:', error);
            throw error;
        }
    }

    async castVote(proposalId, support) {
        if (!this.web3.isConnected()) {
            throw new Error('Wallet não conectado');
        }

        try {
            console.log('🗳️ Votando:', { proposalId, support });

            const tx = await this.web3.contracts.apoiaDAO.castVote(proposalId, support);
            const receipt = await tx.wait();
            console.log('✅ Voto confirmado:', receipt.hash);

            return receipt;
        } catch (error) {
            console.error('❌ Erro ao votar:', error);
            throw error;
        }
    }

    async getProposalState(proposalId) {
        try {
            const state = await this.web3.contracts.apoiaDAO.getProposalState(proposalId);
            const states = ['Pending', 'Active', 'Succeeded', 'Defeated', 'Executed', 'Cancelled'];
            return states[state] || 'Unknown';
        } catch (error) {
            console.error('❌ Erro ao buscar estado:', error);
            throw error;
        }
    }

    async getProposalDetails(proposalId) {
        try {
            const details = await this.web3.contracts.apoiaDAO.getProposalDetails(proposalId);
            return {
                description: details[0],
                startBlock: Number(details[1]),
                endBlock: Number(details[2]),
                forVotes: ethers.formatEther(details[3]),
                againstVotes: ethers.formatEther(details[4])
            };
        } catch (error) {
            console.error('❌ Erro ao buscar detalhes:', error);
            throw error;
        }
    }
}

// ============================================
// ORACLE MANAGER (Chainlink)
// ============================================

class OracleManager {
    constructor(web3Manager) {
        this.web3 = web3Manager;
    }

    async getLatestPrice() {
        try {
            const roundData = await this.web3.contracts.chainlinkFeed.latestRoundData();
            const price = Number(roundData.answer) / 1e8; // Chainlink returns 8 decimals
            const timestamp = Number(roundData.updatedAt);
            const roundId = Number(roundData.roundId);

            return {
                price,
                timestamp,
                roundId,
                isFresh: this.isPriceDataFresh(timestamp)
            };
        } catch (error) {
            console.error('❌ Erro ao buscar preço:', error);
            throw error;
        }
    }

    isPriceDataFresh(timestamp, maxStaleness = 3600) {
        const now = Math.floor(Date.now() / 1000);
        return (now - timestamp) <= maxStaleness;
    }
}

// ============================================
// TIER MANAGER
// ============================================

class TierManagerHelper {
    constructor(web3Manager) {
        this.web3 = web3Manager;
        this.defaultTiers = [
            { id: 1, name: '🥉 Bronze', minAmount: '0.1', bonus: 5 },
            { id: 2, name: '🥈 Prata', minAmount: '0.5', bonus: 10 },
            { id: 3, name: '🥇 Ouro', minAmount: '1.0', bonus: 15 }
        ];
    }

    async getBalance(account, tokenId) {
        try {
            const balance = await this.web3.contracts.tierManager.balanceOf(account, tokenId);
            return Number(balance);
        } catch (error) {
            console.error('❌ Erro ao buscar balanço:', error);
            throw error;
        }
    }

    async getTierDetails(tierId) {
        try {
            const details = await this.web3.contracts.tierManager.getTierDetails(tierId);
            return {
                name: details[0],
                minAmount: ethers.formatEther(details[1]),
                bonus: Number(details[2])
            };
        } catch (error) {
            console.error('❌ Erro ao buscar detalhes do tier:', error);
            throw error;
        }
    }

    async mintTierNFT(account, tierId, amount) {
        if (!this.web3.isConnected()) {
            throw new Error('Wallet não conectado');
        }

        try {
            console.log('🎁 Criando Tier NFT:', { account, tierId, amount });
            const tx = await this.web3.contracts.tierManager.mintTierNFT(
                account,
                tierId,
                ethers.parseEther(amount.toString())
            );
            const receipt = await tx.wait();
            console.log('✅ Tier NFT criado:', receipt.hash);
            return receipt;
        } catch (error) {
            console.error('❌ Erro ao criar Tier NFT:', error);
            throw error;
        }
    }

    // Obter tiers padrão
    getDefaultTiers() {
        return this.defaultTiers;
    }

    // Validar tier
    validateTier(tier) {
        return tier.id && tier.name && tier.minAmount >= 0;
    }

    // Formatar tier para exibição
    formatTier(tier) {
        return {
            id: tier.id,
            name: tier.name,
            minAmount: parseFloat(tier.minAmount),
            bonus: tier.bonus || 0,
            displayText: `${tier.name} - ${tier.minAmount} ETH+ (Bonus: ${tier.bonus}%)`
        };
    }
}

// ============================================
// EXPORT
// ============================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Web3Manager,
        CampaignManager,
        TokenManager,
        StakingManager,
        DAOManager,
        OracleManager,
        TierManagerHelper
    };
}
