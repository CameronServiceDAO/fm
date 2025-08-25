// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title GameweekPointsStore
/// @notice Stores the number of points each player earns in each gameweek
contract GameweekPointsStore {
    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/
    error NotOwner();

    /*//////////////////////////////////////////////////////////////
                                STATE
    //////////////////////////////////////////////////////////////*/
    address public owner;

    /// @dev Mapping: gameweek => playerId => points
    mapping(uint256 => mapping(uint256 => uint256)) private points;

    bool public seeded; // prevent double-seeding

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/
    event PointsSet(uint256 indexed gameweek, uint256 indexed playerId, uint256 points);
    event DummyDataSeeded(uint256 gameweeks, uint256 players);

    /*//////////////////////////////////////////////////////////////
                              MODIFIERS
    //////////////////////////////////////////////////////////////*/
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    /*//////////////////////////////////////////////////////////////
                             CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/
    constructor() {
        owner = msg.sender;
    }

    /*//////////////////////////////////////////////////////////////
                             WRITE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Set the points for a given player in a given gameweek
    function setPoints(uint256 gameweek, uint256 playerId, uint256 pts) external onlyOwner {
        points[gameweek][playerId] = pts;
        emit PointsSet(gameweek, playerId, pts);
    }

    /// @notice Batch set points for multiple players in a single gameweek
    function setPointsBatch(uint256 gameweek, uint256[] calldata playerIds, uint256[] calldata pts) external onlyOwner {
        require(playerIds.length == pts.length, "Length mismatch");
        for (uint256 i = 0; i < playerIds.length; i++) {
            points[gameweek][playerIds[i]] = pts[i];
            emit PointsSet(gameweek, playerIds[i], pts[i]);
        }
    }

    /// @notice Seed dummy data for players 1..5 across gameweeks 1..3 (owner-only, one-time)
    function seedDummy3GW() external onlyOwner {
        require(!seeded, "already seeded");

        // ------- GW 1 -------
        points[1][1] = 6;  emit PointsSet(1, 1, 6);
        points[1][2] = 2;  emit PointsSet(1, 2, 2);
        points[1][3] = 9;  emit PointsSet(1, 3, 9);
        points[1][4] = 3;  emit PointsSet(1, 4, 3);
        points[1][5] = 1;  emit PointsSet(1, 5, 1);

        // ------- GW 2 -------
        points[2][1] = 5;  emit PointsSet(2, 1, 5);
        points[2][2] = 12; emit PointsSet(2, 2, 12);
        points[2][3] = 1;  emit PointsSet(2, 3, 1);
        points[2][4] = 4;  emit PointsSet(2, 4, 4);
        points[2][5] = 8;  emit PointsSet(2, 5, 8);

        // ------- GW 3 -------
        points[3][1] = 8;  emit PointsSet(3, 1, 8);
        points[3][2] = 4;  emit PointsSet(3, 2, 4);
        points[3][3] = 7;  emit PointsSet(3, 3, 7);
        points[3][4] = 10; emit PointsSet(3, 4, 10);
        points[3][5] = 0;  emit PointsSet(3, 5, 0);

        seeded = true;
        emit DummyDataSeeded(3, 5);
    }

    /*//////////////////////////////////////////////////////////////
                             READ FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Get the points scored by a player in a given gameweek
    function getPoints(uint256 gameweek, uint256 playerId) external view returns (uint256 pts) {
        return points[gameweek][playerId];
    }

    /// @notice Convenience helper: batch read a gameweek’s points for a list of player IDs
    function getPointsBatch(uint256 gameweek, uint256[] calldata playerIds) external view returns (uint256[] memory out) {
        out = new uint256[](playerIds.length);
        for (uint256 i = 0; i < playerIds.length; i++) {
            out[i] = points[gameweek][playerIds[i]];
        }
    }
}
