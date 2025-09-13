'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { useChipBalance, useTotalChips, usePrizePool } from '@/lib/contracts/hooks';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/config';
import FantasyCoreABI from '@/lib/abis/FantasyCore.json';
import MockUSDCABI from '@/lib/abis/MockUSDC.json';
import { parseUnits } from 'viem';
import { formatChips, formatUSDC } from '@/lib/utils/format';
import toast from 'react-hot-toast';

export default function ChipsPage() {
  const { address, isConnected } = useAccount();
  const { data: chipBalance } = useChipBalance(address);
  const { data: totalChips } = useTotalChips();
  const { data: prizePool } = usePrizePool();
  const { writeContract, isPending } = useWriteContract();
  
  const [amount, setAmount] = useState('100');
  const [isApproving, setIsApproving] = useState(false);

  // Read USDC balance
  const { data: usdcBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.mockUSDC as `0x${string}`,
    abi: MockUSDCABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // Calculate chips output
  const calculateChipsOut = (usdcAmount: bigint): bigint => {
    if (!totalChips || !prizePool || totalChips === 0n || prizePool === 0n) {
      return usdcAmount; // 1:1 for bootstrap
    }
    return (totalChips * usdcAmount) / prizePool;
  };

  const handleBuyChips = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const usdcAmount = parseUnits(amount, 6); // USDC has 6 decimals
      const estimatedChips = calculateChipsOut(usdcAmount);
      const minChipsOut = (estimatedChips * 99n) / 100n; // 1% slippage

      setIsApproving(true);
      
      // First approve USDC
      await writeContract({
        address: CONTRACT_ADDRESSES.mockUSDC as `0x${string}`,
        abi: MockUSDCABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.fantasyCore, usdcAmount],
      });

      // Wait a bit for approval to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsApproving(false);

      // Then buy chips
      await writeContract({
        address: CONTRACT_ADDRESSES.fantasyCore as `0x${string}`,
        abi: FantasyCoreABI,
        functionName: 'buyChipsWithUSDC',
        args: [usdcAmount, minChipsOut],
      });

      toast.success('Chips purchased successfully!');
      setAmount('100');
    } catch (error) {
      setIsApproving(false);
      toast.error('Transaction failed');
      console.error(error);
    }
  };

  const handleGetTestUSDC = async () => {
    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.mockUSDC as `0x${string}`,
        abi: MockUSDCABI,
        functionName: 'mint',
        args: [address, parseUnits('1000', 6)], // Mint 1000 USDC
      });
      toast.success('Test USDC minted!');
    } catch (error) {
      toast.error('Failed to mint test USDC');
      console.error(error);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Buy Chips</h1>
        <p className="text-gray-600">Please connect your wallet to buy chips</p>
      </div>
    );
  }

  const usdcAmount = amount ? parseUnits(amount, 6) : 0n;
  const estimatedChips = calculateChipsOut(usdcAmount);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Buy Chips</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm text-gray-600 mb-2">Your Chips</h3>
          <p className="text-2xl font-bold text-blue-600">
            {formatChips(chipBalance || 0n)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm text-gray-600 mb-2">Your USDC</h3>
          <p className="text-2xl font-bold text-green-600">
            {formatUSDC(usdcBalance || 0n)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm text-gray-600 mb-2">Prize Pool</h3>
          <p className="text-2xl font-bold text-purple-600">
            {formatUSDC(prizePool || 0n)}
          </p>
        </div>
      </div>

      {/* Buy Chips Card */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <h2 className="text-2xl font-semibold mb-6">Purchase Chips</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">USDC Amount</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 p-3 border rounded-lg text-lg"
                placeholder="Enter USDC amount"
                min="0"
                step="10"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setAmount('100')}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
                >
                  $100
                </button>
                <button
                  onClick={() => setAmount('500')}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
                >
                  $500
                </button>
                <button
                  onClick={() => setAmount('1000')}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
                >
                  $1000
                </button>
              </div>
            </div>
          </div>

          {/* Exchange Rate Display */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">You Pay:</span>
              <span className="text-xl font-semibold">{formatUSDC(usdcAmount)}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-600">You Receive (estimated):</span>
              <span className="text-xl font-semibold text-blue-600">
                {formatChips(estimatedChips)} chips
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-600">Exchange Rate:</span>
              <span className="text-sm">
                1 USDC = {estimatedChips && usdcAmount > 0n 
                  ? (Number(estimatedChips) / Number(usdcAmount) * 1e6).toFixed(2)
                  : '1.00'
                } chips
              </span>
            </div>
          </div>

          {/* Buy Button */}
          <button
            onClick={handleBuyChips}
            disabled={isPending || isApproving || !amount || parseFloat(amount) <= 0}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg text-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isApproving ? 'Approving USDC...' : isPending ? 'Buying Chips...' : 'Buy Chips'}
          </button>

          {/* Slippage Notice */}
          <p className="text-sm text-gray-500 text-center">
            Transaction includes 1% slippage tolerance
          </p>
        </div>
      </div>

      {/* Test USDC Card (for testnet) */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">Test Environment</h3>
        <p className="text-gray-600 mb-4">
          Need test USDC? Click below to mint 1000 test USDC to your wallet.
        </p>
        <button
          onClick={handleGetTestUSDC}
          disabled={isPending}
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition disabled:opacity-50"
        >
          Get Test USDC
        </button>
      </div>

      {/* How It Works */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">How Chips Work</h3>
        <div className="space-y-3 text-gray-600">
          <div className="flex items-start">
            <span className="text-blue-600 mr-2">1.</span>
            <p>Purchase chips using USDC to participate in the platform</p>
          </div>
          <div className="flex items-start">
            <span className="text-blue-600 mr-2">2.</span>
            <p>Use chips to trade player shares on the market</p>
          </div>
          <div className="flex items-start">
            <span className="text-blue-600 mr-2">3.</span>
            <p>Earn additional chips based on your players&apos; performance</p>
          </div>
          <div className="flex items-start">
            <span className="text-blue-600 mr-2">4.</span>
            <p>Redeem chips for USDC from the prize pool at season end</p>
          </div>
        </div>
      </div>
    </div>
  );
}
