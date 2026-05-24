// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {SpaceRunnerScores} from "../src/SpaceRunnerScores.sol";

contract SpaceRunnerScoresTest {
    SpaceRunnerScores private scores;

    event RunSubmitted(
        address indexed player,
        uint256 score,
        uint256 bestScore,
        uint64 survivedSeconds,
        bool newBest,
        bool reachedOneThousand
    );
    event RunStarted(address indexed player, uint64 startedRuns, uint64 startedAt);

    function setUp() public {
        scores = new SpaceRunnerScores();
    }

    function testStoresBestScore() public {
        scores.submitRun(420, 31);
        SpaceRunnerScores.PlayerStats memory stats = scores.getPlayerStats(address(this));

        require(stats.bestScore == 420, "best score mismatch");
        require(stats.runs == 1, "run count mismatch");
        require(stats.startedRuns == 0, "started runs mismatch");
        require(stats.lastSurvivedSeconds == 31, "survival mismatch");
        require(!stats.reachedOneThousand, "achievement should be locked");
    }

    function testStartsRun() public {
        scores.startRun();
        SpaceRunnerScores.PlayerStats memory stats = scores.getPlayerStats(address(this));

        require(stats.bestScore == 0, "best score should stay empty");
        require(stats.runs == 0, "submitted runs should stay empty");
        require(stats.startedRuns == 1, "started runs mismatch");
        require(stats.lastStartedAt > 0, "start timestamp missing");
        require(stats.updatedAt == stats.lastStartedAt, "updated timestamp mismatch");
    }

    function testStartRunIncrements() public {
        scores.startRun();
        scores.startRun();
        SpaceRunnerScores.PlayerStats memory stats = scores.getPlayerStats(address(this));

        require(stats.startedRuns == 2, "started runs mismatch");
    }

    function testDoesNotLowerBestScore() public {
        scores.submitRun(900, 52);
        scores.submitRun(300, 18);
        SpaceRunnerScores.PlayerStats memory stats = scores.getPlayerStats(address(this));

        require(stats.bestScore == 900, "best score lowered");
        require(stats.runs == 2, "run count mismatch");
        require(stats.lastSurvivedSeconds == 18, "survival mismatch");
    }

    function testUnlocksOneThousandAchievement() public {
        scores.submitRun(1_000, 60);
        SpaceRunnerScores.PlayerStats memory stats = scores.getPlayerStats(address(this));

        require(stats.bestScore == 1_000, "best score mismatch");
        require(stats.reachedOneThousand, "achievement should unlock");
    }

    function testStoresLongSurvivalTime() public {
        scores.submitRun(1_250, 184);
        SpaceRunnerScores.PlayerStats memory stats = scores.getPlayerStats(address(this));

        require(stats.bestScore == 1_250, "best score mismatch");
        require(stats.lastSurvivedSeconds == 184, "survival mismatch");
    }
}
