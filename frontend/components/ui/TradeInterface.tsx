'use client';

import { useState, useEffect } from 'react';
import { useExecuteTrades, useChipBalance, useQuoteBuyCost, useQuoteSellReturn } from '@/lib/contracts/hooks';
import { useAccount } from 'wagmi';
import { TradeOp } from '@/lib/contracts/types';
import { formatChips } from '@/lib/utils/format';
import toast from 'react-hot-toast';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/config';
import FantasyCoreABI from '@/lib/abis/FantasyCore.json';
import { useWriteContract, useReadContract } from 'wagmi';
import { calculatePriceImpact, calculateSlippage } from '@/lib/utils/calculations';

interface TradeOrder {
  action: 'BUY' | 'SELL';
  playerId: bigint;
  shares: bigint;
  estimatedCost?: bigint;
  currentPrice?: bigint;
  executionPrice?: bigint;
  priceImpact?: number;
  slippageTolerance: number;
}

export function TradeInterface() {
  const { address } = useAccount();
  const { data: chipBalance } = useChipBalance(address);
  const { writeContract, isPending } = useWriteContract();
  const [orders, setOrders] = useState<TradeOrder[]>([]);
  const [currentOrder, setCurrentOrder] = useState<TradeOrder>({
    action: 'BUY',
    playerId: 1n,
    shares: 1n,
    slippageTolerance: 1.0, // 1% default
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Fetch price quotes for current order
  const { data: buyQuote } = useQuoteBuyCost(
    currentOrder.playerId,
    currentOrder.shares
  );
  const { data: sellQuote } = useQuoteSellReturn(
    currentOrder.playerId,
    currentOrder.shares
  );

  // Update current order with price information
  useEffect(() => {
    if (currentOrder.action === 'BUY' && buyQuote) {
      const currentPrice = buyQuote / currentOrder.shares;
      const executionPrice = buyQuote / currentOrder.shares;
      const priceImpact = calculatePriceImpact(currentPrice, executionPrice);
      
      setCurrentOrder(prev => ({
        ...prev,
        estimatedCost: buyQuote,
        currentPrice,
        executionPrice,
        priceImpact,
      }));
    } else if (currentOrder.action === 'SELL' && sellQuote) {
      const currentPrice = sellQuote / currentOrder.shares;
      const executionPrice = sellQuote / currentOrder.shares;
      const priceImpact = calculatePriceImpact(currentPrice, executionPrice);
      
      setCurrentOrder(prev => ({
        ...prev,
        estimatedCost: sellQuote,
        currentPrice,
        executionPrice,
        priceImpact,
      }));
    }
  }, [buyQuote, sellQuote, currentOrder.action, currentOrder.shares]);

  const addOrder = () => {
    if (!currentOrder.estimatedCost) {
      toast.error('Unable to calculate trade cost');
      return;
    }

    setOrders([...orders, currentOrder]);
    setCurrentOrder({
      action: 'BUY',
      playerId: 1n,
      shares: 1n,
      slippageTolerance: 1.0,
    });
    toast.success('Order added to basket');
  };

  const removeOrder = (index: number) => {
    setOrders(orders.filter((_, i) => i !== index));
    toast.success('Order removed');
  };

  const executeTrades = async () => {
    if (orders.length === 0) {
      toast.error('No trades to execute');
      return;
    }

    const tradeOps: TradeOp[] = orders.map((order) => {
      const slippageMultiplier = 1 + (order.slippageTolerance / 100);
      const limit = order.action === 'BUY'
        ? order.estimatedCost ? BigInt(Math.floor(Number(order.estimatedCost) * slippageMultiplier)) : 0n
        : order.estimatedCost ? BigInt(Math.floor(Number(order.estimatedCost) / slippageMultiplier)) : 0n;

      return {
        action: order.action === 'BUY' ? 0 : 1,
        playerId: order.playerId,
        shares: order.shares,
        limit,
      };
    });

    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.fantasyCore as `0x${string}`,
        abi: FantasyCoreABI,
        functionName: 'executeTrades',
        args: [tradeOps],
      });
      toast.success('Trades executed successfully!');
      setOrders([]);
    } catch (error) {
      toast.error('Trade execution failed');
      console.error(error);
    }
  };

  const totalCost = orders.reduce((sum, order) => {
    return order.action === 'BUY' 
      ? sum + (order.estimatedCost || 0n)
      : sum - (order.estimatedCost || 0n);
  }, 0n);

  const totalImpact = orders.reduce((sum, order) => {
    return sum + (order.priceImpact || 0);
  }, 0) / Math.max(orders.length, 1);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Trade Basket</h2>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-blue-600 hover:underline text-sm"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
        </button>
      </div>
      
      {/* Add Order Form */}
      <div className="mb-6 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-3">Add Trade Order</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Action</label>
            <select
              value={currentOrder.action}
              onChange={(e) => setCurrentOrder({
                ...currentOrder,
                action: e.target.value as 'BUY' | 'SELL'
              })}
              className="w-full p-2 border rounded"
            >
              <option value="BUY">Buy</option>
              <option value="SELL">Sell</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Player ID</label>
            <input
              type="number"
              value={currentOrder.playerId.toString()}
              onChange={(e) => setCurrentOrder({
                ...currentOrder,
                playerId: BigInt(e.target.value || 1)
              })}
              className="w-full p-2 border rounded"
              min="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Shares</label>
            <input
              type="number"
              value={currentOrder.shares.toString()}
              onChange={(e) => setCurrentOrder({
                ...currentOrder,
                shares: BigInt(e.target.value || 1)
              })}
              className="w-full p-2 border rounded"
              min="1"
            />
          </div>
          {showAdvanced && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Slippage Tolerance (%)
              </label>
              <input
                type="number"
                value={currentOrder.slippageTolerance}
                onChange={(e) => setCurrentOrder({
                  ...currentOrder,
                  slippageTolerance: parseFloat(e.target.value) || 1.0
                })}
                className="w-full p-2 border rounded"
                min="0.1"
                max="10"
                step="0.1"
              />
            </div>
          )}
        </div>

        {/* Price Impact Preview */}
        {currentOrder.estimatedCost && (
          <div className="mt-4 p-3 bg-blue-50 rounded">
            <h4 className="font-semibold text-sm mb-2">Trade Preview</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Current Price:</span>
                <span className="ml-2 font-semibold">
                  {formatChips(currentOrder.currentPrice || 0n)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Execution Price:</span>
                <span className="ml-2 font-semibold">
                  {formatChips(currentOrder.executionPrice || 0n)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Total Cost:</span>
                <span className="ml-2 font-semibold text-blue-600">
                  {formatChips(currentOrder.estimatedCost)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Price Impact:</span>
                <span className={`ml-2 font-semibold ${
                  (currentOrder.priceImpact || 0) > 5 ? 'text-red-600' : 
                  (currentOrder.priceImpact || 0) > 2 ? 'text-yellow-600' : 
                  'text-green-600'
                }`}>
                  {currentOrder.priceImpact?.toFixed(2) || '0.00'}%
                </span>
              </div>
            </div>
            {(currentOrder.priceImpact || 0) > 5 && (
              <div className="mt-2 text-xs text-red-600">
                ⚠️ High price impact detected. Consider reducing trade size.
              </div>
            )}
          </div>
        )}

        <button
          onClick={addOrder}
          disabled={!currentOrder.estimatedCost}
          className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition disabled:opacity-50"
        >
          Add to Basket
        </button>
      </div>

      {/* Orders List */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3">Pending Orders ({orders.length})</h3>
        {orders.length === 0 ? (
          <p className="text-gray-500">No orders added yet</p>
        ) : (
          <div className="space-y-2">
            {orders.map((order, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    order.action === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {order.action}
                  </span>
                  <span>Player #{order.playerId.toString()}</span>
                  <span>{order.shares.toString()} shares</span>
                  {order.estimatedCost && (
                    <>
                      <span className="text-gray-600">
                        ~{formatChips(order.estimatedCost)} chips
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        (order.priceImpact || 0) > 5 ? 'bg-red-100 text-red-800' : 
                        (order.priceImpact || 0) > 2 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'
                      }`}>
                        Impact: {order.priceImpact?.toFixed(2) || '0.00'}%
                      </span>
                      <span className="text-xs text-gray-600">
                        Slippage: {order.slippageTolerance}%
                      </span>
                    </>
                  )}
                </div>
                <button
                  onClick={() => removeOrder(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="border-t pt-4">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between">
            <span>Current Balance:</span>
            <span className="font-semibold">{formatChips(chipBalance || 0n)} chips</span>
          </div>
          <div className="flex justify-between">
            <span>Estimated Total:</span>
            <span className={`font-semibold ${totalCost < 0n ? 'text-green-600' : 'text-red-600'}`}>
              {totalCost < 0n ? '+' : '-'}{formatChips(totalCost < 0n ? -totalCost : totalCost)} chips
            </span>
          </div>
          <div className="flex justify-between">
            <span>Average Price Impact:</span>
            <span className={`font-semibold ${
              totalImpact > 5 ? 'text-red-600' : 
              totalImpact > 2 ? 'text-yellow-600' : 
              'text-green-600'
            }`}>
              {totalImpact.toFixed(2)}%
            </span>
          </div>
          {chipBalance && totalCost > 0n && (
            <div className="flex justify-between">
              <span>Balance After:</span>
              <span className={`font-semibold ${
                chipBalance - totalCost < 0n ? 'text-red-600' : 'text-gray-900'
              }`}>
                {chipBalance - totalCost < 0n ? 
                  'Insufficient funds!' : 
                  formatChips(chipBalance - totalCost)
                } chips
              </span>
            </div>
          )}
        </div>

        <button
          onClick={executeTrades}
          disabled={
            orders.length === 0 || 
            isPending || 
            (chipBalance && totalCost > 0n && chipBalance < totalCost)
          }
          className="w-full bg-green-600 text-white py-3 px-4 rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Executing...' : `Execute ${orders.length} Trade${orders.length !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
}
