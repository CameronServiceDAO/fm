// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

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
    //player struct
    struct player {
        uint256 id;
        uint256 basePrice;
        mapping(uint256 => uint256) scoresByGameweek;
        uint256 shares;
        uint256 slope;
    }

    //user struct
    struct user {
        address wallet;
        uint256 chips;
        uint256 lastClaim;
        uint256[] ownedPlayerIds;
        mapping(uint256 => uint256) squad; // playerId => shares
    }

    //struct for a trade operation
    struct TradeOp {
        uint8 action;       // 0=BUY, 1=SELL
        uint256 playerId;
        uint256 shares;     // > 0
        uint256 limit;      // BUY: maxSpendChips   SELL: minChipsOut
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
    // USDC token contract
    IERC20 public usdc;                               
    //external points store
    IGameweekPointsStore public pointsStore;         
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
    event SeasonInitialized(uint256 totalGameweeks, uint256 currentGameweek);
    event UserRegistered(address indexed user);



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
        require(currentGameweek > 0, "Current GW not set");

        uint256 fromGw = u.lastClaim + 1;
        uint256 toGw   = currentGameweek - 1;
        require(fromGw <= toGw, "Nothing to claim");

        // reentrancy hardening
        u.lastClaim = toGw;

        uint256 prev = 0;
        for (uint256 i = 0; i < ownedPlayerIds.length; i++) {
            uint256 pid = ownedPlayerIds[i];
            require(i == 0 || pid > prev, "playerIds not strictly increasing");
            prev = pid;

            uint256 shares = u.squad[pid];
            if (shares == 0) continue;

            for (uint256 gw = fromGw; gw <= toGw; gw++) {
                uint256 pts;
                try pointsStore.getPoints(gw, pid) returns (uint256 _pts) { pts = _pts; } catch { pts = 0; }
                if (pts != 0) chipsClaimed += pts * shares;
            }
        }
        if (chipsClaimed != 0) { u.chips += chipsClaimed; totalChips += chipsClaimed; }
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

    //Execute a sequence of buys and sells atomically, in order.
    function executeTrades(TradeOp[] calldata ops) external returns (uint256 totalCost, uint256 totalPayout) {
        require(ops.length > 0, "empty");
        require(_remainingGameweeks() > 0, "trading closed");

        // Claim up to last completed GW BEFORE changing holdings/cost checks
        _claimPendingChips(msg.sender);

        user storage u = userProfiles[msg.sender];
        require(u.wallet != address(0), "User not registered");

        for (uint256 i = 0; i < ops.length; i++) {
            TradeOp calldata op = ops[i];
            uint256 pid = op.playerId;
            uint256 qty = op.shares;

            require(pid != 0 && pid <= nextPlayerId, "bad id");
            require(qty > 0, "zero qty");

            player storage p = players[pid];

            if (op.action == 0) {
                // -------- BUY --------
                uint256 cost = quoteBuyCost(pid, qty);
                require(cost <= op.limit, "Cost > max");
                require(u.chips >= cost, "Insufficient chips");

                // Pay & burn chips
                u.chips -= cost;
                totalChips -= cost;

                // Update market and holdings
                uint256 before = u.squad[pid];
                if (before == 0) _addOwnedPlayerId(u, pid);
                u.squad[pid] = before + qty;

                p.shares += qty;
                totalShares += qty;

                emit PlayerSharesBought(msg.sender, pid, qty, cost);
                totalCost += cost;

            } else if (op.action == 1) {
                // -------- SELL --------
                uint256 userShares = u.squad[pid];
                require(userShares >= qty, "Insufficient user shares");
                require(p.shares >= qty, "Insufficient depth");

                uint256 out = quoteSellReturn(pid, qty);
                require(out >= op.limit, "Slippage");

                // Update holdings & market
                uint256 newUserShares = userShares - qty;
                u.squad[pid] = newUserShares;
                p.shares -= qty;
                totalShares -= qty;
                if (newUserShares == 0) _removeOwnedPlayerId(u, pid);

                // Mint chips back
                u.chips += out;
                totalChips += out;

                emit PlayerSharesSold(msg.sender, pid, qty, out);
                totalPayout += out;

            } else {
                revert("bad action");
            }
        }
    }

//register a user profile
function register() external {
    user storage u = userProfiles[msg.sender];
    require(u.wallet == address(0), "already registered");
    u.wallet = msg.sender;
    emit UserRegistered(msg.sender);
}

//Register a user profile and (optionally) fund it with chips in one tx.
function registerAndFund(uint256 usdcAmount, uint256 minChipsOut) external returns (uint256 chipsOut)
{
    // Create profile if needed
    user storage u = userProfiles[msg.sender];
    if (u.wallet == address(0)) {
        u.wallet = msg.sender;
        emit UserRegistered(msg.sender);
    }

    // Optional funding in the same tx
    if (usdcAmount == 0) {
        // no funding; make sure caller didn't set a positive min
        require(minChipsOut == 0, "min>0 with zero usdc");
        return 0;
    }

    // Standard USDC->chips mint (same math as buyChipsWithUSDC)
    require(address(usdc) != address(0), "USDC not set");
    require(usdc.allowance(msg.sender, address(this)) >= usdcAmount, "Insufficient allowance");

    uint256 P = prizePool;
    uint256 S = totalChips;

    if (S == 0 || P == 0) {
        // bootstrap: 1 USDC -> 1 chip
        chipsOut = usdcAmount;
    } else {
        // ΔS = S * U / P (keeps per-chip pool value constant)
        chipsOut = (S * usdcAmount) / P;
    }

    require(chipsOut > 0, "ChipsOut rounds to zero");
    require(chipsOut >= minChipsOut, "Slippage: chipsOut < min");

    // Pull funds and mint chips
    require(usdc.transferFrom(msg.sender, address(this), usdcAmount), "USDC transfer failed");

    u.chips += chipsOut;
    totalChips = S + chipsOut;
    prizePool  = P + usdcAmount;
    emit ChipsPurchased(msg.sender, usdcAmount, chipsOut, totalChips, prizePool);
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
        uint256 P   = p.basePrice;           // P0
        uint256 s0  = p.shares;              // current supply
        uint256 a   = p.slope;              // per-player slope
        require(a > 0, "a=0");

        uint256 N   = sharesToBuy;

        // Threshold where linear hits the flat: P0 + a*sCap = (cap+1)*P0  =>  sCap = cap*P0 / a
        uint256 sCap = (cap * P) / a;        // with cap=9, flat begins at 10x P0

        // how much of this buy is below the cap?
        uint256 nLinear = 0;
        if (s0 < sCap) {
            uint256 room = sCap - s0;
            nLinear = N <= room ? N : room;
        }
        uint256 nFlat = N - nLinear;

        // linear segment sum: sum_{t=0}^{nLinear-1} (P + a*(s0+t))
        if (nLinear > 0) {
            uint256 x = nLinear;
            uint256 y = nLinear - 1;
            if ((x & 1) == 0) x /= 2; else y /= 2;
            uint256 tri = x * y;                 // nLinear*(nLinear-1)/2

            uint256 varTerm = nLinear * s0 + tri;
            cost += P * nLinear;                 // base part
            cost += a * varTerm;                 // slope part  (REPLACED old (P*k*varTerm)/scale)
        }

        // flat-at-cap segment: (cap+1)*P each (with cap=9 => 10*P)
        if (nFlat > 0) {
            cost += (cap + 1) * P * nFlat;
        }

        uint256 remainingGameweeks = _remainingGameweeks();
        cost = (cost * remainingGameweeks) / totalGameweeks;
    }

    //function for quoting the amount of chips received from selling a fixed number of player shares
    function quoteSellReturn(uint256 playerId, uint256 sharesToSell) public view returns (uint256 amt) {
        require(playerId != 0 && playerId <= nextPlayerId, "Invalid playerId");
        require(sharesToSell > 0, "Zero qty");

        player storage p = players[playerId];
        uint256 P   = p.basePrice;           // P0
        uint256 s0  = p.shares;              // current supply
        uint256 a   = p.slope;              // per-player slope
        require(a > 0, "a=0");
        require(sharesToSell <= s0, "sell>circulating");

        uint256 N   = sharesToSell;

        // sCap = cap*P0 / a
        uint256 sCap = (cap * P) / a;        // cap=9 -> flat at 10x P0

        // Flat segment first (from the top down)
        uint256 nFlat = 0;
        if (s0 > sCap) {
            uint256 maxFlat = s0 - sCap;
            nFlat = N <= maxFlat ? N : maxFlat;
            if (nFlat > 0) {
                amt += (cap + 1) * P * nFlat; // 10*P when cap=9
            }
        }

        // Linear segment below the cap
        uint256 nLinear = N - nFlat;
        if (nLinear > 0) {
            uint256 sStart = s0 - nFlat;      // first linear unit has supply sStart-1

            uint256 x = nLinear;
            uint256 y = nLinear - 1;
            if ((x & 1) == 0) x /= 2; else y /= 2;
            uint256 tri = x * y;              // nLinear*(nLinear-1)/2

            // sum_{t=0}^{nLinear-1} (P + a*((sStart-1) - t))
            // = P*nLinear + a * [ nLinear*(sStart-1) - nLinear*(nLinear-1)/2 ]
            amt += P * nLinear;
            amt += a * (nLinear * (sStart - 1) - tri);  // REPLACED old (P*k*varTerm)/scale
        }

        uint256 remainingGameweeks = _remainingGameweeks();
        amt = (amt * remainingGameweeks) / totalGameweeks;
    }

    function _remainingGameweeks() internal view returns (uint256 r) {
        require(totalGameweeks > 0, "season not configured");
        return (currentGameweek < totalGameweeks) ? (totalGameweeks - currentGameweek) : 0;
    }

    //function for getting player details
    function getPlayer(uint256 playerId) external view returns (uint256 basePrice, uint256 shares, uint256 slope_) {
        player storage p = players[playerId];
        return (p.basePrice, p.shares, p.slope);
    }

    //function for getting user share of a player
    function getUserShare(address wallet, uint256 playerId) external view returns (uint256) {
        return userProfiles[wallet].squad[playerId];
    }

    //function for getting array of all player ID's owned by user
    function getOwnedPlayerIds(address wallet) external view returns (uint256[] memory) {
        return userProfiles[wallet].ownedPlayerIds;
    }

    //function for getting the balance of chips owned by a user
    function chipBalanceOf(address wallet) external view returns (uint256) {
        return userProfiles[wallet].chips;
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
    function addPlayer(uint256 basePrice, uint256 initialSlope) external onlyOwner returns (uint256 playerId) {
        require(initialSlope > 0, "slope=0");
        playerId = ++nextPlayerId;
        player storage p = players[playerId];
        p.id = playerId;
        p.basePrice = basePrice;
        p.slope = initialSlope;
    }

    // advance the current gameweek and update player scale factors
    function advanceGameweek() external onlyOwner {
        uint256 prev = currentGameweek;
        currentGameweek = prev + 1;
        emit GameweekAdvanced(prev, currentGameweek);
    }

    //function for setting the bonding curve price cap
    function setCap(uint256 _cap) external onlyOwner {
        require(_cap > 0, "cap=0");
        cap = _cap; // if cap=4 means price caps at (cap+1)*P = 5P
    }

    function initSeason(uint256 _totalGameweeks, uint256 _currentGameweek) external onlyOwner {
        require(_totalGameweeks > 0, "bad season");
        require(_currentGameweek <= _totalGameweeks, "bad current");
        totalGameweeks = _totalGameweeks;
        currentGameweek = _currentGameweek; // often 1
        emit SeasonInitialized(_totalGameweeks, _currentGameweek);
    }
}
