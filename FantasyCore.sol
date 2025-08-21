// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

/// ============ INTERFACES============
interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
}

interface IGameweekPointsStore {
    function getPoints(uint256 gameweek, uint256 playerId) external view returns (uint256);
}

/// @title FantasyCore - base template for a crypto fantasy football game
contract FantasyCore {
    /*//////////////////////////////////////////////////////////////
                                OWNERSHIP
    //////////////////////////////////////////////////////////////*/
    address public owner;

    error NotOwner();
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    /*//////////////////////////////////////////////////////////////
                              STRUCTS
    //////////////////////////////////////////////////////////////*/
    struct player {
        uint256 id;
        uint256 basePrice;
        mapping(uint256 => uint256) scoresByGameweek;
        uint256 shares;
        uint256 ownershipScaleFactor;
    }

    struct user {
        address wallet;
        uint256 chips;
        uint256 lastClaim;
        uint256[] ownedPlayerIds;
        mapping(uint256 => uint256) squad; // playerId => shares
    }

    /*//////////////////////////////////////////////////////////////
                              STATE
    //////////////////////////////////////////////////////////////*/
    // mapping of player id's to player structs
    mapping(uint256 => player) internal players;     // playerId => player
    //track player id's
    uint256 public nextPlayerId;

    // mapping of wallet addresses to user structs
    mapping(address => user) public userProfiles;    // wallet => user
    // tracks total number of shares in circulation
    uint256 public totalShares;
    //tracks current gameweek
    uint256 public currentGameweek;
    //total number of gameweeks in season
    uint256 public totalGameweeks;
    //number of chips in circulation
    uint256 public totalChips;
    //current size of prize pool
    uint256 public prizePool;
    //factor for determining how to update the ownership scale factors each gameweek (in bps)
    uint256 public alpha;
    // USDC token contract
    IERC20 public usdc;                               
    //external points store
    IGameweekPointsStore public pointsStore;       
    //bonding curve sensitivity parameter
    uint256 sensitivityK;   
    //cap for maximum multiple of starting price
    uint256 cap;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/
    event ChipsPurchased(address indexed buyer, uint256 usdcIn, uint256 chipsOut, uint256 newTotalChips, uint256 newPrizePool);
    event OwnershipTransferred(address indexed from, address indexed to);
    event USDCSet(address indexed token);
    event PointsStoreSet(address indexed store);
    event ChipsClaimed(address indexed user, uint256 fromGameweek, uint256 toGameweek, uint256 chips);
    event ChipsRedeemed(address indexed redeemer, uint256 chipsIn, uint256 usdcOut, uint256 newTotalChips, uint256 newPrizePool);
    event GameweekAdvanced(uint256 fromGameweek, uint256 toGameweek);
    event PlayerSharesBought(address indexed buyer, uint256 indexed playerId, uint256 sharesBought, uint256 costChips);
    event PlayerSharesSold(address indexed seller, uint256 indexed playerId, uint256 sharesSold, uint256 chipsOut);


    /*//////////////////////////////////////////////////////////////
                             CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/
    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    /*//////////////////////////////////////////////////////////////
                         EXTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Buy chips by paying USDC (proportional-share pricing).
    /// @param usdcAmount Amount of USDC to spend (6 decimals).
    /// @param minChipsOut Slippage protection.
    function buyChipsWithUSDC(uint256 usdcAmount, uint256 minChipsOut) external {
        require(address(usdc) != address(0), "USDC not set");
        require(usdcAmount > 0, "Zero amount");
        require(usdc.allowance(msg.sender, address(this)) >= usdcAmount, "Insufficient allowance");

        uint256 P = prizePool;
        uint256 S = totalChips;

        uint256 chipsOut;
        if (S == 0 || P == 0) {
            // bootstrap: 1 USDC -> 1 chip
            chipsOut = usdcAmount;
        } else {
            // ΔS = S * U / P
            chipsOut = (S * usdcAmount) / P;
        }

        require(chipsOut > 0, "ChipsOut rounds to zero");
        require(chipsOut >= minChipsOut, "Slippage: chipsOut < min");

        bool ok = usdc.transferFrom(msg.sender, address(this), usdcAmount);
        require(ok, "USDC transfer failed");

        user storage u = userProfiles[msg.sender];
        if (u.wallet == address(0)) {
            u.wallet = msg.sender;
        }
        u.chips += chipsOut;

        totalChips = S + chipsOut;
        prizePool = P + usdcAmount;

        emit ChipsPurchased(msg.sender, usdcAmount, chipsOut, totalChips, prizePool);
    }

    //function for claiming chips earned by user's squad
    function claimChips(uint256[] calldata ownedPlayerIds) external returns (uint256 chipsClaimed) {
        require(address(pointsStore) != address(0), "Points store not set");
        user storage u = userProfiles[msg.sender];
        require(u.wallet != address(0), "User not registered");

        // Determine claimable range: (lastClaim + 1) .. (currentGameweek - 1)
        require(currentGameweek > 0, "Current GW not set");
        uint256 fromGw = u.lastClaim + 1;
        uint256 toGw = currentGameweek - 1;
        require(fromGw <= toGw, "Nothing to claim");

        // iterate through owned players in squad
        uint256 prev = 0;
        for (uint256 i = 0; i < ownedPlayerIds.length; i++) {
            uint256 pid = ownedPlayerIds[i];
            require(i == 0 || pid > prev, "playerIds not strictly increasing");
            prev = pid;

            uint256 shares = u.squad[pid];
            if (shares == 0) continue;

            uint256 playerSum = 0;
            for (uint256 gw = fromGw; gw <= toGw; gw++) {
                uint256 pts = pointsStore.getPoints(gw, pid);
                if (pts != 0) playerSum += pts * shares;
            }
            chipsClaimed += playerSum;
        }

        // Credit chips and advance lastClaim
        if (chipsClaimed != 0) {
            u.chips += chipsClaimed;
            totalChips += chipsClaimed; // chips are minted via claims
        }
        u.lastClaim = toGw;

        emit ChipsClaimed(msg.sender, fromGw, toGw, chipsClaimed);
        return chipsClaimed;
    }

    //function for redeeming chips for proportional share of prize pool at end of season
    function redeemChips(uint256 chipsIn, uint256 minUsdcOut) external returns (uint256 usdcOut) {
        require(address(usdc) != address(0), "USDC not set");
        require(currentGameweek > totalGameweeks, "Season not finished");
        require(chipsIn > 0, "Zero chips");

        user storage u = userProfiles[msg.sender];
        require(u.wallet != address(0), "User not registered");
        require(u.chips >= chipsIn, "Insufficient chips");

        uint256 T = totalChips;
        uint256 P = prizePool;
        require(T > 0 && P > 0, "Nothing to redeem");

        // Proportional payout (floor)
        usdcOut = (P * chipsIn) / T;
        require(usdcOut >= minUsdcOut, "Slippage");

        // --- Effects (before external call) ---
        u.chips -= chipsIn;
        totalChips = T - chipsIn;
        prizePool = P - usdcOut;

        // --- Interaction ---
        require(usdc.transfer(msg.sender, usdcOut), "USDC transfer failed");

        emit ChipsRedeemed(msg.sender, chipsIn, usdcOut, totalChips, prizePool);
        return usdcOut;
    }

    //function for buying player shares with chips
    function buyPlayerShares(uint256 playerId, uint256 sharesToBuy, uint256 maxSpendChips) external returns (uint256 cost)
    {
        _claimPendingChips(msg.sender);
        require(playerId != 0 && playerId <= nextPlayerId, "Invalid playerId");
        require(sharesToBuy > 0, "Zero qty");
        require(_remainingGameweeks() > 0, "trading closed");

        user storage u = userProfiles[msg.sender];
        require(u.wallet != address(0), "User not registered");

        cost = quoteBuyCost(playerId, sharesToBuy);
        require(cost <= maxSpendChips, "Cost > max");
        require(u.chips >= cost, "Insufficient chips");

        // Effects: deduct chips and update holdings
        u.chips -= cost;
        // Burn chips to avoid trapped USDC at redemption time (keeps totalChips tracking redeemable supply)
        totalChips -= cost;

        uint256 beforeShares = u.squad[playerId];
        if (beforeShares == 0) {
            _addOwnedPlayerId(u, playerId);
        }

        // Update player & global share counts
        player storage p = players[playerId];
        p.shares += sharesToBuy;
        totalShares += sharesToBuy;

        // Credit user with the shares
        u.squad[playerId] += sharesToBuy;

        emit PlayerSharesBought(msg.sender, playerId, sharesToBuy, cost);
    }

    //function for selling player shares for chips
    function sellPlayerShares(uint256 playerId, uint256 sharesToSell, uint256 minChipsOut) external returns (uint256 chipsOut)
    {
        require(playerId != 0 && playerId <= nextPlayerId, "Invalid playerId");
        require(sharesToSell > 0, "Zero qty");
        require(_remainingGameweeks() > 0, "trading closed");

        user storage u = userProfiles[msg.sender];
        require(u.wallet != address(0), "User not registered");

        // Ownership checks
        uint256 userShares = u.squad[playerId];
        require(userShares >= sharesToSell, "Insufficient user shares");

        player storage p = players[playerId];
        require(p.shares >= sharesToSell, "Insufficient market depth");

        // Price from your existing quote function
        chipsOut = quoteSellReturn(playerId, sharesToSell);
        require(chipsOut >= minChipsOut, "Slippage");

        _claimPendingChips(msg.sender);

        // -------- Effects --------
        u.squad[playerId] -= sharesToSell;
        p.shares -= sharesToSell;
        totalShares -= sharesToSell;

        uint256 newUserShares = u.squad[playerId];
        if (newUserShares == 0) {
            _removeOwnedPlayerId(u, playerId);
        }

        // Mint chips to the seller to mirror the buy-path burn
        u.chips += chipsOut;
        totalChips += chipsOut;

        emit PlayerSharesSold(msg.sender, playerId, sharesToSell, chipsOut);
        return chipsOut;
    }

    /*//////////////////////////////////////////////////////////////
                         VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Fetch a player's points for a given gameweek from external store
    function getPlayerPoints(uint256 gameweek, uint256 playerId) external view returns (uint256) {
        return pointsStore.getPoints(gameweek, playerId);
    }

    //function for quoting the cost of buying fixed number of player shares
    function quoteBuyCost(uint256 playerId, uint256 sharesToBuy) public view returns (uint256 cost) {
        require(playerId != 0 && playerId <= nextPlayerId, "Invalid playerId");
        require(sharesToBuy > 0, "Zero qty");

        player storage p = players[playerId];
        uint256 P = p.basePrice;
        uint256 s0 = p.shares;
        uint256 scale = p.ownershipScaleFactor;
        uint256 k = sensitivityK;
        require(scale > 0 && k > 0, "bad params");

        uint256 N = sharesToBuy;

        // ---- compute cap threshold ----
        uint256 sCap = (cap * scale) / k; // supply where price hits 5P

        // ---- how much of this buy is below the cap? ----
        uint256 nLinear = 0;
        if (s0 < sCap) {
            uint256 room = sCap - s0;
            nLinear = N <= room ? N : room;
        }
        uint256 nFlat = N - nLinear;

        // ---- linear segment ----
        if (nLinear > 0) {
            uint256 a = nLinear;
            uint256 b = nLinear - 1;
            if ((a & 1) == 0) a /= 2; else b /= 2;
            uint256 tri = a * b; 

            uint256 varTerm = nLinear * s0 + tri;
            cost += P * nLinear;                       // base part
            cost += (P * k * varTerm) / scale;         // slope part
        }

        // ---- flat-at-cap segment ----
        if (nFlat > 0) {
            cost += (cap+1) * P * nFlat;
        }

        uint256 remainingGameweeks = _remainingGameweeks();
        cost = (cost*remainingGameweeks)/totalGameweeks;
    }

    //function for quoting the amount of chips received from selling a fixed number of player shares
    function quoteSellReturn(uint256 playerId, uint256 sharesToSell) public view returns (uint256 amt) {
        require(playerId != 0 && playerId <= nextPlayerId, "Invalid playerId");
        require(sharesToSell > 0, "Zero qty");

        player storage p = players[playerId];
        uint256 P     = p.basePrice;
        uint256 s0    = p.shares;                 // current supply
        uint256 scale     = p.ownershipScaleFactor;   // EMA scale
        uint256 k     = sensitivityK;             // slope multiplier
        require(scale > 0 && k > 0, "bad params");
        require(sharesToSell <= s0, "sell>circulating"); // optional guard

        uint256 N = sharesToSell;

        // Cap threshold: s >= 4S/k is on the flat (5*P) region
        uint256 sCap = (cap * scale) / k;

        // ---- flat-at-cap segment first (from the top down) ----
        // Selling from s0 steps down through s0-1, s0-2, ...
        // Any unit with (s-1) >= sCap pays 5*P.
        uint256 nFlat = 0;
        if (s0 > sCap) {
            uint256 maxFlat = s0 - sCap;              // how many top units are flat
            nFlat = N <= maxFlat ? N : maxFlat;
        }
        if (nFlat > 0) {
            amt += (cap+1) * P * nFlat;
        }

        // ---- linear segment below the cap ----
        uint256 nLinear = N - nFlat;
        if (nLinear > 0) {
            // We start the linear sum at sStart = s0 - nFlat
            // Sum_{t=0}^{nLinear-1} P*(1 + k*( (sStart-1 - t)/S ))
            // = P*nLinear + (P*k/S) * [ nLinear*(sStart-1) - nLinear*(nLinear-1)/2 ]
            uint256 sStart = s0 - nFlat;

            uint256 a = nLinear;
            uint256 b = nLinear - 1;
            if ((a & 1) == 0) a /= 2; else b /= 2;
            uint256 tri = a * b; 

            uint256 varTerm = nLinear * (sStart - 1) - tri;
            amt += P * nLinear;                 // base part
            amt += (P * k * varTerm) / scale;       // slope part
        }

        uint256 remainingGameweeks = _remainingGameweeks();
        amt = (amt*remainingGameweeks)/totalGameweeks;
    }

    function _remainingGameweeks() internal view returns (uint256 r) {
        require(totalGameweeks > 0, "season not configured");
        return (currentGameweek < totalGameweeks) ? (totalGameweeks - currentGameweek) : 0;
    }

    /*//////////////////////////////////////////////////////////////
                         INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    //internal function for claiming pending chips
    function _claimPendingChips(address account) internal returns (uint256 chipsClaimed) {
        uint256 cg = currentGameweek;
        if (cg == 0) return 0;
        user storage u = userProfiles[account];
        if (u.wallet == address(0)) return 0;

        uint256 fromGw = u.lastClaim + 1;
        uint256 toGw   = cg - 1;
        if (fromGw > toGw) return 0;
        require(address(pointsStore) != address(0), "Points store not set");

        // Reentrancy hardening: mark as claimed BEFORE any external calls
        u.lastClaim = toGw;

        uint256 len = u.ownedPlayerIds.length;
        for (uint256 i = 0; i < len; i++) {
            uint256 pid = u.ownedPlayerIds[i];
            uint256 shares = u.squad[pid];
            if (shares == 0) continue;

            for (uint256 gw = fromGw; gw <= toGw; gw++) {
                uint256 pts;
                // Swallow misbehaving store; treat as zero
                try pointsStore.getPoints(gw, pid) returns (uint256 _pts) { pts = _pts; } catch { pts = 0; }
                if (pts != 0) {
                    chipsClaimed += pts * shares;
                }
            }
        }

        if (chipsClaimed != 0) {
            u.chips += chipsClaimed;
            totalChips += chipsClaimed;
        }
        emit ChipsClaimed(account, fromGw, toGw, chipsClaimed);
        return chipsClaimed;
    }


    //adds owned ID to user array
    function _addOwnedPlayerId(user storage u, uint256 pid) internal {
        // Only add when transitioning from 0 -> >0 shares
        u.ownedPlayerIds.push(pid);
    }

    //remove owned ID from user array
    function _removeOwnedPlayerId(user storage u, uint256 pid) internal {
        uint256 len = u.ownedPlayerIds.length;
        for (uint256 i = 0; i < len; i++) {
            if (u.ownedPlayerIds[i] == pid) {
                u.ownedPlayerIds[i] = u.ownedPlayerIds[len - 1];
                u.ownedPlayerIds.pop();
                break;
            }
        }
    }
    

    /*//////////////////////////////////////////////////////////////
                         OWNER / ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setUSDC(address token) external onlyOwner {
        require(token != address(0), "Zero token");
        usdc = IERC20(token);
        emit USDCSet(token);
    }

    /// @notice Wire in the external points store contract
    function setPointsStore(address store) external onlyOwner {
        require(store != address(0), "Zero store");
        pointsStore = IGameweekPointsStore(store);
        emit PointsStoreSet(store);
    }

    //function for adding players to the game and initializing their properties
    function addPlayer(uint256 basePrice, uint256 initialScale) external onlyOwner returns (uint256 playerId) {
        require(initialScale > 0, "scale=0");
        playerId = ++nextPlayerId;
        player storage p = players[playerId];
        p.id = playerId;
        p.basePrice = basePrice;
        p.ownershipScaleFactor = initialScale;
    }

    // advance the current gameweek and update player scale factors
    function advanceGameweek() external onlyOwner {
        require(alpha <= 10_000, "alpha>10000");
        uint256 prev = currentGameweek;
        currentGameweek = prev + 1;
        for (uint256 pid = 1; pid <= nextPlayerId; pid++) {
            player storage pl = players[pid];
            pl.ownershipScaleFactor =
                ((pl.ownershipScaleFactor * (10_000 - alpha)) + (pl.shares * alpha)) / 10_000;
        }
        emit GameweekAdvanced(prev, currentGameweek);
    }

    //function for setting the bonding curve parameters
    function setCurveParams(uint256 _k, uint256 _cap) external onlyOwner {
        require(_k > 0, "k=0");
        require(_cap > 0, "cap=0");
        sensitivityK = _k;
        cap = _cap; // if cap=4 means price caps at (cap+1)*P = 5P
    }

    //function for setting the alpha parameter (weighted average of scaling factors)
    function setAlpha(uint256 _alphaBps) external onlyOwner {
        require(_alphaBps <= 10_000, "alpha>10000");
        alpha = _alphaBps;
    }

    //function for setting the ownership scale of players
    function setPlayerScale(uint256 playerId, uint256 newScale) external onlyOwner {
        require(playerId > 0 && playerId <= nextPlayerId, "bad id");
        require(newScale > 0, "scale=0");
        players[playerId].ownershipScaleFactor = newScale;
    }

}
