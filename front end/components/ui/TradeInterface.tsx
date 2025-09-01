'use client';

import { useState } from 'react';
import { useExecuteTrades, useChipBalance, useQuoteBuyCost, useQuoteSellReturn } from '@/lib/contracts/hooks';
import { useAccount } from 'wagmi';
import { TradeOp } from '@/lib/contracts/types';
import { formatChips } from '@/lib/utils/format';
import toast from 'react-hot-toast';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/config';
import FantasyCoreABI from '@/lib/abis/FantasyCore.json';

interface TradeOrder {
  action: 'BUY' | 'SELL';
  playerId: bigint;
  shares: bigint;
  estimatedCost?: bigint;
}

export function TradeInterface() {
  const { address } = useAccount();
  const { data: chipBalance } = useChipBalance(address);
  const { writeContract, isPending } = useExecuteTrades();
  const [orders, setOrders] = useState<TradeOrder[]>([]);
  const [currentOrder, setCurrentOrder] = useState<TradeOrder>({
    action: 'BUY',
    playerId: 1n,
    shares: 1n,
  });

  const addOrder = () => {
    setOrders([...orders, currentOrder]);
    setCurrentOrder({
      action: 'BUY',
      playerId: 1n,
      shares: 1n,
    });
  };

  const removeOrder = (index: number) => {
    setOrders(orders.filter((_, i) => i !== index));
  };

  const executeTrades = async () => {
    if (orders.length === 0) {
      toast.error('No trades to execute');
      return;
    }

    const tradeOps: TradeOp[] = await Promise.all(
      orders.map(async (order) => {
        const limit = order.action === 'BUY'
          ? order.estimatedCost ? order.estimatedCost * 101n / 100n : 0n // 1% slippage
          : order.estimatedCost ? order.estimatedCost * 99n / 100n : 0n; // 1% slippage

        return {
          action: order.action === 'BUY' ? 0 : 1,
          playerId: order.playerId,
          shares: order.shares,
          limit,
        };
      })
    );

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

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Trade Basket</h2>
      
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
          <div className="flex items-end">
            <button
              onClick={addOrder}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
            >
              Add to Basket
            </button>
          </div>
        </div>
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
                    <span className="text-gray-600">
                      ~{formatChips(order.estimatedCost)} chips
                    </span>
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
        <div className="flex justify-between mb-2">
          <span>Current Balance:</span>
          <span className="font-semibold">{formatChips(chipBalance || 0n)} chips</span>
        </div>
        <div className="flex justify-between mb-4">
          <span>Estimated Total:</span>
          <span className={`font-semibold ${totalCost < 0n ? 'text-green-600' : 'text-red-600'}`}>
            {totalCost < 0n ? '+' : '-'}{formatChips(totalCost < 0n ? -totalCost : totalCost)} chips
          </span>
        </div>
        <button
          onClick={executeTrades}
          disabled={orders.length === 0 || isPending}
          className="w-full bg-green-600 text-white py-3 px-4 rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Executing...' : `Execute ${orders.length} Trade${orders.length !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
}
