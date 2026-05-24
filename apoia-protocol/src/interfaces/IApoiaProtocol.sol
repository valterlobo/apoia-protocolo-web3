// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IApoiaProtocol {
    enum CampaignStatus {
        ACTIVE,
        SUCCEEDED,
        APPROVED,
        FAILED,
        REJECTED,
        WITHDRAWN
    }

    function getGlobalStats()
        external
        view
        returns (uint256 totalCampaigns, uint256 totalRaised, uint256 activeCampaigns, uint256 agtStaked);
    function getCampaignsByStatus(uint256 status) external view returns (address[] memory);
    function getCampaignsByOwner(address owner) external view returns (address[] memory);
}
