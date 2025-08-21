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

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/
    event PointsSet(uint256 indexed gameweek, uint256 indexed playerId, uint256 points);

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
    /// @param gameweek Gameweek number
    /// @param playerId Player identifier
    /// @param pts Number of points scored
    function setPoints(uint256 gameweek, uint256 playerId, uint256 pts) external onlyOwner {
        points[gameweek][playerId] = pts;
        emit PointsSet(gameweek, playerId, pts);
    }

    /// @notice Batch set points for multiple players in a single gameweek
    /// @param gameweek Gameweek number
    /// @param playerIds Array of player IDs
    /// @param pts Array of point values (must be same length as playerIds)
    function setPointsBatch(uint256 gameweek, uint256[] calldata playerIds, uint256[] calldata pts) external onlyOwner {
        require(playerIds.length == pts.length, "Length mismatch");
        for (uint256 i = 0; i < playerIds.length; i++) {
            points[gameweek][playerIds[i]] = pts[i];
            emit PointsSet(gameweek, playerIds[i], pts[i]);
        }
    }

    /*//////////////////////////////////////////////////////////////
                             READ FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Get the points scored by a player in a given gameweek
    /// @param gameweek Gameweek number
    /// @param playerId Player identifier
    /// @return pts Number of points scored
    function getPoints(uint256 gameweek, uint256 playerId) external view returns (uint256 pts) {
        return points[gameweek][playerId];
    }
}
