// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title SpaceRunnerScores
/// @notice Stores each player's best Space Runner score and basic achievement flags.
/// @dev Gameplay stays offchain; only score summaries are submitted.
contract SpaceRunnerScores {
    struct PlayerStats {
        uint256 bestScore;
        uint64 runs;
        uint64 startedRuns;
        uint64 lastSurvivedSeconds;
        uint64 lastStartedAt;
        uint64 updatedAt;
        bool reachedOneThousand;
    }

    mapping(address player => PlayerStats stats) private playerStats;

    event RunSubmitted(
        address indexed player,
        uint256 score,
        uint256 bestScore,
        uint64 survivedSeconds,
        bool newBest,
        bool reachedOneThousand
    );
    event RunStarted(address indexed player, uint64 startedRuns, uint64 startedAt);

    error ZeroPlayer();

    function startRun() external {
        if (msg.sender == address(0)) {
            revert ZeroPlayer();
        }

        PlayerStats storage stats = playerStats[msg.sender];
        stats.startedRuns += 1;
        stats.lastStartedAt = uint64(block.timestamp);
        stats.updatedAt = uint64(block.timestamp);

        emit RunStarted(msg.sender, stats.startedRuns, stats.lastStartedAt);
    }

    function submitRun(uint256 score, uint64 survivedSeconds) external {
        if (msg.sender == address(0)) {
            revert ZeroPlayer();
        }

        PlayerStats storage stats = playerStats[msg.sender];
        bool newBest = score > stats.bestScore;

        if (newBest) {
            stats.bestScore = score;
        }

        stats.runs += 1;
        stats.lastSurvivedSeconds = survivedSeconds;
        stats.updatedAt = uint64(block.timestamp);

        if (stats.bestScore >= 1_000) {
            stats.reachedOneThousand = true;
        }

        emit RunSubmitted(
            msg.sender,
            score,
            stats.bestScore,
            survivedSeconds,
            newBest,
            stats.reachedOneThousand
        );
    }

    function getPlayerStats(address player) external view returns (PlayerStats memory) {
        return playerStats[player];
    }
}
